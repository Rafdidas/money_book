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
