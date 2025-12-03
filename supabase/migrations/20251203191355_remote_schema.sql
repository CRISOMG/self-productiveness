alter table "public"."pomodoros_tags" drop constraint "pomodoros_tags_pomodoro_fkey";

alter table "public"."pomodoros" alter column "expected_duration" set default '1500'::smallint;

alter table "public"."pomodoros" alter column "expected_duration" set not null;

alter table "public"."pomodoros_tags" add constraint "pomodoros_tags_pomodoro_fkey" FOREIGN KEY (pomodoro) REFERENCES public.pomodoros(id) ON DELETE CASCADE not valid;

alter table "public"."pomodoros_tags" validate constraint "pomodoros_tags_pomodoro_fkey";


  create policy "Enable users to update their own data only"
  on "public"."pomodoros_cycles"
  as permissive
  for update
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



