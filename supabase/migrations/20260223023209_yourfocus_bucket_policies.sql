-- Ensure 'yourfocus' storage bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('yourfocus', 'yourfocus', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to view their own files in yourfocus
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
          AND tablename = 'objects' 
          AND policyname = 'Yourfocus User Select'
    ) THEN
        CREATE POLICY "Yourfocus User Select"
        ON storage.objects FOR SELECT
        TO authenticated
        USING ( bucket_id = 'yourfocus' AND (storage.foldername(name))[1] = auth.uid()::text );
    END IF;
END $$;

-- Policy: Allow authenticated users to upload files to their own folder in yourfocus
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
          AND tablename = 'objects' 
          AND policyname = 'Yourfocus User Insert'
    ) THEN
        CREATE POLICY "Yourfocus User Insert"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK ( bucket_id = 'yourfocus' AND (storage.foldername(name))[1] = auth.uid()::text );
    END IF;
END $$;

-- Policy: Allow authenticated users to update files in their own folder in yourfocus
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
          AND tablename = 'objects' 
          AND policyname = 'Yourfocus User Update'
    ) THEN
        CREATE POLICY "Yourfocus User Update"
        ON storage.objects FOR UPDATE
        TO authenticated
        USING ( bucket_id = 'yourfocus' AND (storage.foldername(name))[1] = auth.uid()::text );
    END IF;
END $$;

-- Policy: Allow authenticated users to delete files in their own folder in yourfocus
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
          AND tablename = 'objects' 
          AND policyname = 'Yourfocus User Delete'
    ) THEN
        CREATE POLICY "Yourfocus User Delete"
        ON storage.objects FOR DELETE
        TO authenticated
        USING ( bucket_id = 'yourfocus' AND (storage.foldername(name))[1] = auth.uid()::text );
    END IF;
END $$;
