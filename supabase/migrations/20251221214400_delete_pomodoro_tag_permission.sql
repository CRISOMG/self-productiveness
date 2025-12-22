create policy "Enable delete for users based on user_id"
on "public"."pomodoros_tags" as PERMISSIVE
for DELETE to public
using ((select auth.uid()) = user_id);


