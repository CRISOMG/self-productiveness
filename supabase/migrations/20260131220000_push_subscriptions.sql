-- Push Subscriptions table for Web Push Notifications
-- Stores the subscription object from PushManager.subscribe() per device

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  subscription jsonb not null,
  device_info text,
  created_at timestamptz default now(),
  
  -- Prevent duplicate subscriptions per user/device
  unique(user_id, subscription)
);

-- Enable Row Level Security
alter table public.push_subscriptions enable row level security;

-- Policy: Users can only manage their own subscriptions
create policy "Users can manage own push subscriptions"
on public.push_subscriptions for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Index for faster lookups by user_id
create index idx_push_subscriptions_user_id on public.push_subscriptions(user_id);

comment on table public.push_subscriptions is 'Stores Web Push subscription objects for each user device';
comment on column public.push_subscriptions.subscription is 'JSON object from PushSubscription.toJSON() containing endpoint, keys.p256dh, keys.auth';
comment on column public.push_subscriptions.device_info is 'Optional user agent or device identifier for debugging';
