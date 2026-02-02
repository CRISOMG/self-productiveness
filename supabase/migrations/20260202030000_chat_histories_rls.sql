-- Migration: Add RLS policies for n8n_chat_histories table
-- This allows authenticated users to insert and select their own chat messages

-- First, let's check if the table exists and has RLS enabled
-- If not, we enable it

-- Enable RLS on the table (if not already enabled)
ALTER TABLE IF EXISTS n8n_chat_histories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own chat messages" ON n8n_chat_histories;
DROP POLICY IF EXISTS "Users can insert their own chat messages" ON n8n_chat_histories;

-- Create SELECT policy: Users can only view their own messages
CREATE POLICY "Users can view their own chat messages"
ON n8n_chat_histories
FOR SELECT
USING (session_id::text = auth.uid()::text);

-- Create INSERT policy: Users can only insert messages with their own session_id
CREATE POLICY "Users can insert their own chat messages"
ON n8n_chat_histories
FOR INSERT
WITH CHECK (session_id::text = auth.uid()::text);
