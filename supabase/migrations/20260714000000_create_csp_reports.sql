create table if not exists public.csp_reports (
  id uuid primary key default gen_random_uuid(),
  document_uri text not null,
  blocked_uri text,
  effective_directive text not null,
  disposition text not null check (disposition in ('report', 'enforce')),
  status_code integer,
  created_at timestamptz not null default now()
);

create index if not exists idx_csp_reports_created_at
on public.csp_reports(created_at);

alter table public.csp_reports enable row level security;

create or replace function public.delete_expired_csp_reports()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.csp_reports
  where created_at < now() - interval '30 days';
$$;

revoke all on table public.csp_reports from anon, authenticated;
revoke all on function public.delete_expired_csp_reports() from public;
