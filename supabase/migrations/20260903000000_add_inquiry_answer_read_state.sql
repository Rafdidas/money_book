alter table public.inquiries
  add column if not exists answer_read_at timestamptz;

create or replace function public.mark_inquiry_answer_as_read(p_inquiry_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.inquiries
  set answer_read_at = coalesce(answer_read_at, now())
  where id = p_inquiry_id
    and user_id = auth.uid()
    and status = 'ANSWERED';
end;
$$;

revoke all on function public.mark_inquiry_answer_as_read(uuid) from public;
grant execute on function public.mark_inquiry_answer_as_read(uuid) to authenticated;
