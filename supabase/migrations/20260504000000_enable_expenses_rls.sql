alter table public.expenses enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'expenses'
      and policyname = 'Users can read their own expenses'
  ) then
    create policy "Users can read their own expenses"
      on public.expenses
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'expenses'
      and policyname = 'Users can create their own expenses'
  ) then
    create policy "Users can create their own expenses"
      on public.expenses
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'expenses'
      and policyname = 'Users can update their own expenses'
  ) then
    create policy "Users can update their own expenses"
      on public.expenses
      for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'expenses'
      and policyname = 'Users can delete their own expenses'
  ) then
    create policy "Users can delete their own expenses"
      on public.expenses
      for delete
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;
