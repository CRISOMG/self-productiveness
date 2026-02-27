-- Scheduled Notifications Worker Configuration
-- Consumes 'notifications_queue' and invokes the 'process-notification' Edge Function

-- 1. Ensure queue exists (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pgmq.list_queues() WHERE queue_name = 'notifications_queue') THEN
        PERFORM pgmq.create('notifications_queue');
    END IF;
END $$;

-- 2. Worker Function
CREATE OR REPLACE FUNCTION public.process_notifications_worker()
RETURNS void AS $$
DECLARE
  msg RECORD;
  v_request_id bigint;
  v_service_key text;
  v_base_url text;
BEGIN
  -- 1. Get Service Role Key from Vault
  SELECT decrypted_secret INTO v_service_key 
  FROM vault.decrypted_secrets 
  WHERE name = 'service_role_key' 
  LIMIT 1;

  -- 2. Get Supabase URL (attempt from setting or fallback)
  v_base_url := public.supabase_url();
  
  -- If running from pg_cron, request.base_url might be null.
  -- In that case, we try to use a custom setting if provided, or raise error.
  IF v_base_url IS NULL OR v_base_url = '' THEN
     v_base_url := current_setting('app.settings.supabase_url', true);
  END IF;

  IF v_service_key IS NULL OR v_base_url IS NULL OR v_base_url = '' THEN
    RAISE WARNING 'Worker missing configuration: base_url or service_key. check vault and settings.';
    RETURN;
  END IF;

  -- 3. Read batch from PGMQ
  FOR msg IN 
    SELECT * FROM pgmq.read('notifications_queue', 60, 50)
  LOOP
    
    -- Send HTTP request to process-notification
    SELECT net.http_post(
        url := v_base_url || '/functions/v1/process-notification',
        body := msg.message,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_service_key
        )
    ) INTO v_request_id;

    -- Archive message immediately after dispatching (fire and forget pattern for the worker)
    PERFORM pgmq.archive('notifications_queue', msg.msg_id);
    
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pgmq, net, extensions;

-- 3. Schedule the worker
-- Unschedule if exists to avoid duplicates
SELECT cron.unschedule('notification-worker') FROM cron.job WHERE jobname = 'notification-worker';
SELECT cron.schedule(
    'notification-worker', 
    '* * * * *', 
    'SELECT public.process_notifications_worker();'
);
