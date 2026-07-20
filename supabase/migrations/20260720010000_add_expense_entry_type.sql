alter table public.expenses
  add column if not exists entry_type text;

alter table public.expenses
  drop constraint if exists expenses_entry_type_check;

alter table public.expenses
  add constraint expenses_entry_type_check
  check (
    entry_type is null
    or entry_type in ('expense', 'income', 'savings', 'investment')
  );

comment on column public.expenses.entry_type is
  'Durable application-level entry subtype. Null rows use legacy inference.';
