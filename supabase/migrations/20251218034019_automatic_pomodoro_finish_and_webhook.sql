
-- Function to calculate timelapse in seconds based on toggle_timeline
CREATE OR REPLACE FUNCTION public.calculate_pomodoro_timelapse_sql(
    p_started_at timestamptz,
    p_toggle_timeline jsonb,
    p_now timestamptz DEFAULT now()
) RETURNS integer AS $$
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
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger function to update expected_end automatically
    CREATE OR REPLACE FUNCTION public.sync_pomodoro_expected_end()
    RETURNS trigger AS $$
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
    $$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_pomodoro_expected_end
BEFORE INSERT OR UPDATE OF state, toggle_timeline, expected_duration
ON public.pomodoros
FOR EACH ROW
EXECUTE FUNCTION public.sync_pomodoro_expected_end();

-- Function to be called by pg_cron to finish expired pomodoros
CREATE OR REPLACE FUNCTION public.auto_finish_expired_pomodoros()
RETURNS void AS $$
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
$$ LANGUAGE plpgsql;

-- Schedule the cron job (runs every minute)
-- Note: We check if it exists first to avoid duplicate errors in local dev
SELECT cron.schedule(
    'pomodoro-auto-finish',
    '* * * * *',
    'SELECT public.auto_finish_expired_pomodoros()'
);

-- Webhook Trigger logic
CREATE OR REPLACE FUNCTION public.handle_pomodoro_finished_webhook()
RETURNS trigger AS $$
DECLARE
    v_webhook_url text;
    v_user_profile record;
BEGIN
    -- Only trigger when state changes to finished
    IF (OLD.state IS DISTINCT FROM 'finished' AND NEW.state = 'finished') THEN
        
        -- Get user's webhook_url from profiles
        SELECT settings->>'webhook_url' INTO v_webhook_url
        FROM public.profiles
        WHERE id = NEW.user_id;

        IF v_webhook_url IS NOT NULL AND v_webhook_url <> '' THEN
            -- Send async webhook using pg_net
            PERFORM net.http_post(
                url := v_webhook_url,
                body := jsonb_build_object(
                    'event', 'pomodoro.finished',
                    'pomodoro', jsonb_build_object(
                        'id', NEW.id,
                        'type', NEW.type,
                        'duration', NEW.expected_duration,
                        'started_at', NEW.started_at,
                        'finished_at', NEW.finished_at,
                        'user_id', NEW.user_id
                    )
                ),
                headers := '{"Content-Type": "application/json"}'::jsonb
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pomodoro_finished_webhook
AFTER UPDATE ON public.pomodoros
FOR EACH ROW
EXECUTE FUNCTION public.handle_pomodoro_finished_webhook();


-- Alter expected_end to allow NULL values
SET lock_timeout = '5s';
ALTER TABLE public.pomodoros ALTER COLUMN expected_end DROP NOT NULL;
ALTER TABLE public.pomodoros ALTER COLUMN expected_end SET DEFAULT NULL;
