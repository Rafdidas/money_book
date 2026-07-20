create table if not exists public.user_custom_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_type text not null check (entry_type in ('expense', 'income', 'savings', 'investment')),
  name text not null check (char_length(btrim(name)) > 0),
  normalized_name text not null,
  last_used_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, entry_type, normalized_name)
);

create index if not exists idx_user_custom_categories_recent
  on public.user_custom_categories(user_id, entry_type, last_used_at desc);

create or replace function public.set_user_custom_category_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.name := btrim(new.name);
  new.normalized_name := lower(new.name);
  new.last_used_at := now();
  return new;
end;
$$;

drop trigger if exists set_user_custom_category_fields
  on public.user_custom_categories;
create trigger set_user_custom_category_fields
  before insert or update on public.user_custom_categories
  for each row execute function public.set_user_custom_category_fields();

alter table public.user_custom_categories enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_custom_categories'
      and policyname = 'select_own_user_custom_categories'
  ) then
    create policy "select_own_user_custom_categories"
      on public.user_custom_categories
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_custom_categories'
      and policyname = 'insert_own_user_custom_categories'
  ) then
    create policy "insert_own_user_custom_categories"
      on public.user_custom_categories
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_custom_categories'
      and policyname = 'update_own_user_custom_categories'
  ) then
    create policy "update_own_user_custom_categories"
      on public.user_custom_categories
      for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_custom_categories'
      and policyname = 'delete_own_user_custom_categories'
  ) then
    create policy "delete_own_user_custom_categories"
      on public.user_custom_categories
      for delete
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;
