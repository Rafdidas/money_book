-- Requires the pg_cron extension to be enabled in Supabase Dashboard > Integrations > Cron.
-- Runs daily at 03:15 UTC and only removes CSP reports older than the existing 30-day retention window.
select cron.schedule(
  'delete-expired-csp-reports',
  '15 3 * * *',
  $$select public.delete_expired_csp_reports();$$
);
