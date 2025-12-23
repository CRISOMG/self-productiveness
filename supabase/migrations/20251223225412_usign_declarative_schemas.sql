drop policy "Enable users and personal access tokens to view their own data " on "public"."pomodoros";

drop policy "Enable users and personal access tokens to view their own data " on "public"."pomodoros_cycles";

drop policy "Enable users and personal access tokens to view their own data " on "public"."pomodoros_tags";


  create policy "Enable users and PAT to view pomodoros"
  on "public"."pomodoros"
  as permissive
  for select
  to authenticated
using (((auth.uid() = user_id) AND public.is_valid_personal_access_token()));



  create policy "Enable users and PAT to view cycles"
  on "public"."pomodoros_cycles"
  as permissive
  for select
  to authenticated
using (((auth.uid() = user_id) AND public.is_valid_personal_access_token()));



  create policy "Enable users and PAT to view pomodoros_tags"
  on "public"."pomodoros_tags"
  as permissive
  for select
  to authenticated
using (((auth.uid() = user_id) AND public.is_valid_personal_access_token()));



