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

revoke all on function public.take_stock_quote_rate_limit(integer, integer) from public;
grant execute on function public.take_stock_quote_rate_limit(integer, integer) to authenticated;
