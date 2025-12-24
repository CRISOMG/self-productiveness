set check_function_bodies = off;

create or replace view "public"."v_webhook_status" with (security_invoker=on) as  SELECT a.msg_id,
    a.enqueued_at,
    (a.message ->> 'event'::text) AS event_type,
    (a.message ->> 'url'::text) AS target_url,
    a.message AS full_payload,
    t.processed_at,
    t.user_id,
    r.status_code,
    r.error_msg,
    r.content AS response_body
   FROM ((pgmq.a_pomodoro_webhooks a
     JOIN public.webhook_trace t ON ((a.msg_id = t.pgmq_msg_id)))
     LEFT JOIN net._http_response r ON ((t.net_request_id = r.id)))
  ORDER BY a.enqueued_at DESC;


CREATE OR REPLACE FUNCTION public.procesar_webhooks_pomodoro()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
        body := msg.message->'payload',
        headers := '{"Content-Type": "application/json"}'::jsonb
    ) INTO new_request_id;

    -- Log trace
    INSERT INTO public.webhook_trace (pgmq_msg_id, net_request_id, user_id)
    VALUES (msg.msg_id, new_request_id, v_user_id);

    -- Archive message (Move to _archive table)
    PERFORM pgmq.archive('pomodoro_webhooks', msg.msg_id);
    
  END LOOP;
END;
$function$
;


