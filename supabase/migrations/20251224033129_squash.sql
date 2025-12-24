


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_jsonschema" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgmq";


DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pgmq.list_queues() WHERE queue_name = 'pomodoro_webhooks') THEN
        PERFORM pgmq.create('pomodoro_webhooks');
    END IF;
END $$;



CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."pomodoro_state" AS ENUM (
    'current',
    'paused',
    'finished'
);


ALTER TYPE "public"."pomodoro_state" OWNER TO "postgres";


CREATE TYPE "public"."pomodoro_type" AS ENUM (
    'focus',
    'break',
    'long-break'
);


ALTER TYPE "public"."pomodoro_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_finish_expired_pomodoros"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE public.pomodoros
    SET 
        state = 'finished',
        finished_at = now(),
        timelapse = expected_duration -- Assume it finished completely
    WHERE 
        state = 'current' 
        AND expected_end IS NOT NULL
        AND expected_end < now();
END;
$$;


ALTER FUNCTION "public"."auto_finish_expired_pomodoros"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_pomodoro_timelapse_sql"("p_started_at" timestamp with time zone, "p_toggle_timeline" "jsonb", "p_now" timestamp with time zone DEFAULT "now"()) RETURNS integer
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
    v_elapsed_decimal double precision := 0;
    v_current_segment_start timestamptz := p_started_at;
    v_is_running boolean := true;
    v_event record;
BEGIN
    -- Si no hay timeline, ha estado corriendo desde started_at
    IF p_toggle_timeline IS NULL OR jsonb_array_length(p_toggle_timeline) = 0 THEN
        -- Usar GREATEST por si acaso p_now < p_started_at (relojes desincronizados)
        RETURN floor(GREATEST(0, extract(epoch from (p_now - p_started_at))));
    END IF;
    FOR v_event IN 
        SELECT (value->>'at')::timestamptz as at, (value->>'type') as type
        FROM jsonb_array_elements(p_toggle_timeline)
        ORDER BY (value->>'at')::timestamptz ASC
    LOOP
        IF v_event.type = 'pause' AND v_is_running THEN
            -- GREATEST(0, ...) equivale a Math.max(0, ...)
            v_elapsed_decimal := v_elapsed_decimal + GREATEST(0, extract(epoch from (v_event.at - v_current_segment_start)));
            v_is_running := false;
        ELSIF v_event.type = 'play' AND NOT v_is_running THEN
            v_current_segment_start := v_event.at;
            v_is_running := true;
        END IF;
    END LOOP;
    -- Añadir segmento actual si sigue corriendo
    IF v_is_running THEN
        v_elapsed_decimal := v_elapsed_decimal + GREATEST(0, extract(epoch from (p_now - v_current_segment_start)));
    END IF;
    RETURN floor(v_elapsed_decimal);
END;
$$;


ALTER FUNCTION "public"."calculate_pomodoro_timelapse_sql"("p_started_at" timestamp with time zone, "p_toggle_timeline" "jsonb", "p_now" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."carry_over_keep_tasks"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  insert into public.pomodoros_tasks (pomodoro_id, task_id, user_id)
  select NEW.id, t.id, NEW.user_id
  from public.tasks t
  where t.user_id = NEW.user_id
    and t.keep = true
    and (t.done = false or t.done is null)
    and (t.archived = false or t.archived is null)
  on conflict (pomodoro_id, task_id) do nothing;
  return NEW;
end;
$$;


ALTER FUNCTION "public"."carry_over_keep_tasks"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."encolar_pomodoro_finished"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pgmq', 'extensions'
    AS $$
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
$$;


ALTER FUNCTION "public"."encolar_pomodoro_finished"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, username, fullname, avatar_url, has_password)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      NEW.raw_user_meta_data->>'email',
      NEW.email
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'fullname',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name'
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture',
      NEW.raw_user_meta_data->>'avatar'
    ),
    (NEW.encrypted_password IS NOT NULL)
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_task_done_webhook"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."handle_task_done_webhook"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_task_keep_reset"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if NEW.done = true or NEW.archived = true then
    NEW.keep = false;
  end if;
  return NEW;
end;
$$;


ALTER FUNCTION "public"."handle_task_keep_reset"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_user_password_update"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.profiles
  SET has_password = (NEW.encrypted_password IS NOT NULL)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_user_password_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_valid_personal_access_token"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  token_id uuid;
  token_type text;
begin
 -- 1. Extraemos solo el tipo primero (es texto, nunca fallará)
  token_type := (auth.jwt() ->> 'type');

  -- 2. Si NO es un token personal (es null o login normal), salimos rápido.
  -- Esto optimiza rendimiento y evita errores de casting.
  if token_type is null or token_type != 'personal_access_token' then
    return true;
  end if;

  -- 3. Solo ahora, que sabemos que DEBERÍA ser un UUID válido, hacemos la consulta y el casting.
  return exists (
    select 1 from api_keys 
    where id = (auth.jwt() ->> 'jti')::uuid 
    and is_active = true
  );
exception 
  -- 4. Capa extra de seguridad: Si el JTI no es un UUID válido, retornamos false en lugar de romper la app con error 500
  when invalid_text_representation then
    return false;
end;
$$;


ALTER FUNCTION "public"."is_valid_personal_access_token"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."procesar_webhooks_pomodoro"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."procesar_webhooks_pomodoro"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_tasks_done_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.done IS DISTINCT FROM OLD.done THEN
    IF NEW.done = true THEN
      NEW.done_at = now();
    ELSE
      NEW.done_at = NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_tasks_done_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_tasks_done_at_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.done = true THEN
    NEW.done_at = now();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_tasks_done_at_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_pomodoro_expected_end"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
    DECLARE
        v_duration integer;
        v_timelapse integer;
        v_remaining integer;
    BEGIN
        -- Only update if state is current or paused
        IF NEW.state = 'finished' THEN
            RETURN NEW;
        END IF;

        v_duration := NEW.expected_duration;
        
        -- Calculate timelapse until "now" (the moment of update)
        v_timelapse := public.calculate_pomodoro_timelapse_sql(NEW.started_at, NEW.toggle_timeline, now());
        v_remaining := v_duration - v_timelapse;


        -- Set expected_end based on remaining time
        IF NEW.state = 'current' THEN
            NEW.expected_end := now() + (v_remaining || ' seconds')::interval;
        ELSE
            -- If paused, expected_end is essentially "infinity" or just stay as is, 
            -- but for logic clarity, we set it far in the future or keep it stable.
            -- Actually, if paused, it won't expire.
            NEW.expected_end := NULL; 
        END IF;

        NEW.timelapse := v_timelapse;
        
        RETURN NEW;
    END;
    $$;


ALTER FUNCTION "public"."sync_pomodoro_expected_end"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_task_keep_to_current_pomodoro"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  current_pomodoro_id bigint;
begin
  -- Get the current pomodoro for the user
  select id into current_pomodoro_id
  from public.pomodoros
  where user_id = NEW.user_id 
    and state = 'current'
  limit 1;

  if current_pomodoro_id is not null then
    if NEW.keep = true then
      -- Insert if not exists
      insert into public.pomodoros_tasks (pomodoro_id, task_id, user_id)
      values (current_pomodoro_id, NEW.id, NEW.user_id)
      on conflict (pomodoro_id, task_id) do nothing;
    else
      -- Remove if keep is set to false (unassign)
      delete from public.pomodoros_tasks
      where pomodoro_id = current_pomodoro_id
        and task_id = NEW.id;
    end if;
  end if;

  return NEW;
end;
$$;


ALTER FUNCTION "public"."sync_task_keep_to_current_pomodoro"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."api_keys" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."api_keys" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pomodoros" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "started_at" timestamp with time zone,
    "expected_end" timestamp with time zone,
    "timelapse" smallint DEFAULT '0'::smallint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "state" "public"."pomodoro_state" DEFAULT 'paused'::"public"."pomodoro_state" NOT NULL,
    "finished_at" timestamp with time zone,
    "toggle_timeline" "jsonb",
    "cycle" bigint,
    "expected_duration" smallint DEFAULT '1500'::smallint NOT NULL,
    "type" "public"."pomodoro_type" DEFAULT 'focus'::"public"."pomodoro_type" NOT NULL
);


ALTER TABLE "public"."pomodoros" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pomodoros_cycles" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "state" "public"."pomodoro_state",
    "user_id" "uuid",
    "required_tags" "text"[] DEFAULT '{focus,break,focus,long-break}'::"text"[]
);


ALTER TABLE "public"."pomodoros_cycles" OWNER TO "postgres";


ALTER TABLE "public"."pomodoros_cycles" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."pomodoros_cycles_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."pomodoros" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."pomodoros_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."pomodoros_tags" (
    "user_id" "uuid",
    "pomodoro" integer NOT NULL,
    "tag" integer NOT NULL
);


ALTER TABLE "public"."pomodoros_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pomodoros_tasks" (
    "id" bigint NOT NULL,
    "pomodoro_id" bigint NOT NULL,
    "task_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."pomodoros_tasks" OWNER TO "postgres";


ALTER TABLE "public"."pomodoros_tasks" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."pomodoros_tasks_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "username" "text",
    "fullname" "text",
    "avatar_url" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "has_password" boolean DEFAULT false,
    "settings" "jsonb"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tags" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "type" "text",
    "label" "text" NOT NULL,
    "user_id" "uuid"
);


ALTER TABLE "public"."tags" OWNER TO "postgres";


ALTER TABLE "public"."tags" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."tags_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "done" boolean DEFAULT false,
    "tag_id" integer,
    "pomodoro_id" integer,
    "archived" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "done_at" timestamp with time zone,
    "keep" boolean DEFAULT false
);


ALTER TABLE "public"."tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."webhook_trace" (
    "id" bigint NOT NULL,
    "pgmq_msg_id" bigint,
    "net_request_id" bigint,
    "processed_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid"
);


ALTER TABLE "public"."webhook_trace" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_webhook_status" WITH ("security_invoker"='on') AS
 SELECT "a"."msg_id",
    "a"."enqueued_at",
    ("a"."message" ->> 'event'::"text") AS "event_type",
    ("a"."message" ->> 'url'::"text") AS "target_url",
    "a"."message" AS "full_payload",
    "t"."processed_at",
    "t"."user_id",
    "r"."status_code",
    "r"."error_msg",
    "r"."content" AS "response_body"
   FROM (("pgmq"."a_pomodoro_webhooks" "a"
     JOIN "public"."webhook_trace" "t" ON (("a"."msg_id" = "t"."pgmq_msg_id")))
     LEFT JOIN "net"."_http_response" "r" ON (("t"."net_request_id" = "r"."id")))
  ORDER BY "a"."enqueued_at" DESC;


ALTER VIEW "public"."v_webhook_status" OWNER TO "postgres";


ALTER TABLE "public"."webhook_trace" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."webhook_trace_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."api_keys"
    ADD CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pomodoros_cycles"
    ADD CONSTRAINT "pomodoros_cycles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pomodoros"
    ADD CONSTRAINT "pomodoros_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pomodoros_tags"
    ADD CONSTRAINT "pomodoros_tags_pkey" PRIMARY KEY ("tag", "pomodoro");



ALTER TABLE ONLY "public"."pomodoros_tasks"
    ADD CONSTRAINT "pomodoros_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pomodoros_tasks"
    ADD CONSTRAINT "pomodoros_tasks_pomodoro_id_task_id_key" UNIQUE ("pomodoro_id", "task_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."webhook_trace"
    ADD CONSTRAINT "webhook_trace_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_webhook_trace_msg_id" ON "public"."webhook_trace" USING "btree" ("pgmq_msg_id");



CREATE UNIQUE INDEX "profiles_username_idx" ON "public"."profiles" USING "btree" ("username");



CREATE UNIQUE INDEX "tags_label_system_idx" ON "public"."tags" USING "btree" ("label") WHERE ("user_id" IS NULL);



CREATE UNIQUE INDEX "tags_label_user_idx" ON "public"."tags" USING "btree" ("label", "user_id") WHERE ("user_id" IS NOT NULL);



CREATE UNIQUE INDEX "tags_type_system_idx" ON "public"."tags" USING "btree" ("type") WHERE ("user_id" IS NULL);



CREATE OR REPLACE TRIGGER "tasks_done_at_insert_trigger" BEFORE INSERT ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."set_tasks_done_at_insert"();



CREATE OR REPLACE TRIGGER "tasks_done_at_trigger" BEFORE UPDATE OF "done" ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."set_tasks_done_at"();



CREATE OR REPLACE TRIGGER "tr_carry_over_keep_tasks" AFTER INSERT ON "public"."pomodoros" FOR EACH ROW EXECUTE FUNCTION "public"."carry_over_keep_tasks"();



CREATE OR REPLACE TRIGGER "tr_reset_task_keep" BEFORE INSERT OR UPDATE OF "done", "archived" ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."handle_task_keep_reset"();



CREATE OR REPLACE TRIGGER "tr_sync_task_keep" AFTER UPDATE OF "keep" ON "public"."tasks" FOR EACH ROW WHEN (("old"."keep" IS DISTINCT FROM "new"."keep")) EXECUTE FUNCTION "public"."sync_task_keep_to_current_pomodoro"();



CREATE OR REPLACE TRIGGER "trigger_encolar_pomodoro_finished" AFTER UPDATE ON "public"."pomodoros" FOR EACH ROW EXECUTE FUNCTION "public"."encolar_pomodoro_finished"();



CREATE OR REPLACE TRIGGER "trigger_sync_pomodoro_expected_end" BEFORE INSERT OR UPDATE OF "state", "toggle_timeline", "expected_duration" ON "public"."pomodoros" FOR EACH ROW EXECUTE FUNCTION "public"."sync_pomodoro_expected_end"();



CREATE OR REPLACE TRIGGER "trigger_task_done_webhook" AFTER UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."handle_task_done_webhook"();



CREATE OR REPLACE TRIGGER "update_profile_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."api_keys"
    ADD CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."pomodoros"
    ADD CONSTRAINT "pomodoros_cycle_fkey" FOREIGN KEY ("cycle") REFERENCES "public"."pomodoros_cycles"("id");



ALTER TABLE ONLY "public"."pomodoros_cycles"
    ADD CONSTRAINT "pomodoros_cycles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."pomodoros_tags"
    ADD CONSTRAINT "pomodoros_tags_pomodoro_fkey" FOREIGN KEY ("pomodoro") REFERENCES "public"."pomodoros"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pomodoros_tags"
    ADD CONSTRAINT "pomodoros_tags_tag_fkey" FOREIGN KEY ("tag") REFERENCES "public"."tags"("id");



ALTER TABLE ONLY "public"."pomodoros_tags"
    ADD CONSTRAINT "pomodoros_tags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."pomodoros_tasks"
    ADD CONSTRAINT "pomodoros_tasks_pomodoro_id_fkey" FOREIGN KEY ("pomodoro_id") REFERENCES "public"."pomodoros"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pomodoros_tasks"
    ADD CONSTRAINT "pomodoros_tasks_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pomodoros_tasks"
    ADD CONSTRAINT "pomodoros_tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pomodoros"
    ADD CONSTRAINT "pomodoros_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pomodoro_id_fkey" FOREIGN KEY ("pomodoro_id") REFERENCES "public"."pomodoros"("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."webhook_trace"
    ADD CONSTRAINT "webhook_trace_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



CREATE POLICY "Auth users and PAT can insert tags" ON "public"."tags" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "user_id") AND "public"."is_valid_personal_access_token"()));



CREATE POLICY "Auth users and PAT can read tags" ON "public"."tags" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "user_id") AND "public"."is_valid_personal_access_token"()));



CREATE POLICY "Authenticated users can create their own tasks" ON "public"."tasks" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "user_id") AND "public"."is_valid_personal_access_token"()));



CREATE POLICY "Authenticated users can delete their own tasks" ON "public"."tasks" FOR DELETE TO "authenticated" USING ((("auth"."uid"() = "user_id") AND "public"."is_valid_personal_access_token"()));



CREATE POLICY "Authenticated users can read their own tasks" ON "public"."tasks" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "user_id") AND "public"."is_valid_personal_access_token"()));



CREATE POLICY "Authenticated users can update their own tasks" ON "public"."tasks" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() = "user_id") AND "public"."is_valid_personal_access_token"())) WITH CHECK ((("auth"."uid"() = "user_id") AND "public"."is_valid_personal_access_token"()));



CREATE POLICY "Enable delete for own tags" ON "public"."tags" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."pomodoros" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."pomodoros_tags" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."pomodoros_cycles" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."pomodoros_tags" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for own tags" ON "public"."tags" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable insert for users based on user_id" ON "public"."pomodoros" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable insert for users based on user_id" ON "public"."pomodoros_cycles" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable insert for users based on user_id" ON "public"."pomodoros_tags" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable read access for own tags" ON "public"."tags" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable read access for system tags" ON "public"."tags" FOR SELECT USING (("user_id" IS NULL));



CREATE POLICY "Enable update for own tags" ON "public"."tags" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable users and PAT to view cycles" ON "public"."pomodoros_cycles" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "user_id") AND "public"."is_valid_personal_access_token"()));



CREATE POLICY "Enable users and PAT to view pomodoros" ON "public"."pomodoros" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "user_id") AND "public"."is_valid_personal_access_token"()));



CREATE POLICY "Enable users and PAT to view pomodoros_tags" ON "public"."pomodoros_tags" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "user_id") AND "public"."is_valid_personal_access_token"()));



CREATE POLICY "Enable users to edit their own data only" ON "public"."pomodoros" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable users to update their own data only" ON "public"."pomodoros_cycles" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable users to view their own data only" ON "public"."pomodoros" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable users to view their own data only" ON "public"."pomodoros_cycles" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable users to view their own data only" ON "public"."pomodoros_tags" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Public profiles are viewable by everyone." ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Users can delete their own keys" ON "public"."api_keys" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own pomodoro tasks" ON "public"."pomodoros_tasks" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own pomodoro tasks" ON "public"."pomodoros_tasks" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own profile." ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own profile." ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own keys" ON "public"."api_keys" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own pomodoro tasks" ON "public"."pomodoros_tasks" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own webhook traces" ON "public"."webhook_trace" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."api_keys" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pomodoros" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pomodoros_cycles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pomodoros_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pomodoros_tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."webhook_trace" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";








GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
































































































































































































GRANT ALL ON FUNCTION "public"."auto_finish_expired_pomodoros"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_finish_expired_pomodoros"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_finish_expired_pomodoros"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_pomodoro_timelapse_sql"("p_started_at" timestamp with time zone, "p_toggle_timeline" "jsonb", "p_now" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_pomodoro_timelapse_sql"("p_started_at" timestamp with time zone, "p_toggle_timeline" "jsonb", "p_now" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_pomodoro_timelapse_sql"("p_started_at" timestamp with time zone, "p_toggle_timeline" "jsonb", "p_now" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."carry_over_keep_tasks"() TO "anon";
GRANT ALL ON FUNCTION "public"."carry_over_keep_tasks"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."carry_over_keep_tasks"() TO "service_role";



GRANT ALL ON FUNCTION "public"."encolar_pomodoro_finished"() TO "anon";
GRANT ALL ON FUNCTION "public"."encolar_pomodoro_finished"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."encolar_pomodoro_finished"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_task_done_webhook"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_task_done_webhook"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_task_done_webhook"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_task_keep_reset"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_task_keep_reset"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_task_keep_reset"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_user_password_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_user_password_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_user_password_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_valid_personal_access_token"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_valid_personal_access_token"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_valid_personal_access_token"() TO "service_role";



GRANT ALL ON FUNCTION "public"."procesar_webhooks_pomodoro"() TO "anon";
GRANT ALL ON FUNCTION "public"."procesar_webhooks_pomodoro"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."procesar_webhooks_pomodoro"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_tasks_done_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_tasks_done_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_tasks_done_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_tasks_done_at_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_tasks_done_at_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_tasks_done_at_insert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_pomodoro_expected_end"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_pomodoro_expected_end"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_pomodoro_expected_end"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_task_keep_to_current_pomodoro"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_task_keep_to_current_pomodoro"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_task_keep_to_current_pomodoro"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";
























GRANT ALL ON TABLE "public"."api_keys" TO "anon";
GRANT ALL ON TABLE "public"."api_keys" TO "authenticated";
GRANT ALL ON TABLE "public"."api_keys" TO "service_role";



GRANT ALL ON TABLE "public"."pomodoros" TO "anon";
GRANT ALL ON TABLE "public"."pomodoros" TO "authenticated";
GRANT ALL ON TABLE "public"."pomodoros" TO "service_role";



GRANT ALL ON TABLE "public"."pomodoros_cycles" TO "anon";
GRANT ALL ON TABLE "public"."pomodoros_cycles" TO "authenticated";
GRANT ALL ON TABLE "public"."pomodoros_cycles" TO "service_role";



GRANT ALL ON SEQUENCE "public"."pomodoros_cycles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."pomodoros_cycles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."pomodoros_cycles_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."pomodoros_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."pomodoros_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."pomodoros_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."pomodoros_tags" TO "anon";
GRANT ALL ON TABLE "public"."pomodoros_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."pomodoros_tags" TO "service_role";



GRANT ALL ON TABLE "public"."pomodoros_tasks" TO "anon";
GRANT ALL ON TABLE "public"."pomodoros_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."pomodoros_tasks" TO "service_role";



GRANT ALL ON SEQUENCE "public"."pomodoros_tasks_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."pomodoros_tasks_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."pomodoros_tasks_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."tags" TO "anon";
GRANT ALL ON TABLE "public"."tags" TO "authenticated";
GRANT ALL ON TABLE "public"."tags" TO "service_role";



GRANT ALL ON SEQUENCE "public"."tags_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tags_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tags_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";



GRANT ALL ON TABLE "public"."webhook_trace" TO "anon";
GRANT ALL ON TABLE "public"."webhook_trace" TO "authenticated";
GRANT ALL ON TABLE "public"."webhook_trace" TO "service_role";



GRANT ALL ON TABLE "public"."v_webhook_status" TO "anon";
GRANT ALL ON TABLE "public"."v_webhook_status" TO "authenticated";
GRANT ALL ON TABLE "public"."v_webhook_status" TO "service_role";



GRANT ALL ON SEQUENCE "public"."webhook_trace_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."webhook_trace_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."webhook_trace_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";
































--
-- Dumped schema changes for auth and storage
--

CREATE OR REPLACE TRIGGER "on_auth_user_created" AFTER INSERT ON "auth"."users" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();



CREATE OR REPLACE TRIGGER "on_auth_user_password_update" AFTER UPDATE OF "encrypted_password" ON "auth"."users" FOR EACH ROW EXECUTE FUNCTION "public"."handle_user_password_update"();



CREATE POLICY "Allow authenticated user to insert their avatar" ON "storage"."objects" FOR INSERT TO "authenticated" WITH CHECK ((("bucket_id" = 'avatars'::"text") AND (("auth"."uid"())::"text" = "split_part"("name", '/'::"text", 1))));



CREATE POLICY "Allow authenticated user to select their avatar" ON "storage"."objects" FOR SELECT TO "authenticated" USING ((("bucket_id" = 'avatars'::"text") AND (("auth"."uid"())::"text" = "split_part"("name", '/'::"text", 1))));



CREATE POLICY "Avatar Delete User" ON "storage"."objects" FOR DELETE TO "authenticated" USING ((("bucket_id" = 'avatars'::"text") AND (("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text")));



CREATE POLICY "Avatar Public Read" ON "storage"."objects" FOR SELECT USING (("bucket_id" = 'avatars'::"text"));



CREATE POLICY "Avatar Update User" ON "storage"."objects" FOR UPDATE TO "authenticated" USING ((("bucket_id" = 'avatars'::"text") AND (("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text")));



CREATE POLICY "Avatar Upload User" ON "storage"."objects" FOR INSERT TO "authenticated" WITH CHECK ((("bucket_id" = 'avatars'::"text") AND (("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text")));



CREATE POLICY "Avatars are viewable by everyone" ON "storage"."objects" FOR SELECT USING (("bucket_id" = 'avatars'::"text"));



