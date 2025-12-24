
  create policy "Allow access to own pomodoro sync channel"
  on "realtime"."messages"
  as permissive
  for all
  to public
using (((auth.role() = 'authenticated'::text) AND (realtime.topic() = ('pomodoro_sync:'::text || (auth.uid())::text))));



  create policy "Allow broadcasting presences on all channels for authenticated "
  on "realtime"."messages"
  as permissive
  for insert
  to authenticated
with check ((extension = 'presence'::text));



  create policy "Allow listening for presences from a pomodoro_sync"
  on "realtime"."messages"
  as permissive
  for select
  to public
using (((extension = 'presence'::text) AND (realtime.topic() = ('pomodoro_sync:'::text || (auth.uid())::text))));



  create policy "Allow listening for presences on all channels for authenticated"
  on "realtime"."messages"
  as permissive
  for select
  to authenticated
using ((extension = 'presence'::text));



  create policy "Publish presence to a specific channel"
  on "realtime"."messages"
  as permissive
  for insert
  to public
with check (((extension = 'presence'::text) AND (realtime.topic() = ('pomodoro_sync:'::text || (auth.uid())::text))));



