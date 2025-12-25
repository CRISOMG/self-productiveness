-- Migration to standardize webhook names and include tags in payloads

-- 1. CLEANUP OLD SPANISH/LEGACY ARTIFACTS
DROP TRIGGER IF EXISTS trigger_encolar_pomodoro_finished ON public.pomodoros;
DROP FUNCTION IF EXISTS public.encolar_pomodoro_finished();

DROP TRIGGER IF EXISTS trigger_task_done_webhook ON public.tasks;
DROP FUNCTION IF EXISTS public.handle_task_done_webhook();

DROP FUNCTION IF EXISTS public.procesar_webhooks_pomodoro();


-- 2. CREATE NEW HELPER FUNCTION
CREATE OR REPLACE FUNCTION public.enqueue_webhook(
  p_user_id uuid,
  p_event_type text,
  p_payload jsonb
) RETURNS void AS $$
DECLARE
    v_webhook_url text;
BEGIN
    -- Get user webhook URL
    SELECT settings->>'webhook_url' INTO v_webhook_url
    FROM public.profiles
    WHERE id = p_user_id;

    -- If valid URL, enqueue message
    IF v_webhook_url IS NOT NULL AND v_webhook_url <> '' THEN
        PERFORM pgmq.send(
            'pomodoro_webhooks',
            jsonb_build_object(
                'url', v_webhook_url,
                'event', p_event_type,
                'payload', p_payload,
                'timestamp', now()
            )
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pgmq, extensions;


-- 3. UPDATED TRIGGER FUNCTIONS WITH TAGS SUPPORT

-- Pomodoro Finished
CREATE OR REPLACE FUNCTION public.handle_enqueue_pomodoro_finished_webhook()
RETURNS trigger AS $$
DECLARE
  v_tags jsonb;
BEGIN
    -- Check for state change to 'finished'
    IF (OLD.state IS DISTINCT FROM 'finished' AND NEW.state = 'finished') THEN
        
        -- Fetch tags associated with the pomodoro
        SELECT jsonb_agg(jsonb_build_object('id', t.id, 'label', t.label, 'type', t.type))
        INTO v_tags
        FROM public.pomodoros_tags pt
        JOIN public.tags t ON pt.tag = t.id
        WHERE pt.pomodoro = NEW.id;

        PERFORM public.enqueue_webhook(
            NEW.user_id,
            'pomodoro.finished',
            jsonb_build_object(
                'id', NEW.id,
                'type', NEW.type,
                'duration', NEW.expected_duration,
                'started_at', NEW.started_at,
                'finished_at', NEW.finished_at,
                'user_id', NEW.user_id,
                'tags', COALESCE(v_tags, '[]'::jsonb)
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pgmq, extensions;

-- Task Done
CREATE OR REPLACE FUNCTION public.handle_enqueue_task_done_webhook()
RETURNS trigger AS $$
DECLARE
  v_tag jsonb;
BEGIN
    -- Only trigger when done status changes from false (or null) to true
    IF (OLD.done IS DISTINCT FROM true AND NEW.done = true) THEN
        
        -- Fetch tag if exists
        IF NEW.tag_id IS NOT NULL THEN
            SELECT jsonb_build_object('id', t.id, 'label', t.label, 'type', t.type)
            INTO v_tag
            FROM public.tags t
            WHERE t.id = NEW.tag_id;
        END IF;

        PERFORM public.enqueue_webhook(
            NEW.user_id,
            'task.done',
            jsonb_build_object(
                'id', NEW.id,
                'title', NEW.title,
                'description', NEW.description,
                'user_id', NEW.user_id,
                'done_at', NEW.done_at,
                'created_at', NEW.created_at,
                'tag', v_tag
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pgmq, extensions;


-- 4. APPLY NEW TRIGGERS

DROP TRIGGER IF EXISTS trigger_enqueue_pomodoro_finished_webhook ON public.pomodoros;
CREATE TRIGGER trigger_enqueue_pomodoro_finished_webhook
AFTER UPDATE ON public.pomodoros
FOR EACH ROW
EXECUTE FUNCTION public.handle_enqueue_pomodoro_finished_webhook();

DROP TRIGGER IF EXISTS trigger_enqueue_task_done_webhook ON public.tasks;
CREATE TRIGGER trigger_enqueue_task_done_webhook
AFTER UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.handle_enqueue_task_done_webhook();


-- 5. UPDATE CONSUMER FUNCTION (English Name)
CREATE OR REPLACE FUNCTION public.process_webhooks()
RETURNS void AS $$
DECLARE
  msg RECORD;
  new_request_id bigint;
  v_user_id uuid;
BEGIN
  -- Read batch of 500 messages (High throughput)
  -- Visibility Timeout 60s
  FOR msg IN 
    SELECT * FROM pgmq.read('pomodoro_webhooks', 60, 500)
  LOOP
    
    -- Extract User ID from payload for tracing
    -- Payload structure: { "payload": { "user_id": "..." } }
    v_user_id := (msg.message->'payload'->>'user_id')::uuid;

    -- Send POST request
    SELECT net.http_post(
        url := msg.message->>'url',
        body := jsonb_build_object(
            'event', msg.message->>'event',
            'payload', msg.message->'payload'
        ),
        headers := '{"Content-Type": "application/json"}'::jsonb
    ) INTO new_request_id;

    -- Log trace
    INSERT INTO public.webhook_trace (pgmq_msg_id, net_request_id, user_id)
    VALUES (msg.msg_id, new_request_id, v_user_id);

    -- Archive message (Move to _archive table)
    PERFORM pgmq.archive('pomodoro_webhooks', msg.msg_id);
    
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pgmq, net, extensions;


-- 6. UPDATE CRON JOBS
-- Re-scheduling with the same name updates the existing job
SELECT cron.schedule(
  'process-webhooks-1',
  '* * * * *',
  $$ SELECT public.process_webhooks() $$
);

SELECT cron.schedule(
  'process-webhooks-2',
  '* * * * *',
  $$ SELECT pg_sleep(30); SELECT public.process_webhooks() $$
);
