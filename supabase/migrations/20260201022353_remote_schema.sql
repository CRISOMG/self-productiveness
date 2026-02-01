create extension if not exists "hypopg" with schema "extensions";

create extension if not exists "index_advisor" with schema "extensions";

drop extension if exists "vector";

create extension if not exists "vector" with schema "public";

create sequence "public"."documents_id_seq";

create sequence "public"."n8n_chat_histories_id_seq";

drop trigger if exists "trigger_enqueue_pomodoro_finished_webhook" on "public"."pomodoros";

drop trigger if exists "trigger_enqueue_task_done_webhook" on "public"."tasks";

drop policy "Users can manage own push subscriptions" on "public"."push_subscriptions";

drop policy "Users can delete their own keys" on "public"."api_keys";

drop policy "Users can view their own keys" on "public"."api_keys";

drop policy "Enable users and PAT to view pomodoros" on "public"."pomodoros";

drop policy "Enable users and PAT to view cycles" on "public"."pomodoros_cycles";

drop policy "Enable users and PAT to view pomodoros_tags" on "public"."pomodoros_tags";

drop policy "Users can delete their own pomodoro tasks" on "public"."pomodoros_tasks";

drop policy "Users can insert their own pomodoro tasks" on "public"."pomodoros_tasks";

drop policy "Users can view their own pomodoro tasks" on "public"."pomodoros_tasks";

drop policy "Users can insert their own profile." on "public"."profiles";

drop policy "Users can update their own profile." on "public"."profiles";

drop policy "Auth users and PAT can insert tags" on "public"."tags";

drop policy "Auth users and PAT can read tags" on "public"."tags";

drop policy "Enable delete for own tags" on "public"."tags";

drop policy "Enable update for own tags" on "public"."tags";

drop policy "Authenticated users can create their own tasks" on "public"."tasks";

drop policy "Authenticated users can delete their own tasks" on "public"."tasks";

drop policy "Authenticated users can read their own tasks" on "public"."tasks";

drop policy "Authenticated users can update their own tasks" on "public"."tasks";

drop policy "Users can view their own webhook traces" on "public"."webhook_trace";

revoke delete on table "public"."push_subscriptions" from "anon";

revoke insert on table "public"."push_subscriptions" from "anon";

revoke references on table "public"."push_subscriptions" from "anon";

revoke select on table "public"."push_subscriptions" from "anon";

revoke trigger on table "public"."push_subscriptions" from "anon";

revoke truncate on table "public"."push_subscriptions" from "anon";

revoke update on table "public"."push_subscriptions" from "anon";

revoke delete on table "public"."push_subscriptions" from "authenticated";

revoke insert on table "public"."push_subscriptions" from "authenticated";

revoke references on table "public"."push_subscriptions" from "authenticated";

revoke select on table "public"."push_subscriptions" from "authenticated";

revoke trigger on table "public"."push_subscriptions" from "authenticated";

revoke truncate on table "public"."push_subscriptions" from "authenticated";

revoke update on table "public"."push_subscriptions" from "authenticated";

revoke delete on table "public"."push_subscriptions" from "service_role";

revoke insert on table "public"."push_subscriptions" from "service_role";

revoke references on table "public"."push_subscriptions" from "service_role";

revoke select on table "public"."push_subscriptions" from "service_role";

revoke trigger on table "public"."push_subscriptions" from "service_role";

revoke truncate on table "public"."push_subscriptions" from "service_role";

revoke update on table "public"."push_subscriptions" from "service_role";

alter table "public"."push_subscriptions" drop constraint "push_subscriptions_user_id_fkey";

alter table "public"."push_subscriptions" drop constraint "push_subscriptions_user_id_subscription_key";

drop function if exists "public"."enqueue_webhook"(p_user_id uuid, p_event_type text, p_payload jsonb);

drop function if exists "public"."handle_enqueue_pomodoro_finished_webhook"();

drop function if exists "public"."handle_enqueue_task_done_webhook"();

drop function if exists "public"."process_webhooks"();

alter table "public"."push_subscriptions" drop constraint "push_subscriptions_pkey";

drop index if exists "public"."idx_push_subscriptions_user_id";

drop index if exists "public"."push_subscriptions_pkey";

drop index if exists "public"."push_subscriptions_user_id_subscription_key";

drop table "public"."push_subscriptions";


  create table "public"."documents" (
    "id" bigint not null default nextval('public.documents_id_seq'::regclass),
    "content" text,
    "metadata" jsonb,
    "embedding" public.vector(768)
      );


alter table "public"."documents" enable row level security;


  create table "public"."n8n_chat_histories" (
    "id" integer not null default nextval('public.n8n_chat_histories_id_seq'::regclass),
    "session_id" character varying(255) not null,
    "message" jsonb not null
      );


alter table "public"."n8n_chat_histories" enable row level security;

alter sequence "public"."documents_id_seq" owned by "public"."documents"."id";

alter sequence "public"."n8n_chat_histories_id_seq" owned by "public"."n8n_chat_histories"."id";

CREATE UNIQUE INDEX documents_pkey ON public.documents USING btree (id);

CREATE UNIQUE INDEX n8n_chat_histories_pkey ON public.n8n_chat_histories USING btree (id);

CREATE INDEX n8n_chat_histories_session_id_idx ON public.n8n_chat_histories USING btree (session_id);

CREATE UNIQUE INDEX profiles_username_idx ON public.profiles USING btree (username);

alter table "public"."documents" add constraint "documents_pkey" PRIMARY KEY using index "documents_pkey";

alter table "public"."n8n_chat_histories" add constraint "n8n_chat_histories_pkey" PRIMARY KEY using index "n8n_chat_histories_pkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.encolar_pomodoro_finished()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pgmq', 'extensions'
AS $function$
DECLARE
    v_webhook_url text;
BEGIN
    -- Check for state change to 'finished'
    IF (OLD.state IS DISTINCT FROM 'finished' AND NEW.state = 'finished') THEN
        
        -- Get user webhook URL
        SELECT settings->>'webhook_url' INTO v_webhook_url
        FROM public.profiles
        WHERE id = NEW.user_id;

        -- If valid URL, enqueue message
        IF v_webhook_url IS NOT NULL AND v_webhook_url <> '' THEN
            PERFORM pgmq.send(
                'pomodoro_webhooks',
                jsonb_build_object(
                    'url', v_webhook_url,
                    'event', 'pomodoro.finished',
                    'payload', jsonb_build_object(
                        'id', NEW.id,
                        'type', NEW.type,
                        'duration', NEW.expected_duration,
                        'started_at', NEW.started_at,
                        'finished_at', NEW.finished_at,
                        'user_id', NEW.user_id
                    ),
                    'timestamp', now()
                )
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_task_done_webhook()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_webhook_url text;
BEGIN
    -- Only trigger when done status changes from false (or null) to true
    IF (OLD.done IS DISTINCT FROM true AND NEW.done = true) THEN
        
        -- Get user's webhook_url from profiles
        SELECT settings->>'webhook_url' INTO v_webhook_url
        FROM public.profiles
        WHERE id = NEW.user_id;

        IF v_webhook_url IS NOT NULL AND v_webhook_url <> '' THEN
            -- Send async webhook using pg_net
            PERFORM net.http_post(
                url := v_webhook_url,
                body := jsonb_build_object(
                    'event', 'task.done',
                    'task', jsonb_build_object(
                        'id', NEW.id,
                        'title', NEW.title,
                        'description', NEW.description,
                        'user_id', NEW.user_id,
                        'done_at', NEW.done_at,
                        'created_at', NEW.created_at
                    )
                ),
                headers := '{"Content-Type": "application/json"}'::jsonb
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.match_documents(query_embedding public.vector, match_count integer DEFAULT 10, filter jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(id bigint, content text, metadata jsonb, similarity double precision)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  -- Esta línea permite que n8n aplique filtros si los configuras en el nodo
  WHERE documents.metadata @> filter
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$
;

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
$function$
;

grant delete on table "public"."documents" to "anon";

grant insert on table "public"."documents" to "anon";

grant references on table "public"."documents" to "anon";

grant select on table "public"."documents" to "anon";

grant trigger on table "public"."documents" to "anon";

grant truncate on table "public"."documents" to "anon";

grant update on table "public"."documents" to "anon";

grant delete on table "public"."documents" to "authenticated";

grant insert on table "public"."documents" to "authenticated";

grant references on table "public"."documents" to "authenticated";

grant select on table "public"."documents" to "authenticated";

grant trigger on table "public"."documents" to "authenticated";

grant truncate on table "public"."documents" to "authenticated";

grant update on table "public"."documents" to "authenticated";

grant delete on table "public"."documents" to "service_role";

grant insert on table "public"."documents" to "service_role";

grant references on table "public"."documents" to "service_role";

grant select on table "public"."documents" to "service_role";

grant trigger on table "public"."documents" to "service_role";

grant truncate on table "public"."documents" to "service_role";

grant update on table "public"."documents" to "service_role";

grant delete on table "public"."n8n_chat_histories" to "anon";

grant insert on table "public"."n8n_chat_histories" to "anon";

grant references on table "public"."n8n_chat_histories" to "anon";

grant select on table "public"."n8n_chat_histories" to "anon";

grant trigger on table "public"."n8n_chat_histories" to "anon";

grant truncate on table "public"."n8n_chat_histories" to "anon";

grant update on table "public"."n8n_chat_histories" to "anon";

grant delete on table "public"."n8n_chat_histories" to "authenticated";

grant insert on table "public"."n8n_chat_histories" to "authenticated";

grant references on table "public"."n8n_chat_histories" to "authenticated";

grant select on table "public"."n8n_chat_histories" to "authenticated";

grant trigger on table "public"."n8n_chat_histories" to "authenticated";

grant truncate on table "public"."n8n_chat_histories" to "authenticated";

grant update on table "public"."n8n_chat_histories" to "authenticated";

grant delete on table "public"."n8n_chat_histories" to "service_role";

grant insert on table "public"."n8n_chat_histories" to "service_role";

grant references on table "public"."n8n_chat_histories" to "service_role";

grant select on table "public"."n8n_chat_histories" to "service_role";

grant trigger on table "public"."n8n_chat_histories" to "service_role";

grant truncate on table "public"."n8n_chat_histories" to "service_role";

grant update on table "public"."n8n_chat_histories" to "service_role";


  create policy "Enable users to view their own data only"
  on "public"."pomodoros"
  as permissive
  for select
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Enable insert for authenticated users only"
  on "public"."pomodoros_cycles"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Enable users to view their own data only"
  on "public"."pomodoros_cycles"
  as permissive
  for select
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Enable insert for authenticated users only"
  on "public"."pomodoros_tags"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Enable users to view their own data only"
  on "public"."pomodoros_tags"
  as permissive
  for select
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Enable insert for own tags"
  on "public"."tags"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "Enable read access for own tags"
  on "public"."tags"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));



  create policy "Users can delete their own keys"
  on "public"."api_keys"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Users can view their own keys"
  on "public"."api_keys"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Enable users and PAT to view pomodoros"
  on "public"."pomodoros"
  as permissive
  for select
  to authenticated
using (((auth.uid() = user_id) AND public.is_valid_personal_access_token()));



  create policy "Enable users and PAT to view cycles"
  on "public"."pomodoros_cycles"
  as permissive
  for select
  to authenticated
using (((auth.uid() = user_id) AND public.is_valid_personal_access_token()));



  create policy "Enable users and PAT to view pomodoros_tags"
  on "public"."pomodoros_tags"
  as permissive
  for select
  to authenticated
using (((auth.uid() = user_id) AND public.is_valid_personal_access_token()));



  create policy "Users can delete their own pomodoro tasks"
  on "public"."pomodoros_tasks"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Users can insert their own pomodoro tasks"
  on "public"."pomodoros_tasks"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can view their own pomodoro tasks"
  on "public"."pomodoros_tasks"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users can insert their own profile."
  on "public"."profiles"
  as permissive
  for insert
  to public
with check ((auth.uid() = id));



  create policy "Users can update their own profile."
  on "public"."profiles"
  as permissive
  for update
  to public
using ((auth.uid() = id));



  create policy "Auth users and PAT can insert tags"
  on "public"."tags"
  as permissive
  for insert
  to authenticated
with check (((auth.uid() = user_id) AND public.is_valid_personal_access_token()));



  create policy "Auth users and PAT can read tags"
  on "public"."tags"
  as permissive
  for select
  to authenticated
using (((auth.uid() = user_id) AND public.is_valid_personal_access_token()));



  create policy "Enable delete for own tags"
  on "public"."tags"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = user_id));



  create policy "Enable update for own tags"
  on "public"."tags"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Authenticated users can create their own tasks"
  on "public"."tasks"
  as permissive
  for insert
  to authenticated
with check (((auth.uid() = user_id) AND public.is_valid_personal_access_token()));



  create policy "Authenticated users can delete their own tasks"
  on "public"."tasks"
  as permissive
  for delete
  to authenticated
using (((auth.uid() = user_id) AND public.is_valid_personal_access_token()));



  create policy "Authenticated users can read their own tasks"
  on "public"."tasks"
  as permissive
  for select
  to authenticated
using (((auth.uid() = user_id) AND public.is_valid_personal_access_token()));



  create policy "Authenticated users can update their own tasks"
  on "public"."tasks"
  as permissive
  for update
  to authenticated
using (((auth.uid() = user_id) AND public.is_valid_personal_access_token()))
with check (((auth.uid() = user_id) AND public.is_valid_personal_access_token()));



  create policy "Users can view their own webhook traces"
  on "public"."webhook_trace"
  as permissive
  for select
  to authenticated
using ((user_id = auth.uid()));


CREATE TRIGGER trigger_encolar_pomodoro_finished AFTER UPDATE ON public.pomodoros FOR EACH ROW EXECUTE FUNCTION public.encolar_pomodoro_finished();

CREATE TRIGGER trigger_task_done_webhook AFTER UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.handle_task_done_webhook();

drop policy "Allow access to own pomodoro sync channel" on "realtime"."messages";

drop policy "Allow listening for presences from a pomodoro_sync" on "realtime"."messages";

drop policy "Publish presence to a specific channel" on "realtime"."messages";


  create policy "Authenticated users can receive broadcasts"
  on "realtime"."messages"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Allow access to own pomodoro sync channel"
  on "realtime"."messages"
  as permissive
  for all
  to public
using (((auth.role() = 'authenticated'::text) AND (realtime.topic() = ('pomodoro_sync:'::text || (auth.uid())::text))));



  create policy "Allow listening for presences from a pomodoro_sync"
  on "realtime"."messages"
  as permissive
  for select
  to public
using (((extension = 'presence'::text) AND (realtime.topic() = ('pomodoro_sync:'::text || (auth.uid())::text))));



  create policy "Publish presence to a specific channel"
  on "realtime"."messages"
  as permissive
  for insert
  to public
with check (((extension = 'presence'::text) AND (realtime.topic() = ('pomodoro_sync:'::text || (auth.uid())::text))));



  create policy "Users can access their own folder"
  on "storage"."objects"
  as permissive
  for all
  to public
using (((bucket_id = 'chat-attachments'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)))
with check (((bucket_id = 'chat-attachments'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



