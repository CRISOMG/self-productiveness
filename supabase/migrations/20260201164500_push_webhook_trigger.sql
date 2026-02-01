-- ============================================
-- Push Notification Webhook Trigger
-- ============================================
-- Este trigger llama a la Edge Function send-push cuando un pomodoro
-- cambia su estado a 'finished'.
--
-- IMPORTANTE: Después de aplicar esta migración, debes agregar el secret:
-- INSERT INTO vault.secrets (name, secret)
-- VALUES ('service_role_key', 'tu-service-role-key-aqui');
-- ============================================

-- Función helper para obtener la URL del proyecto
create or replace function supabase_url()
returns text
language sql
stable
as $$
  select 'https://meneprjtfpcppidpgava.supabase.co'::text;
$$;

-- Trigger function para enviar push notification cuando pomodoro termina
create or replace function public.trigger_send_push_on_pomodoro_finished()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  service_key text;
begin
  -- Solo disparar cuando el estado cambia a 'finished'
  if NEW.state = 'finished' and (OLD.state is null or OLD.state != 'finished') then
    
    -- Obtener service_role_key del vault
    select decrypted_secret into service_key
    from vault.decrypted_secrets
    where name = 'service_role_key'
    limit 1;
    
    -- Si no hay key configurada, salir silenciosamente
    if service_key is null then
      raise warning 'service_role_key not found in vault. Push notification not sent.';
      return NEW;
    end if;
    
    perform net.http_post(
      url := supabase_url() || '/functions/v1/send-push',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key
      ),
      body := jsonb_build_object(
        'type', 'UPDATE',
        'table', 'pomodoros',
        'record', jsonb_build_object(
          'id', NEW.id,
          'user_id', NEW.user_id,
          'state', NEW.state,
          'expected_duration', NEW.expected_duration,
          'type', NEW.type
        )
      )
    );
  end if;
  
  return NEW;
end;
$$;

-- Crear trigger en la tabla pomodoros
drop trigger if exists trigger_push_on_pomodoro_finished on public.pomodoros;

create trigger trigger_push_on_pomodoro_finished
  after update on public.pomodoros
  for each row
  execute function public.trigger_send_push_on_pomodoro_finished();

-- Comentarios
comment on function supabase_url() is 'Returns the Supabase project URL';
comment on function public.trigger_send_push_on_pomodoro_finished() is 
  'Sends push notification via Edge Function when a pomodoro state changes to finished';
