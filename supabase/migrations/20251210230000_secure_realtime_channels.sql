-- Enable RLS on the realtime.messages table (virtual table for Broadcast/Presence)
-- alter publication supabase_realtime add table realtime.messages;

-- Create a policy to allow users to broadcast/subscribe only to their own channel
-- The topic is 'pomodoro_sync:USER_ID'
create policy "Allow access to own pomodoro sync channel"
on realtime.messages
for all
using (
  -- Check if the user is authenticated
  auth.role() = 'authenticated' and
  -- Check if the topic ends with the user's ID (sub)
  realtime.topic() = 'pomodoro_sync:' || auth.uid()::text
);
