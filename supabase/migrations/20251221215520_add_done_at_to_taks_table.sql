SET lock_timeout = '5s';

-- Trigger function to update done_at based on done
CREATE OR REPLACE FUNCTION set_tasks_done_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.done IS DISTINCT FROM OLD.done THEN
    IF NEW.done = true THEN
      NEW.done_at = now();
    ELSE
      NEW.done_at = NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Also for initial inserts if done starts as true
CREATE OR REPLACE FUNCTION set_tasks_done_at_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.done = true THEN
    NEW.done_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function
CREATE TRIGGER tasks_done_at_trigger
BEFORE UPDATE OF done ON "public"."tasks"
FOR EACH ROW
EXECUTE FUNCTION set_tasks_done_at();


CREATE TRIGGER tasks_done_at_insert_trigger
BEFORE INSERT ON "public"."tasks"
FOR EACH ROW
EXECUTE FUNCTION set_tasks_done_at_insert();



ALTER TABLE "public"."tasks" ADD COLUMN "done_at" TIMESTAMP WITH TIME ZONE DEFAULT NULL;


