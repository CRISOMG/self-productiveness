-- Add keep column to tasks
alter table public.tasks add column keep boolean default false;

-- Function to handle keep logic: 
-- 1. Reset keep to null/false when done or archived
-- 2. Sync with pomodoro_tasks when keep is toggled

-- Function to reset keep on done/archive
create or replace function public.handle_task_keep_reset()
returns trigger as $$
begin
  if NEW.done = true or NEW.archived = true then
    NEW.keep = false;
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger tr_reset_task_keep
before insert or update of done, archived on public.tasks
for each row
execute function public.handle_task_keep_reset();


-- Function to sync keep tasks to current pomodoro (triggered on task update)
create or replace function public.sync_task_keep_to_current_pomodoro()
returns trigger as $$
declare
  current_pomodoro_id bigint;
begin
  -- Get the current pomodoro for the user
  select id into current_pomodoro_id
  from public.pomodoros
  where user_id = NEW.user_id 
    and state = 'current'
  limit 1;

  if current_pomodoro_id is not null then
    if NEW.keep = true then
      -- Insert if not exists
      insert into public.pomodoros_tasks (pomodoro_id, task_id, user_id)
      values (current_pomodoro_id, NEW.id, NEW.user_id)
      on conflict (pomodoro_id, task_id) do nothing;
    else
      -- Remove if keep is set to false (unassign)
      delete from public.pomodoros_tasks
      where pomodoro_id = current_pomodoro_id
        and task_id = NEW.id;
    end if;
  end if;

  return NEW;
end;
$$ language plpgsql;

create trigger tr_sync_task_keep
after update of keep on public.tasks
for each row
when (OLD.keep is distinct from NEW.keep)
execute function public.sync_task_keep_to_current_pomodoro();


-- Function to carry over keep tasks to NEW pomodoro
create or replace function public.carry_over_keep_tasks()
returns trigger as $$
begin
  insert into public.pomodoros_tasks (pomodoro_id, task_id, user_id)
  select NEW.id, t.id, NEW.user_id
  from public.tasks t
  where t.user_id = NEW.user_id
    and t.keep = true
    and (t.done = false or t.done is null)
    and (t.archived = false or t.archived is null)
  on conflict (pomodoro_id, task_id) do nothing;
  return NEW;
end;
$$ language plpgsql;

create trigger tr_carry_over_keep_tasks
after insert on public.pomodoros
for each row
execute function public.carry_over_keep_tasks();

-- Also trigger on update in case a pomodoro transitions to current? 
-- The user said "with the following pomodoro created", so mainly insert.
-- But if we "play" a paused one? "Relation of the task... with the following pomodoro". 
-- Usually "Start/Select" creates a new one. "Play" resumes. 
-- If I resume a pomodoro, should "keep" tasks be added? 
-- The prompt implies "next pomodoro created". Let's stick to INSERT for now to avoid re-adding tasks to an old pomodoro if we revisit it (though state 'current' check handles that).
-- Actually, if I pause and resume, I might want new 'keep' tasks to join?
-- Let's stick to INSERT for 'carry over' logic as explicitly requested "with the following pomodoro created".
