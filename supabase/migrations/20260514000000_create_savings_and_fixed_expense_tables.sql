create table if not exists public.savings_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  name text not null,
  monthly_amount bigint not null,
  payment_day integer not null check (payment_day between 1 and 31),

  start_date date not null,
  maturity_date date null,
  has_no_maturity boolean not null default false,

  initial_amount bigint not null default 0,
  status text not null default 'active'
    check (status in ('active', 'completed', 'ended')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.savings_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  savings_account_id uuid not null references public.savings_accounts(id) on delete cascade,

  amount bigint not null,
  payment_date date not null,

  status text not null default 'scheduled'
    check (status in ('scheduled', 'paid', 'skipped', 'cancelled')),

  paid_at timestamptz null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fixed_expense_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  name text not null,
  amount bigint not null,
  category text null,

  payment_day integer not null check (payment_day between 1 and 31),

  start_date date not null,
  end_date date null,
  has_no_end_date boolean not null default false,

  status text not null default 'active'
    check (status in ('active', 'ended')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fixed_expense_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fixed_expense_rule_id uuid not null references public.fixed_expense_rules(id) on delete cascade,

  amount bigint not null,
  payment_date date not null,

  status text not null default 'scheduled'
    check (status in ('scheduled', 'paid', 'skipped', 'cancelled')),

  paid_at timestamptz null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'set_savings_accounts_updated_at'
  ) then
    create trigger set_savings_accounts_updated_at
      before update on public.savings_accounts
      for each row
      execute function public.update_updated_at_column();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'set_savings_payments_updated_at'
  ) then
    create trigger set_savings_payments_updated_at
      before update on public.savings_payments
      for each row
      execute function public.update_updated_at_column();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'set_fixed_expense_rules_updated_at'
  ) then
    create trigger set_fixed_expense_rules_updated_at
      before update on public.fixed_expense_rules
      for each row
      execute function public.update_updated_at_column();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'set_fixed_expense_payments_updated_at'
  ) then
    create trigger set_fixed_expense_payments_updated_at
      before update on public.fixed_expense_payments
      for each row
      execute function public.update_updated_at_column();
  end if;
end $$;

create index if not exists idx_expenses_user_date
on public.expenses(user_id, date);

create index if not exists idx_savings_accounts_user_status
on public.savings_accounts(user_id, status);

create index if not exists idx_savings_payments_user_date
on public.savings_payments(user_id, payment_date);

create index if not exists idx_savings_payments_account_date
on public.savings_payments(savings_account_id, payment_date);

create index if not exists idx_fixed_expense_rules_user_status
on public.fixed_expense_rules(user_id, status);

create index if not exists idx_fixed_expense_payments_user_date
on public.fixed_expense_payments(user_id, payment_date);

create index if not exists idx_fixed_expense_payments_rule_date
on public.fixed_expense_payments(fixed_expense_rule_id, payment_date);

alter table public.savings_accounts enable row level security;
alter table public.savings_payments enable row level security;
alter table public.fixed_expense_rules enable row level security;
alter table public.fixed_expense_payments enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'savings_accounts'
      and policyname = 'select_own_savings_accounts'
  ) then
    create policy "select_own_savings_accounts"
      on public.savings_accounts
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'savings_accounts'
      and policyname = 'insert_own_savings_accounts'
  ) then
    create policy "insert_own_savings_accounts"
      on public.savings_accounts
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'savings_accounts'
      and policyname = 'update_own_savings_accounts'
  ) then
    create policy "update_own_savings_accounts"
      on public.savings_accounts
      for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'savings_accounts'
      and policyname = 'delete_own_savings_accounts'
  ) then
    create policy "delete_own_savings_accounts"
      on public.savings_accounts
      for delete
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'savings_payments'
      and policyname = 'select_own_savings_payments'
  ) then
    create policy "select_own_savings_payments"
      on public.savings_payments
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'savings_payments'
      and policyname = 'insert_own_savings_payments'
  ) then
    create policy "insert_own_savings_payments"
      on public.savings_payments
      for insert
      to authenticated
      with check (
        auth.uid() = user_id
        and exists (
          select 1
          from public.savings_accounts account
          where account.id = savings_account_id
            and account.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'savings_payments'
      and policyname = 'update_own_savings_payments'
  ) then
    create policy "update_own_savings_payments"
      on public.savings_payments
      for update
      to authenticated
      using (auth.uid() = user_id)
      with check (
        auth.uid() = user_id
        and exists (
          select 1
          from public.savings_accounts account
          where account.id = savings_account_id
            and account.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'savings_payments'
      and policyname = 'delete_own_savings_payments'
  ) then
    create policy "delete_own_savings_payments"
      on public.savings_payments
      for delete
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'fixed_expense_rules'
      and policyname = 'select_own_fixed_expense_rules'
  ) then
    create policy "select_own_fixed_expense_rules"
      on public.fixed_expense_rules
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'fixed_expense_rules'
      and policyname = 'insert_own_fixed_expense_rules'
  ) then
    create policy "insert_own_fixed_expense_rules"
      on public.fixed_expense_rules
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'fixed_expense_rules'
      and policyname = 'update_own_fixed_expense_rules'
  ) then
    create policy "update_own_fixed_expense_rules"
      on public.fixed_expense_rules
      for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'fixed_expense_rules'
      and policyname = 'delete_own_fixed_expense_rules'
  ) then
    create policy "delete_own_fixed_expense_rules"
      on public.fixed_expense_rules
      for delete
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'fixed_expense_payments'
      and policyname = 'select_own_fixed_expense_payments'
  ) then
    create policy "select_own_fixed_expense_payments"
      on public.fixed_expense_payments
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'fixed_expense_payments'
      and policyname = 'insert_own_fixed_expense_payments'
  ) then
    create policy "insert_own_fixed_expense_payments"
      on public.fixed_expense_payments
      for insert
      to authenticated
      with check (
        auth.uid() = user_id
        and exists (
          select 1
          from public.fixed_expense_rules rule
          where rule.id = fixed_expense_rule_id
            and rule.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'fixed_expense_payments'
      and policyname = 'update_own_fixed_expense_payments'
  ) then
    create policy "update_own_fixed_expense_payments"
      on public.fixed_expense_payments
      for update
      to authenticated
      using (auth.uid() = user_id)
      with check (
        auth.uid() = user_id
        and exists (
          select 1
          from public.fixed_expense_rules rule
          where rule.id = fixed_expense_rule_id
            and rule.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'fixed_expense_payments'
      and policyname = 'delete_own_fixed_expense_payments'
  ) then
    create policy "delete_own_fixed_expense_payments"
      on public.fixed_expense_payments
      for delete
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;
