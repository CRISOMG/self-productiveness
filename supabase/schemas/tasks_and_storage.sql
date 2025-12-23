-- Declarative Schema for Tasks Webhook and Avatars Storage

-- -----------------------------------------------------------------------------
-- 1. Storage: Avatars Bucket
-- -----------------------------------------------------------------------------

-- Create 'avatars' storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for 'avatars'

-- Policy: Allow public read access (Avatar Public Read)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
          AND tablename = 'objects' 
          AND policyname = 'Avatar Public Read'
    ) THEN
        CREATE POLICY "Avatar Public Read"
        ON storage.objects FOR SELECT
        USING ( bucket_id = 'avatars' );
    END IF;
END $$;

-- Policy: Allow authenticated users to upload their own avatar
-- Users can only upload to a folder matching their user ID.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
          AND tablename = 'objects' 
          AND policyname = 'Avatar Upload User'
    ) THEN
        CREATE POLICY "Avatar Upload User"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK ( bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text );
    END IF;
END $$;

-- Policy: Allow authenticated users to update their own avatar
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
          AND tablename = 'objects' 
          AND policyname = 'Avatar Update User'
    ) THEN
        CREATE POLICY "Avatar Update User"
        ON storage.objects FOR UPDATE
        TO authenticated
        USING ( bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text );
    END IF;
END $$;

-- Policy: Allow authenticated users to delete their own avatar
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
          AND tablename = 'objects' 
          AND policyname = 'Avatar Delete User'
    ) THEN
        CREATE POLICY "Avatar Delete User"
        ON storage.objects FOR DELETE
        TO authenticated
        USING ( bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text );
    END IF;
END $$;


-- -----------------------------------------------------------------------------
-- 2. Webhook: Task Done
-- -----------------------------------------------------------------------------

-- Function to handle the webhook when a task is marked as done
CREATE OR REPLACE FUNCTION public.handle_task_done_webhook()
RETURNS trigger AS $$
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
$$ LANGUAGE plpgsql;

-- Trigger definition
-- Drop trigger if exists to allow re-runnability/updates
DROP TRIGGER IF EXISTS trigger_task_done_webhook ON public.tasks;

CREATE TRIGGER trigger_task_done_webhook
AFTER UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.handle_task_done_webhook();
