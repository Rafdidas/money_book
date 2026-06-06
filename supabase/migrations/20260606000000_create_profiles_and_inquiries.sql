create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'USER' check (role in ('USER', 'ADMIN')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

insert into public.profiles(id, email)
select id, email
from auth.users
on conflict (id) do update
set email = excluded.email;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(id, email)
  values (new.id, new.email)
  on conflict (id) do update
  set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
after insert or update of email on auth.users
for each row execute function public.handle_new_user_profile();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'ADMIN'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text,
  title text not null check (char_length(title) between 2 and 100),
  content text not null check (char_length(content) between 10 and 5000),
  status text not null default 'PENDING' check (status in ('PENDING', 'ANSWERED')),
  answer_title text check (answer_title is null or char_length(answer_title) between 2 and 100),
  answer_content text check (answer_content is null or char_length(answer_content) between 2 and 5000),
  answered_by uuid references auth.users(id) on delete set null,
  answered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'PENDING' and answer_title is null and answer_content is null and answered_by is null and answered_at is null)
    or
    (status = 'ANSWERED' and answer_title is not null and answer_content is not null and answered_by is not null and answered_at is not null)
  )
);

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'set_profiles_updated_at'
  ) then
    create trigger set_profiles_updated_at
      before update on public.profiles
      for each row execute function public.update_updated_at_column();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'set_inquiries_updated_at'
  ) then
    create trigger set_inquiries_updated_at
      before update on public.inquiries
      for each row execute function public.update_updated_at_column();
  end if;
end $$;

create index if not exists idx_inquiries_user_created_at
on public.inquiries(user_id, created_at desc);

create index if not exists idx_inquiries_status_created_at
on public.inquiries(status, created_at desc);

alter table public.profiles enable row level security;
alter table public.inquiries enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Users can read their own profile'
  ) then
    create policy "Users can read their own profile"
      on public.profiles
      for select to authenticated
      using (id = auth.uid() or public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'inquiries'
      and policyname = 'Users can create their own inquiries'
  ) then
    create policy "Users can create their own inquiries"
      on public.inquiries
      for insert to authenticated
      with check (
        auth.uid() = user_id
        and coalesce(user_email, '') = coalesce(auth.jwt() ->> 'email', '')
        and status = 'PENDING'
        and answer_title is null
        and answer_content is null
        and answered_by is null
        and answered_at is null
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'inquiries'
      and policyname = 'Users can read permitted inquiries'
  ) then
    create policy "Users can read permitted inquiries"
      on public.inquiries
      for select to authenticated
      using (auth.uid() = user_id or public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'inquiries'
      and policyname = 'Admins can update inquiries'
  ) then
    create policy "Admins can update inquiries"
      on public.inquiries
      for update to authenticated
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end $$;

-- Promote the first administrator after applying this migration:
-- update public.profiles set role = 'ADMIN' where email = 'admin@example.com';
