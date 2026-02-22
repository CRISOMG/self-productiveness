-- Create user_secrets table for BYOK & Community key storage
-- Keys are encrypted server-side with AES-256-GCM before storage

CREATE TABLE IF NOT EXISTS public.user_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_value TEXT NOT NULL,
  iv TEXT NOT NULL,
  tag TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_user_secrets_user_id ON public.user_secrets(user_id);

-- Unique constraint: one secret per name per user (NULL user_id = community)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_secrets_unique_name
  ON public.user_secrets(user_id, name);

-- RLS
ALTER TABLE public.user_secrets ENABLE ROW LEVEL SECURITY;

-- Users can manage their own secrets
CREATE POLICY "Users manage own secrets"
  ON public.user_secrets
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users can read community secrets (user_id IS NULL)
CREATE POLICY "Authenticated users can read community secrets"
  ON public.user_secrets
  FOR SELECT
  USING (user_id IS NULL AND auth.role() = 'authenticated');
