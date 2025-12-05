import type { PostgrestError } from "@supabase/supabase-js";
import type { Pomodoro, PomodoroCycle, Tag } from "~/types/Pomodoro";
import {
  hasCycleFinished,
  calculateTimelineFromNow,
} from "~/utils/pomodoro-domain";

function handleError(error: PostgrestError | null) {
  if (error && error.code !== "PGRST116") {
    throw error;
  }
}
export const usePomodoroRepository = () => {
  const supabase = useSupabaseClient();

  async function getCurrentPomodorosOfCurrentCycle() {
    const pomodorosWithCycleAndTagsQuery = await supabase
      .from("pomodoros")
      .select(
        `
          *,
          cycle (
            *,
            pomodoros (*)
          ),
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
      .select(
        `
          *,
          cycle (
            *,
            pomodoros (*)
          ),
          tags (*)
          `
      )
      .single()
      .throwOnError();

    const tags = await supabase
      .from("pomodoros_tags")
      .insert({
        pomodoro: data.id,
        user_id: pomodoro.user_id,
        tag: tagId,
      })
      .select(`*,pomodoro (*), tag (*)`)
      .single()
      .throwOnError();

    const updatedPomodoro = await getOne(data.id);
    return updatedPomodoro;
  }
  async function update(id: number, pomodoro: Pomodoro["Update"]) {
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
          `
      )
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
          cycle (
            *,
            pomodoros (*)
          ),
          tags (*)
          `
      )
      .neq("state", "finished")
      .single();

    handleError(error);
    return data;
  }
  async function getOne(id: number) {
    const { data } = await supabase
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
      `
      )
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
          cycle (
            *,
            pomodoros (*)
          ),
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
    const { data, error } = await supabase
      .from("pomodoros_cycles")
      .update(pomodoroCycle)
      .eq("id", id)
      .select()
      .single();

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
          `
      )
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

export const useTagRepository = () => {
  const supabase = useSupabaseClient();

  const fromTable = "tags";

  async function getCurrent() {
    const { data, error } = await supabase
      .from(fromTable)
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

  async function insert(tag: Tag["Insert"]) {
    const { data } = await supabase
      .from(fromTable)
      .insert(tag)
      .select()
      .single()
      .throwOnError();

    return data;
  }

  async function update(id: number, tag: Tag["Update"]) {
    const { data } = await supabase
      .from(fromTable)
      .update(tag)
      .eq("id", id)
      .select()
      .single()
      .throwOnError();

    return data;
  }

  async function getOne(id: number) {
    const { data } = await supabase
      .from(fromTable)
      .select()
      .eq("id", id)
      .single()
      .throwOnError();

    return data;
  }

  async function getOneByType(type: string) {
    const { data } = await supabase
      .from(fromTable)
      .select()
      .eq("type", type)
      .single()
      .throwOnError();

    return data;
  }

  return {
    insert,
    update,
    getOne,
    getCurrent,
    getOneByType,
  };
};
