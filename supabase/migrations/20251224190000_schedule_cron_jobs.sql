
SELECT cron.schedule(
  'auto-finish-pomodoros',
  '* * * * *',
  $$ SELECT public.auto_finish_expired_pomodoros() $$
);

SELECT cron.schedule(
  'process-webhooks-1',
  '* * * * *',
  $$ SELECT public.procesar_webhooks_pomodoro() $$
);

SELECT cron.schedule(
  'process-webhooks-2',
  '* * * * *',
  $$ SELECT pg_sleep(30); SELECT public.procesar_webhooks_pomodoro() $$
);

SELECT cron.schedule(
    'clean-old-webhooks', 
    '0 3 * * *',
    $$ 
    DELETE FROM pgmq.a_pomodoro_webhooks WHERE enqueued_at < now() - interval '7 days';
    DELETE FROM public.webhook_trace WHERE processed_at < now() - interval '7 days';
    $$
);
