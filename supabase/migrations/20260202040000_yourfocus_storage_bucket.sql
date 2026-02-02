-- Migration: Create yourfocus storage bucket for bitacoras, notas, and inbox
-- This bucket is PRIVATE (not public) - files require authenticated access
-- Replaces the old 'chat-attachments' bucket

-- Structure:
-- {user_id}/
-- ├── bitacora/           -- Audio transcriptions organized by day
-- │   └── YYYY_MM_DD/
-- │       ├── HH.MM.webm      (audio file)
-- │       └── HH.MM.webm.txt  (transcription)
-- ├── notas/              -- Zettelkasten-inspired notes
-- │   ├── 00 inbox/       (temporary/unprocessed notes)
-- │   ├── 10 referencias/ (reference materials)
-- │   └── 20 artefactos/  (synthesized artifacts)
-- └── inbox/              -- Chat attachments for context (temporary files)

-- 1. Note: Old 'chat-attachments' bucket is preserved (has existing files)
-- It will be deprecated but not deleted to avoid data loss

-- 2. Create 'yourfocus' storage bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'yourfocus', 
  'yourfocus', 
  false,  -- Private bucket
  83886080,  -- 80MB limit
  ARRAY[
    -- Audio formats
    'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/x-m4a',
    -- Text formats
    'text/plain', 'text/markdown', 'application/pdf',
    -- Image formats
    'image/png', 'image/jpeg', 'image/gif', 'image/webp',
    -- Document formats
    'application/json'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 83886080;

-- 3. RLS Policies for 'yourfocus' bucket

-- Policy: Users can read their own files
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
          AND tablename = 'objects' 
          AND policyname = 'Yourfocus Read Own Files'
    ) THEN
        CREATE POLICY "Yourfocus Read Own Files"
        ON storage.objects FOR SELECT
        TO authenticated
        USING (
          bucket_id = 'yourfocus' 
          AND (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;
END $$;

-- Policy: Users can upload to their own folder
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
          AND tablename = 'objects' 
          AND policyname = 'Yourfocus Upload Own Files'
    ) THEN
        CREATE POLICY "Yourfocus Upload Own Files"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (
          bucket_id = 'yourfocus' 
          AND (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;
END $$;

-- Policy: Users can update their own files
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
          AND tablename = 'objects' 
          AND policyname = 'Yourfocus Update Own Files'
    ) THEN
        CREATE POLICY "Yourfocus Update Own Files"
        ON storage.objects FOR UPDATE
        TO authenticated
        USING (
          bucket_id = 'yourfocus' 
          AND (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;
END $$;

-- Policy: Users can delete their own files
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
          AND tablename = 'objects' 
          AND policyname = 'Yourfocus Delete Own Files'
    ) THEN
        CREATE POLICY "Yourfocus Delete Own Files"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (
          bucket_id = 'yourfocus' 
          AND (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;
END $$;
