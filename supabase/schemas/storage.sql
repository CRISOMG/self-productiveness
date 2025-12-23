
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




--   create policy "Avatar Delete User"
--   on "storage"."objects"
--   as permissive
--   for delete
--   to authenticated
-- using (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



--   create policy "Avatar Public Read"
--   on "storage"."objects"
--   as permissive
--   for select
--   to public
-- using ((bucket_id = 'avatars'::text));



--   create policy "Avatar Update User"
--   on "storage"."objects"
--   as permissive
--   for update
--   to authenticated
-- using (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



--   create policy "Avatar Upload User"
--   on "storage"."objects"
--   as permissive
--   for insert
--   to authenticated
-- with check (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));


