CREATE TABLE public.task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  default_description TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.task_templates_tags (
  template_id UUID NOT NULL REFERENCES public.task_templates(id) ON DELETE CASCADE,
  tag_id BIGINT NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (template_id, tag_id)
);

-- Enable RLS
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_templates_tags ENABLE ROW LEVEL SECURITY;

-- Policies for task_templates
CREATE POLICY "Users can view their own templates"
  ON public.task_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own templates"
  ON public.task_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON public.task_templates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON public.task_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for task_templates_tags
CREATE POLICY "Users can view tags of their own templates"
  ON public.task_templates_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.task_templates
      WHERE task_templates.id = task_templates_tags.template_id
      AND task_templates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert tags for their own templates"
  ON public.task_templates_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.task_templates
      WHERE task_templates.id = task_templates_tags.template_id
      AND task_templates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tags for their own templates"
  ON public.task_templates_tags FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.task_templates
      WHERE task_templates.id = task_templates_tags.template_id
      AND task_templates.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.task_templates
      WHERE task_templates.id = task_templates_tags.template_id
      AND task_templates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tags for their own templates"
  ON public.task_templates_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.task_templates
      WHERE task_templates.id = task_templates_tags.template_id
      AND task_templates.user_id = auth.uid()
    )
  );
