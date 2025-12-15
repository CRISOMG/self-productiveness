
-- migration: 20251214150000_enable_user_tags.sql

-- Add user_id to tags if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tags' AND column_name = 'user_id') THEN
        ALTER TABLE "public"."tags" ADD COLUMN "user_id" uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Drop existing unique constraints
ALTER TABLE "public"."tags" DROP CONSTRAINT IF EXISTS "tags_label_key";
ALTER TABLE "public"."tags" DROP CONSTRAINT IF EXISTS "tags_type_key";

-- Create partial unique index on type for system tags (where user_id is null)
-- This preserves the existing behavior for 'focus', 'break' etc.
CREATE UNIQUE INDEX IF NOT EXISTS "tags_type_system_idx" ON "public"."tags" ((type)) WHERE user_id IS NULL;

-- Create partial unique index on label for system tags
CREATE UNIQUE INDEX IF NOT EXISTS "tags_label_system_idx" ON "public"."tags" (label) WHERE user_id IS NULL;

-- Create partial unique index on label for user tags (per user)
CREATE UNIQUE INDEX IF NOT EXISTS "tags_label_user_idx" ON "public"."tags" (label, user_id) WHERE user_id IS NOT NULL;

-- Enable RLS
ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;

-- Drop old policy if exists
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."tags";

-- Policies
-- 1. Everyone can read system tags
CREATE POLICY "Enable read access for system tags" ON "public"."tags" FOR SELECT
USING (user_id IS NULL);

-- 2. Users can read their own tags
CREATE POLICY "Enable read access for own tags" ON "public"."tags" FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3. Users can insert their own tags
CREATE POLICY "Enable insert for own tags" ON "public"."tags" FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 4. Users can update their own tags
CREATE POLICY "Enable update for own tags" ON "public"."tags" FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Users can delete their own tags
CREATE POLICY "Enable delete for own tags" ON "public"."tags" FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Make type column optional (nullable) since new user tags might not need a 'type' unless we use it for generic categorization
ALTER TABLE "public"."tags" ALTER COLUMN "type" DROP NOT NULL;
