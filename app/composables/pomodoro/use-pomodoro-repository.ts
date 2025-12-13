import type { PostgrestError } from "@supabase/supabase-js";
import type { Pomodoro, PomodoroCycle, Tag } from "~/types/Pomodoro";
import {
  hasCycleFinished,
  calculateTimelineFromNow,
} from "~/utils/pomodoro-domain";

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
          `
      )
      .eq("cycle.state", "current");

    handleError(error);
    return data;
  }

  async function insert(pomodoro: Pomodoro["Insert"], tagId?: number) {
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
      .maybeSingle()
      .throwOnError();

    if (tagId) {
      const tags = await supabase
        .from("pomodoros_tags")
        .insert({
          pomodoro: data.id,
          user_id: pomodoro.user_id,
          tag: tagId,
        })
        .select(`*,pomodoro (*), tag (*)`)
        .maybeSingle()
        .throwOnError();
    }

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
      .maybeSingle()
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
      .maybeSingle();

    handleError(error);
    return data;
  }
  async function getOne(id: number) {
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
      `
      )
      .eq("id", id)
      .maybeSingle();

    handleError(error);
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
      .maybeSingle();

    handleError(error);

    return data;
  }

  async function insert(pomodoroCycle: PomodoroCycle["Insert"]) {
    const { data } = await supabase
      .from("pomodoros_cycles")
      .insert(pomodoroCycle)
      .select()
      .maybeSingle()
      .throwOnError();

    return data;
  }

  async function update(id: number, pomodoroCycle: PomodoroCycle["Update"]) {
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
          `
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
      .maybeSingle();
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
      .maybeSingle()
      .throwOnError();

    return data;
  }

  async function update(id: number, tag: Tag["Update"]) {
    const { data } = await supabase
      .from(fromTable)
      .update(tag)
      .eq("id", id)
      .select()
      .maybeSingle()
      .throwOnError();

    return data;
  }

  async function getOne(id: number) {
    const { data } = await supabase
      .from(fromTable)
      .select()
      .eq("id", id)
      .maybeSingle()
      .throwOnError();

    return data;
  }

  async function getOneByType(type: string) {
    const { data } = await supabase
      .from(fromTable)
      .select()
      .eq("type", type)
      .maybeSingle()
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
