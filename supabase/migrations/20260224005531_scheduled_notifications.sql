-- Habilitar extensiones necesarias
create extension if not exists "pg_cron" with schema "pg_catalog";
create extension if not exists "pgmq" cascade;

-- 1. Tabla: notification_templates
create table public.notification_templates (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    title text not null,
    body text not null,
    icon text,
    link text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.notification_templates enable row level security;

create policy "Users can view notification_templates" 
on public.notification_templates for select 
using (true); -- Asumiendo que las plantillas de notificación son globales por ahora

-- 2. Tabla: scheduled_notifications
create table public.scheduled_notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    template_id uuid references public.notification_templates(id) on delete set null,
    rrule text, -- Opcional: Si es nulo, es una notificación puntual (One-off)
    scheduled_at timestamp with time zone not null,
    last_executed_at timestamp with time zone,
    timezone text not null default 'UTC',
    payload_override jsonb, -- { title: "...", body: "...", icon: "...", link: "..." }
    status text not null default 'active' check (status in ('active', 'paused', 'completed')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Índices para optimizar la búsqueda del pg_cron
create index ix_scheduled_notifications_scheduled_at on public.scheduled_notifications (scheduled_at);
create index ix_scheduled_notifications_status on public.scheduled_notifications (status);
create index ix_scheduled_notifications_user_id on public.scheduled_notifications (user_id);

alter table public.scheduled_notifications enable row level security;

create policy "Users can manage their own scheduled notifications" 
on public.scheduled_notifications for all 
using (auth.uid() = user_id);

-- (Trigger removed because public.handle_updated_at() was not found remotely)

-- 3. Crear Cola de PGMQ
select pgmq.create('notifications_queue');

-- 4. Job de pg_cron: Dispatcher
-- Corre cada minuto (* * * * *)
-- Busca notificaciones activas que tocaba enviar hoy/antes y las mete a pgmq
select cron.schedule(
    'notification-dispatcher',
    '* * * * *',
    $$
    with due_notifications as (
        select id 
        from public.scheduled_notifications 
        where scheduled_at <= now() 
        and status = 'active'
        for update skip locked
    )
    select pgmq.send('notifications_queue', jsonb_build_object('id', id))
    from due_notifications;
    $$
);
