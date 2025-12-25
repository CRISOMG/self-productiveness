
ALTER FUNCTION public.auto_finish_expired_pomodoros() SET search_path = public;
ALTER FUNCTION public.calculate_pomodoro_timelapse_sql(timestamp with time zone, jsonb, timestamp with time zone) SET search_path = public;
ALTER FUNCTION public.carry_over_keep_tasks() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.handle_task_done_webhook() SET search_path = public, net, extensions;
ALTER FUNCTION public.handle_task_keep_reset() SET search_path = public;
ALTER FUNCTION public.handle_user_password_update() SET search_path = public;
ALTER FUNCTION public.is_valid_personal_access_token() SET search_path = public;
ALTER FUNCTION public.procesar_webhooks_pomodoro() SET search_path = public, pgmq, net, extensions;
ALTER FUNCTION public.set_tasks_done_at() SET search_path = public;
ALTER FUNCTION public.set_tasks_done_at_insert() SET search_path = public;
ALTER FUNCTION public.sync_pomodoro_expected_end() SET search_path = public;
ALTER FUNCTION public.sync_task_keep_to_current_pomodoro() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
