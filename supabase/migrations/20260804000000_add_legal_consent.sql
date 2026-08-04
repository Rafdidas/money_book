alter table public.profiles
  add column if not exists terms_version text,
  add column if not exists terms_agreed_at timestamptz,
  add column if not exists privacy_version text,
  add column if not exists privacy_agreed_at timestamptz,
  add column if not exists age_confirmed_at timestamptz;

create table public.user_legal_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  terms_version text not null,
  privacy_version text not null,
  age_confirmed_at timestamptz not null,
  recorded_at timestamptz not null default now()
);

alter table public.user_legal_consents enable row level security;

create policy "Users can read their own legal consent history"
  on public.user_legal_consents
  for select to authenticated
  using (user_id = auth.uid());

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  consented_at timestamptz := now();
begin
  if TG_OP = 'INSERT' then
    if coalesce(new.raw_user_meta_data ->> 'terms_agreed', 'false') <> 'true'
      or coalesce(new.raw_user_meta_data ->> 'privacy_agreed', 'false') <> 'true'
      or coalesce(new.raw_user_meta_data ->> 'age_confirmed', 'false') <> 'true' then
      raise exception 'Terms, privacy, and age confirmation are required'
        using errcode = '22023';
    end if;

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
      '2026-08-04',
      consented_at,
      '2026-08-04',
      consented_at,
      consented_at
    )
    on conflict (id) do update
    set email = excluded.email;

    insert into public.user_legal_consents (
      user_id,
      terms_version,
      privacy_version,
      age_confirmed_at,
      recorded_at
    )
    values (
      new.id,
      '2026-08-04',
      '2026-08-04',
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

create or replace function public.record_current_legal_consent()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  consented_at timestamptz := now();
begin
  if current_user_id is null then
    raise exception 'Authentication is required'
      using errcode = '42501';
  end if;

  update public.profiles
  set terms_version = '2026-08-04',
      terms_agreed_at = consented_at,
      privacy_version = '2026-08-04',
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
    '2026-08-04',
    '2026-08-04',
    consented_at,
    consented_at
  );
end;
$$;

revoke all on function public.record_current_legal_consent() from public;
grant execute on function public.record_current_legal_consent() to authenticated;
