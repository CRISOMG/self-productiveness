import type { Pomodoro, PomodoroCycle } from "~/types/Pomodoro";
import {
  hasCycleFinished,
  calculateTimelineFromNow,
} from "~/utils/pomodoro-domain";

export const usePomodoroRepository = () => {
  const supabase = useSupabaseClient();

  async function getCurrentPomodorosOfCurrentCycle() {
    const pomodorosWithCycleAndTagsQuery = await supabase
      .from("pomodoros")
      .select(
        `
          *,
          cycle (*),
          tags (*)
          `
      )
      .eq("cycle.state", "current")
      .throwOnError();
    const result = pomodorosWithCycleAndTagsQuery.data;
    return result;
  }

  async function insert(pomodoro: Pomodoro["Insert"], tagId: TagIdByType) {
    const { data } = await supabase
      .from("pomodoros")
      .insert(pomodoro)
      .select()
      .single()
      .throwOnError();

    const tags = await supabase
      .from("pomodoros_tags")
      .insert({
        pomodoro: data.id,
        user_id: pomodoro.user_id,
        tag: tagId,
      })
      .select()
      .single()
      .throwOnError();

    return data;
  }
  async function update(id: number, pomodoro: Pomodoro["Update"]) {
    const { data } = await supabase
      .from("pomodoros")
      .update(pomodoro)
      .eq("id", id)
      .select()
      .order("created_at", { ascending: false })
      .single()
      .throwOnError();

    return data;
  }
  async function getCurrentPomodoro() {
    const { data, error } = await supabase
      .from("pomodoros")
      .select(
        `
          *,
          cycle (state)
          `
      )
      .neq("state", "finished")
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }
    return data;
  }
  async function getOne(id: number) {
    const { data } = await supabase
      .from("pomodoros")
      .select()
      .eq("id", id)
      .single()
      .throwOnError();

    return data;
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
          cycle (state),
          tags (*)
          `
      )
      .gte("started_at", today.toISOString())
      .lt("started_at", tomorrow.toISOString())
      .throwOnError();

    return data;
  }
  return {
    insert,
    update,
    getOne,
    getCurrentPomodoro,
    getCurrentPomodorosOfCurrentCycle,
    listToday,
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
          `
      )
      .filter("state", "eq", "current")
      .single();
    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return data;
  }

  async function insert(pomodoroCycle: PomodoroCycle["Insert"]) {
    const { data } = await supabase
      .from("pomodoros_cycles")
      .insert(pomodoroCycle)
      .select()
      .single()
      .throwOnError();

    return data;
  }

  async function update(id: number, pomodoroCycle: PomodoroCycle["Update"]) {
    const { data } = await supabase
      .from("pomodoros_cycles")
      .update(pomodoroCycle)
      .eq("id", id)
      .select()
      .single()
      .throwOnError();

    return data;
  }

  async function getOne(id: number) {
    const { data } = await supabase
      .from("pomodoros_cycles")
      .select()
      .eq("id", id)
      .single()
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
