-- 동의 이력 저장소와 기록 경로.
--
-- 문서 버전의 단일 출처는 `src/lib/legal/legalDocuments.ts`다.
-- 데이터베이스는 "현재 버전"을 알지 못하며, 클라이언트가 동의한 버전을 그대로 기록만 한다.
-- DB에 버전을 하드코딩하면 TS 상수만 올렸을 때 재동의가 영원히 해소되지 않는다.
-- (게이트가 재동의를 요구 → RPC가 구버전으로 기록 → 다시 요구)
--
-- 시각은 반대로 항상 데이터베이스의 `now()`를 쓴다. 클라이언트 시각은 신뢰하지 않는다.

alter table public.profiles
  add column if not exists terms_version text,
  add column if not exists terms_agreed_at timestamptz,
  add column if not exists privacy_version text,
  add column if not exists privacy_agreed_at timestamptz,
  add column if not exists age_confirmed_at timestamptz;

create table if not exists public.user_legal_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  terms_version text not null,
  privacy_version text not null,
  age_confirmed_at timestamptz not null,
  recorded_at timestamptz not null default now()
);

create index if not exists idx_user_legal_consents_user_recorded_at
on public.user_legal_consents(user_id, recorded_at desc);

alter table public.user_legal_consents enable row level security;

-- 조회 정책만 둔다. 쓰기는 아래 security definer 함수로만 가능하므로
-- 클라이언트가 동의 이력을 직접 만들거나 고칠 수 없다.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_legal_consents'
      and policyname = 'Users can read their own legal consent history'
  ) then
    create policy "Users can read their own legal consent history"
      on public.user_legal_consents
      for select to authenticated
      using (user_id = auth.uid());
  end if;
end $$;

-- 전달받은 문서 버전 문자열의 최소 유효성만 확인한다.
create or replace function public.assert_legal_version(label text, value text)
returns text
language plpgsql
immutable
set search_path = public
as $$
begin
  if value is null or btrim(value) = '' then
    raise exception '% version is required', label
      using errcode = '22023';
  end if;

  if length(btrim(value)) > 32 then
    raise exception '% version is too long', label
      using errcode = '22023';
  end if;

  return btrim(value);
end;
$$;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  consented_at timestamptz := now();
  -- 컬럼명과 같은 이름을 쓰면 PL/pgSQL이 모호성 오류를 낸다.
  v_terms_version text;
  v_privacy_version text;
begin
  -- 이 트리거는 `after insert or update of email`로 걸려 있다.
  -- 동의 검증을 INSERT로 한정하지 않으면 기존 가입자의 이메일 변경이 실패한다.
  if TG_OP = 'INSERT' then
    if coalesce(new.raw_user_meta_data ->> 'terms_agreed', 'false') <> 'true'
      or coalesce(new.raw_user_meta_data ->> 'privacy_agreed', 'false') <> 'true'
      or coalesce(new.raw_user_meta_data ->> 'age_confirmed', 'false') <> 'true' then
      raise exception 'Terms, privacy, and age confirmation are required'
        using errcode = '22023';
    end if;

    v_terms_version := public.assert_legal_version(
      'terms', new.raw_user_meta_data ->> 'terms_version');
    v_privacy_version := public.assert_legal_version(
      'privacy', new.raw_user_meta_data ->> 'privacy_version');

    insert into public.profiles (
      id,
      email,
      terms_version,
      terms_agreed_at,
      privacy_version,
      privacy_agreed_at,
      age_confirmed_at
    )
    values (
      new.id,
      new.email,
      v_terms_version,
      consented_at,
      v_privacy_version,
      consented_at,
      consented_at
    )
    -- 프로필이 이미 있는 경우에도 동의 열을 반드시 갱신한다.
    -- 이메일만 갱신하면 `user_legal_consents`에는 기록이 남는데
    -- `profiles`는 비어 있어 두 테이블이 어긋난다.
    on conflict (id) do update
    set email = excluded.email,
        terms_version = excluded.terms_version,
        terms_agreed_at = excluded.terms_agreed_at,
        privacy_version = excluded.privacy_version,
        privacy_agreed_at = excluded.privacy_agreed_at,
        age_confirmed_at = excluded.age_confirmed_at;

    insert into public.user_legal_consents (
      user_id,
      terms_version,
      privacy_version,
      age_confirmed_at,
      recorded_at
    )
    values (
      new.id,
      v_terms_version,
      v_privacy_version,
      consented_at,
      consented_at
    );
  else
    insert into public.profiles(id, email)
    values (new.id, new.email)
    on conflict (id) do update
    set email = excluded.email;
  end if;

  return new;
end;
$$;

-- 기존 가입자의 재동의 기록. 호출자는 자기 자신의 행만 갱신할 수 있다.
create or replace function public.record_current_legal_consent(
  p_terms_version text,
  p_privacy_version text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  consented_at timestamptz := now();
  -- 컬럼명과 같은 이름을 쓰면 `set terms_version = terms_version`이 모호해진다.
  v_terms_version text;
  v_privacy_version text;
begin
  if current_user_id is null then
    raise exception 'Authentication is required'
      using errcode = '42501';
  end if;

  v_terms_version := public.assert_legal_version('terms', p_terms_version);
  v_privacy_version := public.assert_legal_version('privacy', p_privacy_version);

  update public.profiles
  set terms_version = v_terms_version,
      terms_agreed_at = consented_at,
      privacy_version = v_privacy_version,
      privacy_agreed_at = consented_at,
      age_confirmed_at = consented_at
  where id = current_user_id;

  if not found then
    raise exception 'Profile not found for authenticated user'
      using errcode = 'P0002';
  end if;

  insert into public.user_legal_consents (
    user_id,
    terms_version,
    privacy_version,
    age_confirmed_at,
    recorded_at
  )
  values (
    current_user_id,
    v_terms_version,
    v_privacy_version,
    consented_at,
    consented_at
  );
end;
$$;

-- 인자 없는 구버전이 남아 있으면 PostgREST가 오버로드로 노출한다.
drop function if exists public.record_current_legal_consent();

revoke all on function public.record_current_legal_consent(text, text) from public;
grant execute on function public.record_current_legal_consent(text, text) to authenticated;
