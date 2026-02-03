-- Create enum type for task stage
CREATE TYPE public.task_stage AS ENUM ('backlog', 'to_do', 'in_progress', 'done', 'archived');

-- Add stage column to tasks table with default 'backlog'
ALTER TABLE public.tasks 
ADD COLUMN stage public.task_stage DEFAULT 'backlog'::public.task_stage;
