-- Create tasks_tags table for many-to-many relationship between tasks and tags
CREATE TABLE IF NOT EXISTS "public"."tasks_tags" (
    "user_id" "uuid",
    "task" "uuid" NOT NULL,
    "tag" integer NOT NULL
);
ALTER TABLE "public"."tasks_tags" OWNER TO "postgres";

-- Primary key
ALTER TABLE ONLY "public"."tasks_tags"
    ADD CONSTRAINT "tasks_tags_pkey" PRIMARY KEY ("tag", "task");

-- Foreign keys
ALTER TABLE ONLY "public"."tasks_tags"
    ADD CONSTRAINT "tasks_tags_task_fkey" FOREIGN KEY ("task") 
    REFERENCES "public"."tasks"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."tasks_tags"
    ADD CONSTRAINT "tasks_tags_tag_fkey" FOREIGN KEY ("tag") 
    REFERENCES "public"."tags"("id");

ALTER TABLE ONLY "public"."tasks_tags"
    ADD CONSTRAINT "tasks_tags_user_id_fkey" FOREIGN KEY ("user_id") 
    REFERENCES "auth"."users"("id");

-- Grants
GRANT ALL ON TABLE "public"."tasks_tags" TO "anon";
GRANT ALL ON TABLE "public"."tasks_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks_tags" TO "service_role";

-- RLS
ALTER TABLE "public"."tasks_tags" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable insert for users based on user_id" 
ON "public"."tasks_tags" FOR INSERT 
WITH CHECK ((SELECT auth.uid()) = "user_id");

CREATE POLICY "Enable users and PAT to view tasks_tags" 
ON "public"."tasks_tags" FOR SELECT TO "authenticated" 
USING ((((select auth.uid()) = "user_id") AND "public"."is_valid_personal_access_token"()));

CREATE POLICY "Enable delete for users based on user_id" 
ON "public"."tasks_tags" FOR DELETE 
USING ((SELECT auth.uid()) = "user_id");
