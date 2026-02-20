-- Add ON DELETE CASCADE to all foreign keys referencing auth.users to allow user deletion

-- Profiles
ALTER TABLE "public"."profiles"
DROP CONSTRAINT IF EXISTS "profiles_id_fkey",
ADD CONSTRAINT "profiles_id_fkey"
FOREIGN KEY ("id")
REFERENCES "auth"."users"("id")
ON DELETE CASCADE;

-- API Keys
ALTER TABLE "public"."api_keys"
DROP CONSTRAINT IF EXISTS "api_keys_user_id_fkey",
ADD CONSTRAINT "api_keys_user_id_fkey"
FOREIGN KEY ("user_id")
REFERENCES "auth"."users"("id")
ON DELETE CASCADE;

-- Pomodoro Cycles
ALTER TABLE "public"."pomodoros_cycles"
DROP CONSTRAINT IF EXISTS "pomodoros_cycles_user_id_fkey",
ADD CONSTRAINT "pomodoros_cycles_user_id_fkey"
FOREIGN KEY ("user_id")
REFERENCES "auth"."users"("id")
ON DELETE CASCADE;

-- Pomodoro Tags
ALTER TABLE "public"."pomodoros_tags"
DROP CONSTRAINT IF EXISTS "pomodoros_tags_user_id_fkey",
ADD CONSTRAINT "pomodoros_tags_user_id_fkey"
FOREIGN KEY ("user_id")
REFERENCES "auth"."users"("id")
ON DELETE CASCADE;

-- Tasks
ALTER TABLE "public"."tasks"
DROP CONSTRAINT IF EXISTS "tasks_user_id_fkey",
ADD CONSTRAINT "tasks_user_id_fkey"
FOREIGN KEY ("user_id")
REFERENCES "auth"."users"("id")
ON DELETE CASCADE;

-- Webhook Trace
ALTER TABLE "public"."webhook_trace"
DROP CONSTRAINT IF EXISTS "webhook_trace_user_id_fkey",
ADD CONSTRAINT "webhook_trace_user_id_fkey"
FOREIGN KEY ("user_id")
REFERENCES "auth"."users"("id")
ON DELETE CASCADE;

-- Tasks Tags
ALTER TABLE "public"."tasks_tags"
DROP CONSTRAINT IF EXISTS "tasks_tags_user_id_fkey",
ADD CONSTRAINT "tasks_tags_user_id_fkey"
FOREIGN KEY ("user_id")
REFERENCES "auth"."users"("id")
ON DELETE CASCADE;
