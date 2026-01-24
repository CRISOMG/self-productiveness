import type { PostgrestError } from "@supabase/supabase-js";

function handleError(error: PostgrestError | null) {
  if (error && error.code !== "PGRST116") {
    console.log(error);
    throw error;
  }
}
export const usePomodoroRepository = () => {
  const supabase = useSupabaseClient();

  async function getCurrentPomodorosOfCurrentCycle() {
    const { data, error } = await supabase
      .from("pomodoros")
      .select(
        `
          *,
          cycle (
            *,
            pomodoros (*)
          ),
          tags (*)
          `,
      )
      .eq("cycle.state", "current");

    handleError(error);
    return data;
  }

  async function insert(pomodoro: PomodoroInsert) {
    const { data } = await supabase
      .from("pomodoros")
      .insert(pomodoro)
      .select(
        `
          *,
          cycle (
            *,
            pomodoros (*)
          ),
          tags (*)
          `,
      )
      .maybeSingle()
      .throwOnError();

    return data;
  }
  async function update(id: number, pomodoro: Partial<TPomodoro>) {
    const { data } = await supabase
      .from("pomodoros")
      .update(pomodoro)
      .eq("id", id)
      .select(
        `
          *,
          cycle (
            *,
            pomodoros (*)
          ),
          tags (*)
          `,
      )
      .order("created_at", { ascending: false })
      .maybeSingle()
      .throwOnError();

    return data as TPomodoro;
  }
  async function getCurrentPomodoro() {
    const { data, error } = await supabase
      .from("pomodoros")
      .select(
        `
          *,
          cycle (
            *,
            pomodoros (*)
          ),
          tags (*)
          `,
      )
      .neq("state", "finished")
      .maybeSingle();

    handleError(error);
    return data as TPomodoro | null;
  }
  async function getOne(id: number): Promise<TPomodoro> {
    const { data, error } = await supabase
      .from("pomodoros")
      .select(
        `
        *,
        cycle (
          *,
          pomodoros (
            tags (*)
          )
        ),
        tags (*)
      `,
      )
      .eq("id", id)
      .maybeSingle();

    handleError(error);
    return data as TPomodoro;
  }
  async function listToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const { data } = await supabase
      .from("pomodoros")
      .select(
        `
          *,
          cycle (
            *,
            pomodoros (*)
          ),
          tags (*)
          `,
      )
      .gte("started_at", today.toISOString())
      .lt("started_at", tomorrow.toISOString())
      .throwOnError();

    return (data as TPomodoro[]) || [];
  }
  async function addTag(pomodoroId: number, tagId: number, userId: string) {
    const { data } = await supabase
      .from("pomodoros_tags")
      .insert({
        pomodoro: pomodoroId,
        tag: tagId,
        user_id: userId,
      })
      .select()
      .maybeSingle()
      .throwOnError();
    return data;
  }

  async function removeTag(pomodoroId: number, tagId: number) {
    const { error } = await supabase
      .from("pomodoros_tags")
      .delete()
      .eq("pomodoro", pomodoroId)
      .eq("tag", tagId);

    if (error) throw error;
  }

  async function addTask(pomodoroId: number, taskId: string, userId: string) {
    const { data } = await supabase
      .from("pomodoros_tasks")
      .insert({
        pomodoro_id: pomodoroId,
        task_id: taskId,
        user_id: userId,
      })
      .select()
      .maybeSingle()
      .throwOnError();
    return data;
  }

  async function removeTask(pomodoroId: number, taskId: string) {
    const { error } = await supabase
      .from("pomodoros_tasks")
      .delete()
      .eq("pomodoro_id", pomodoroId)
      .eq("task_id", taskId);

    if (error) throw error;
  }

  async function getTaskIds(pomodoroId: number) {
    const { data, error } = await supabase
      .from("pomodoros_tasks")
      .select("task_id")
      .eq("pomodoro_id", pomodoroId);

    if (error) throw error;
    return data.map((t) => t.task_id);
  }

  return {
    insert,
    update,
    getOne,
    getCurrentPomodoro,
    getCurrentPomodorosOfCurrentCycle,
    listToday,
    addTag,
    removeTag,
    addTask,
    removeTask,
    getTaskIds,
  };
};

export const usePomodoroCycleRepository = () => {
  const supabase = useSupabaseClient();

  async function getCurrent() {
    const { data, error } = await supabase
      .from("pomodoros_cycles")
      .select(
        `
            *,
            pomodoros (
              *,
              tags (*)
            )
          `,
      )
      .filter("state", "eq", "current")
      .maybeSingle();

    handleError(error);

    return data;
  }

  async function insert(pomodoroCycle: PomodoroCycle) {
    const { data } = await supabase
      .from("pomodoros_cycles")
      .insert(pomodoroCycle)
      .select()
      .maybeSingle()
      .throwOnError();

    return data;
  }

  async function update(id: number, pomodoroCycle: PomodoroCycle) {
    const { data, error } = await supabase
      .from("pomodoros_cycles")
      .update(pomodoroCycle)
      .eq("id", id)
      .select()
      .maybeSingle();

    handleError(error);
    return data;
  }

  async function getOne(id: number) {
    const { data } = await supabase
      .from("pomodoros_cycles")
      .select(
        `
            *,
            pomodoros (
              *,
              tags (*)
            )
          `,
      )
      .eq("id", id)
      .maybeSingle()
      .throwOnError();

    return data;
  }

  return {
    insert,
    update,
    getOne,
    getCurrent,
  };
};
