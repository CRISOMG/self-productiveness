



CREATE POLICY "Enable users and personal access tokens to view their own data only" 
ON public.pomodoros FOR SELECT TO "authenticated" USING (auth.uid() = user_id AND is_valid_personal_access_token());

CREATE POLICY "Enable users and personal access tokens to view their own data only" 
ON public.pomodoros_cycles FOR SELECT TO "authenticated" USING (auth.uid() = user_id AND is_valid_personal_access_token());

CREATE POLICY "Enable users and personal access tokens to view their own data only" 
ON public.pomodoros_tags FOR SELECT TO "authenticated" USING (auth.uid() = user_id AND is_valid_personal_access_token());


ALTER TABLE public.pomodoros ALTER COLUMN started_at DROP NOT NULL;
ALTER TABLE public.pomodoros ALTER COLUMN started_at SET DEFAULT NULL;