
-- 1. Optimized Policies for public.tags
DROP POLICY IF EXISTS "Auth users and PAT can insert tags" ON "public"."tags";
CREATE POLICY "Auth users and PAT can insert tags" ON "public"."tags" FOR INSERT TO "authenticated" WITH CHECK ((((select auth.uid()) = "user_id") AND "public"."is_valid_personal_access_token"()));

DROP POLICY IF EXISTS "Auth users and PAT can read tags" ON "public"."tags";
CREATE POLICY "Auth users and PAT can read tags" ON "public"."tags" FOR SELECT TO "authenticated" USING ((((select auth.uid()) = "user_id") AND "public"."is_valid_personal_access_token"()));

DROP POLICY IF EXISTS "Enable delete for own tags" ON "public"."tags";
CREATE POLICY "Enable delete for own tags" ON "public"."tags" FOR DELETE TO "authenticated" USING (((select auth.uid()) = "user_id"));

-- Remove redundant policies on tags
DROP POLICY IF EXISTS "Enable insert for own tags" ON "public"."tags";
DROP POLICY IF EXISTS "Enable read access for own tags" ON "public"."tags";

DROP POLICY IF EXISTS "Enable update for own tags" ON "public"."tags";
CREATE POLICY "Enable update for own tags" ON "public"."tags" FOR UPDATE TO "authenticated" USING (((select auth.uid()) = "user_id")) WITH CHECK (((select auth.uid()) = "user_id"));


-- 2. Optimized Policies for public.tasks
DROP POLICY IF EXISTS "Authenticated users can create their own tasks" ON "public"."tasks";
CREATE POLICY "Authenticated users can create their own tasks" ON "public"."tasks" FOR INSERT TO "authenticated" WITH CHECK ((((select auth.uid()) = "user_id") AND "public"."is_valid_personal_access_token"()));

DROP POLICY IF EXISTS "Authenticated users can delete their own tasks" ON "public"."tasks";
CREATE POLICY "Authenticated users can delete their own tasks" ON "public"."tasks" FOR DELETE TO "authenticated" USING ((((select auth.uid()) = "user_id") AND "public"."is_valid_personal_access_token"()));

DROP POLICY IF EXISTS "Authenticated users can read their own tasks" ON "public"."tasks";
CREATE POLICY "Authenticated users can read their own tasks" ON "public"."tasks" FOR SELECT TO "authenticated" USING ((((select auth.uid()) = "user_id") AND "public"."is_valid_personal_access_token"()));

DROP POLICY IF EXISTS "Authenticated users can update their own tasks" ON "public"."tasks";
CREATE POLICY "Authenticated users can update their own tasks" ON "public"."tasks" FOR UPDATE TO "authenticated" USING ((((select auth.uid()) = "user_id") AND "public"."is_valid_personal_access_token"())) WITH CHECK ((((select auth.uid()) = "user_id") AND "public"."is_valid_personal_access_token"()));


-- 3. Optimized Policies for public.pomodoros
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON "public"."pomodoros";
CREATE POLICY "Enable delete for users based on user_id" ON "public"."pomodoros" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")); -- Actually this one was already using SELECT wrapper in the file? 
-- Line 27: USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")); 
-- The warning said "Enable users and PAT to view pomodoros" was the problem.
-- "Enable delete for users..." was NOT flagged in the list? Let me check list.
-- Only "Enable users and PAT to view pomodoros" was listed for pomodoros.
-- Wait, "multiple permissive policies" was flagged for pomodoros SELECT.

DROP POLICY IF EXISTS "Enable users and PAT to view pomodoros" ON "public"."pomodoros";
CREATE POLICY "Enable users and PAT to view pomodoros" ON "public"."pomodoros" FOR SELECT TO "authenticated" USING ((((select auth.uid()) = "user_id") AND "public"."is_valid_personal_access_token"()));

-- Remove redundant policy
DROP POLICY IF EXISTS "Enable users to view their own data only" ON "public"."pomodoros";

DROP POLICY IF EXISTS "Enable users to edit their own data only" ON "public"."pomodoros";
CREATE POLICY "Enable users to edit their own data only" ON "public"."pomodoros" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"()) = "user_id"));
-- This one also wasn't flagged but good practice.

-- 4. Optimized Policies for public.pomodoros_cycles
DROP POLICY IF EXISTS "Enable users and PAT to view cycles" ON "public"."pomodoros_cycles";
CREATE POLICY "Enable users and PAT to view cycles" ON "public"."pomodoros_cycles" FOR SELECT TO "authenticated" USING ((((select auth.uid()) = "user_id") AND "public"."is_valid_personal_access_token"()));

-- Remove redundant policies
DROP POLICY IF EXISTS "Enable users to view their own data only" ON "public"."pomodoros_cycles";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."pomodoros_cycles"; -- Dropping the "check true" one

-- Ensure insert policy is optimized
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON "public"."pomodoros_cycles";
CREATE POLICY "Enable insert for users based on user_id" ON "public"."pomodoros_cycles" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"()) = "user_id"));


-- 5. Optimized Policies for public.pomodoros_tags
DROP POLICY IF EXISTS "Enable users and PAT to view pomodoros_tags" ON "public"."pomodoros_tags";
CREATE POLICY "Enable users and PAT to view pomodoros_tags" ON "public"."pomodoros_tags" FOR SELECT TO "authenticated" USING ((((select auth.uid()) = "user_id") AND "public"."is_valid_personal_access_token"()));

-- Remove redundant policies
DROP POLICY IF EXISTS "Enable users to view their own data only" ON "public"."pomodoros_tags";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."pomodoros_tags";

-- Ensure insert policy is optimized
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON "public"."pomodoros_tags";
CREATE POLICY "Enable insert for users based on user_id" ON "public"."pomodoros_tags" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"()) = "user_id"));


-- 6. Optimized Policies for public.api_keys
DROP POLICY IF EXISTS "Users can delete their own keys" ON "public"."api_keys";
CREATE POLICY "Users can delete their own keys" ON "public"."api_keys" FOR DELETE USING (((select auth.uid()) = "user_id"));

DROP POLICY IF EXISTS "Users can view their own keys" ON "public"."api_keys";
CREATE POLICY "Users can view their own keys" ON "public"."api_keys" FOR SELECT USING (((select auth.uid()) = "user_id"));


-- 7. Optimized Policies for public.pomodoros_tasks
DROP POLICY IF EXISTS "Users can view their own pomodoro tasks" ON "public"."pomodoros_tasks";
CREATE POLICY "Users can view their own pomodoro tasks" ON "public"."pomodoros_tasks" FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own pomodoro tasks" ON "public"."pomodoros_tasks";
CREATE POLICY "Users can insert their own pomodoro tasks" ON "public"."pomodoros_tasks" FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own pomodoro tasks" ON "public"."pomodoros_tasks";
CREATE POLICY "Users can delete their own pomodoro tasks" ON "public"."pomodoros_tasks" FOR DELETE USING ((select auth.uid()) = user_id);


-- 8. Optimized Policies for public.profiles
DROP POLICY IF EXISTS "Users can insert their own profile." ON "public"."profiles";
CREATE POLICY "Users can insert their own profile." ON "public"."profiles" FOR INSERT WITH CHECK (((select auth.uid()) = "id"));

DROP POLICY IF EXISTS "Users can update their own profile." ON "public"."profiles";
CREATE POLICY "Users can update their own profile." ON "public"."profiles" FOR UPDATE USING (((select auth.uid()) = "id"));


-- 9. Optimized Policies for public.webhook_trace
DROP POLICY IF EXISTS "Users can view their own webhook traces" ON "public"."webhook_trace";
CREATE POLICY "Users can view their own webhook traces" ON "public"."webhook_trace" FOR SELECT TO "authenticated" USING (("user_id" = (select auth.uid())));


-- 10. Optimized Policies for realtime.messages
DROP POLICY IF EXISTS "Allow access to own pomodoro sync channel" ON "realtime"."messages";
CREATE POLICY "Allow access to own pomodoro sync channel" ON "realtime"."messages" FOR ALL USING (
  (auth.role() = 'authenticated' AND
  realtime.topic() = ('pomodoro_sync:' || (select auth.uid())::text))
);

DROP POLICY IF EXISTS "Allow listening for presences from a pomodoro_sync" ON "realtime"."messages";
CREATE POLICY "Allow listening for presences from a pomodoro_sync" ON "realtime"."messages" AS PERMISSIVE FOR SELECT TO "public" USING (
  ((extension = 'presence'::text) AND (realtime.topic() = ('pomodoro_sync:'::text || ((select auth.uid()))::text)))
);

DROP POLICY IF EXISTS "Publish presence to a specific channel" ON "realtime"."messages";
CREATE POLICY "Publish presence to a specific channel" ON "realtime"."messages" AS PERMISSIVE FOR INSERT TO "public" WITH CHECK (
  ((extension = 'presence'::text) AND (realtime.topic() = ('pomodoro_sync:'::text || ((select auth.uid()))::text)))
);


-- 11. Drop duplicate index on profiles
DROP INDEX IF EXISTS "public"."profiles_username_idx";
