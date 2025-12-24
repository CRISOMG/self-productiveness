-- Fix permissions for Webhooks System

-- 1. Fix 403 Forbidden on Trigger
-- Make the producer function SECURITY DEFINER so it runs with Postgres permissions
-- This allows 'authenticated' users to call pgmq.send() indirectly
ALTER FUNCTION public.encolar_pomodoro_finished() SECURITY DEFINER;
ALTER FUNCTION public.encolar_pomodoro_finished() SET search_path = public, pgmq, extensions;

-- 2. Enhance Trace Table with RLS and User Context
ALTER TABLE public.webhook_trace ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE public.webhook_trace ENABLE ROW LEVEL SECURITY;

-- 3. Policy for Trace Table (Users can see their own logs)
DROP POLICY IF EXISTS "Users can view their own webhook traces" ON public.webhook_trace;
CREATE POLICY "Users can view their own webhook traces" 
ON public.webhook_trace 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- 4. Update Consumer Function to populate user_id
CREATE OR REPLACE FUNCTION public.procesar_webhooks_pomodoro()
RETURNS void AS $$
DECLARE
  msg RECORD;
  new_request_id bigint;
  v_user_id uuid;
BEGIN
  -- Read batch of 500 messages
  FOR msg IN 
    SELECT * FROM pgmq.read('pomodoro_webhooks', 60, 500)
  LOOP
    
    -- Extract User ID from payload for tracing
    -- Payload structure: { "payload": { "user_id": "..." } }
    v_user_id := (msg.message->'payload'->>'user_id')::uuid;

    -- Send POST request
    SELECT net.http_post(
        url := msg.message->>'url',
        body := msg.message->'payload',
        headers := '{"Content-Type": "application/json"}'::jsonb
    ) INTO new_request_id;

    -- Log trace with User ID
    INSERT INTO public.webhook_trace (pgmq_msg_id, net_request_id, user_id)
    VALUES (msg.msg_id, new_request_id, v_user_id);

    -- Archive message
    PERFORM pgmq.archive('pomodoro_webhooks', msg.msg_id);
    
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 
-- Consumer also Security Definer to ensure it can read/write everything regardless of invoker (cron is superuser anyway)

-- 5. Fix View Permissions (Optional: Create a secure function wrapper instead if users need access)
-- For now, we leave the view as is, but users trigger won't error on 403.
-- We grant basic usage on the view if needed, but the underlying schemas (pgmq, net) are restricted.
-- If the user wants to QUERY this view from the Frontend, they will face 403 on the underlying tables.
-- RECOMMENDATION: Use the 'webhook_trace' table for user-facing logs (mapped via RLS).
