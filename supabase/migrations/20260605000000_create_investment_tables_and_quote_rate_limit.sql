create table if not exists public.investment_stocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null check (symbol ~ '^[0-9A-Z]{6}$'),
  name text not null,
  market text not null,
  quantity numeric not null check (quantity > 0),
  unit_price numeric not null check (unit_price > 0),
  purchase_date date not null,
  account_type text not null check (account_type in ('GENERAL', 'ISA', 'PENSION')),
  currency text not null default 'KRW' check (currency = 'KRW'),
  memo text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.investment_account_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  year integer not null check (year between 2000 and 2200),
  account_type text not null check (account_type in ('ISA', 'PENSION')),
  amount numeric not null default 0 check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, year, account_type)
);

create table if not exists public.stock_quote_rate_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  request_count integer not null default 0,
  window_started_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'set_investment_stocks_updated_at'
  ) then
    create trigger set_investment_stocks_updated_at
      before update on public.investment_stocks
      for each row
      execute function public.update_updated_at_column();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'set_investment_account_limits_updated_at'
  ) then
    create trigger set_investment_account_limits_updated_at
      before update on public.investment_account_limits
      for each row
      execute function public.update_updated_at_column();
  end if;
end $$;

create index if not exists idx_investment_stocks_user_purchase_date
on public.investment_stocks(user_id, purchase_date desc);

create index if not exists idx_investment_stocks_user_symbol
on public.investment_stocks(user_id, symbol);

create index if not exists idx_investment_account_limits_user_year
on public.investment_account_limits(user_id, year);

alter table public.investment_stocks enable row level security;
alter table public.investment_account_limits enable row level security;
alter table public.stock_quote_rate_limits enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'investment_stocks'
      and policyname = 'select_own_investment_stocks'
  ) then
    create policy "select_own_investment_stocks"
      on public.investment_stocks
      for select to authenticated
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'investment_stocks'
      and policyname = 'insert_own_investment_stocks'
  ) then
    create policy "insert_own_investment_stocks"
      on public.investment_stocks
      for insert to authenticated
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'investment_stocks'
      and policyname = 'update_own_investment_stocks'
  ) then
    create policy "update_own_investment_stocks"
      on public.investment_stocks
      for update to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'investment_stocks'
      and policyname = 'delete_own_investment_stocks'
  ) then
    create policy "delete_own_investment_stocks"
      on public.investment_stocks
      for delete to authenticated
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'investment_account_limits'
      and policyname = 'select_own_investment_account_limits'
  ) then
    create policy "select_own_investment_account_limits"
      on public.investment_account_limits
      for select to authenticated
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'investment_account_limits'
      and policyname = 'insert_own_investment_account_limits'
  ) then
    create policy "insert_own_investment_account_limits"
      on public.investment_account_limits
      for insert to authenticated
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'investment_account_limits'
      and policyname = 'update_own_investment_account_limits'
  ) then
    create policy "update_own_investment_account_limits"
      on public.investment_account_limits
      for update to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

create or replace function public.take_stock_quote_rate_limit(
  max_requests integer,
  window_seconds integer
)
returns table(is_allowed boolean, retry_after integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_entry public.stock_quote_rate_limits%rowtype;
  v_now timestamptz := clock_timestamp();
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  insert into public.stock_quote_rate_limits(user_id, request_count, window_started_at)
  values (current_user_id, 0, v_now)
  on conflict (user_id) do nothing;

  select *
  into current_entry
  from public.stock_quote_rate_limits
  where user_id = current_user_id
  for update;

  if current_entry.window_started_at + make_interval(secs => window_seconds) <= v_now then
    update public.stock_quote_rate_limits
    set request_count = 1, window_started_at = v_now
    where user_id = current_user_id;

    return query select true, 0;
    return;
  end if;

  if current_entry.request_count >= max_requests then
    return query select
      false,
      greatest(
        1,
        ceil(extract(epoch from (
          current_entry.window_started_at + make_interval(secs => window_seconds) - v_now
        )))::integer
      );
    return;
  end if;

  update public.stock_quote_rate_limits
  set request_count = request_count + 1
  where user_id = current_user_id;

  return query select true, 0;
end;
$$;

revoke all on public.stock_quote_rate_limits from anon, authenticated;
revoke all on function public.take_stock_quote_rate_limit(integer, integer) from public;
grant execute on function public.take_stock_quote_rate_limit(integer, integer) to authenticated;
