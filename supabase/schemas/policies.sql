ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users and PAT can insert tags" ON "public"."tags" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "user_id") AND "public"."is_valid_personal_access_token"()));
CREATE POLICY "Auth users and PAT can read tags" ON "public"."tags" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "user_id") AND "public"."is_valid_personal_access_token"()));
CREATE POLICY "Enable delete for own tags" ON "public"."tags" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));
CREATE POLICY "Enable insert for own tags" ON "public"."tags" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));
CREATE POLICY "Enable read access for own tags" ON "public"."tags" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));
CREATE POLICY "Enable read access for system tags" ON "public"."tags" FOR SELECT USING (("user_id" IS NULL));
CREATE POLICY "Enable update for own tags" ON "public"."tags" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));


ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can create their own tasks" ON "public"."tasks" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "user_id") AND "public"."is_valid_personal_access_token"()));
CREATE POLICY "Authenticated users can delete their own tasks" ON "public"."tasks" FOR DELETE TO "authenticated" USING ((("auth"."uid"() = "user_id") AND "public"."is_valid_personal_access_token"()));
CREATE POLICY "Authenticated users can read their own tasks" ON "public"."tasks" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "user_id") AND "public"."is_valid_personal_access_token"()));
CREATE POLICY "Authenticated users can update their own tasks" ON "public"."tasks" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() = "user_id") AND "public"."is_valid_personal_access_token"())) WITH CHECK ((("auth"."uid"() = "user_id") AND "public"."is_valid_personal_access_token"()));

ALTER TABLE "public"."pomodoros" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable delete for users based on user_id" 
ON "public"."pomodoros" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "Enable insert for users based on user_id" ON "public"."pomodoros" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "Enable users and personal access tokens to view their own data " ON "public"."pomodoros" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "user_id") AND "public"."is_valid_personal_access_token"()));
CREATE POLICY "Enable users to edit their own data only" ON "public"."pomodoros" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "Enable users to view their own data only" ON "public"."pomodoros" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

ALTER TABLE "public"."pomodoros_cycles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable insert for authenticated users only" ON "public"."pomodoros_cycles" FOR INSERT TO "authenticated" WITH CHECK (true);
CREATE POLICY "Enable insert for users based on user_id" ON "public"."pomodoros_cycles" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "Enable users and personal access tokens to view their own data " ON "public"."pomodoros_cycles" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "user_id") AND "public"."is_valid_personal_access_token"()));
CREATE POLICY "Enable users to update their own data only" ON "public"."pomodoros_cycles" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "Enable users to view their own data only" ON "public"."pomodoros_cycles" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));




ALTER TABLE "public"."pomodoros_tags" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable insert for authenticated users only" 
ON "public"."pomodoros_tags" FOR INSERT TO "authenticated" WITH CHECK (true);
CREATE POLICY "Enable insert for users based on user_id" 
ON "public"."pomodoros_tags" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "Enable users and personal access tokens to view their own data " 
ON "public"."pomodoros_tags" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "user_id") AND "public"."is_valid_personal_access_token"()));
CREATE POLICY "Enable users to view their own data only" 
ON "public"."pomodoros_tags" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON "public"."profiles" FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile." ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));
CREATE POLICY "Users can insert their own profile." ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));


ALTER TABLE "public"."api_keys" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can delete their own keys" ON "public"."api_keys" FOR DELETE USING (("auth"."uid"() = "user_id"));
CREATE POLICY "Users can view their own keys" ON "public"."api_keys" FOR SELECT USING (("auth"."uid"() = "user_id"));



alter table public.pomodoros_tasks enable row level security;

create policy "Users can view their own pomodoro tasks"
on public.pomodoros_tasks for select
using (auth.uid() = user_id);

create policy "Users can insert their own pomodoro tasks"
on public.pomodoros_tasks for insert
with check (auth.uid() = user_id);

create policy "Users can delete their own pomodoro tasks"
on public.pomodoros_tasks for delete
using (auth.uid() = user_id);

CREATE POLICY "Enable users and personal access tokens to view their own data only" 
ON public.pomodoros FOR SELECT TO "authenticated" USING (auth.uid() = user_id AND is_valid_personal_access_token());

CREATE POLICY "Enable users and personal access tokens to view their own data only" 
ON public.pomodoros_cycles FOR SELECT TO "authenticated" USING (auth.uid() = user_id AND is_valid_personal_access_token());

CREATE POLICY "Enable users and personal access tokens to view their own data only" 
ON public.pomodoros_tags FOR SELECT TO "authenticated" USING (auth.uid() = user_id AND is_valid_personal_access_token());
