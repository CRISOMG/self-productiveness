-- Create default buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, null, null)
ON CONFLICT (id) DO NOTHING;

-- Example: Add other buckets here
-- INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments', 'chat-attachments', false) ON CONFLICT (id) DO NOTHING;
