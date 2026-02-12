import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "~/types/database.types";

export type TTaskUpdate = TablesUpdate<"tasks">;
export type TTaskInsert = TablesInsert<"tasks">;

export const useTaskRepository = () => {
  const supabase = useSupabaseClient();
  const fromTable = "tasks";
  const SELECT_WITH_TAGS = `*, tag:tag_id(*), tags!tasks_tags(*)`;

  async function getOne(id: string) {
    const { data } = await supabase
      .from(fromTable)
      .select(SELECT_WITH_TAGS)
      .eq("id", id)
      .maybeSingle()
      .throwOnError();
    return data as TTask;
  }

  async function insert(task: TTaskInsert) {
    const { data } = await supabase
      .from(fromTable)
      .insert(task)
      .select(SELECT_WITH_TAGS)
      .maybeSingle()
      .throwOnError();
    return data as TTask;
  }

  async function update(id: string, task: TTaskUpdate) {
    // Strip joined/virtual fields that aren't real columns
    const { tags, tag, ...cleanTask } = task as any;
    const { data } = await supabase
      .from(fromTable)
      .update(cleanTask)
      .eq("id", id)
      .select(SELECT_WITH_TAGS)
      .maybeSingle()
      .throwOnError();
    return data;
  }

  async function archive(id: string) {
    const { error } = await supabase
      .from(fromTable)
      .update({ archived: true })
      .eq("id", id)
      .throwOnError();
    return error;
  }

  async function unarchive(id: string) {
    const { error } = await supabase
      .from(fromTable)
      .update({ archived: false })
      .eq("id", id)
      .throwOnError();
    return error;
  }

  async function listByPomodoroId(pomodoroId: number) {
    const { data } = await supabase
      .from(fromTable)
      .select(SELECT_WITH_TAGS)
      .eq("pomodoro_id", pomodoroId)
      .eq("archived", false)
      .order("created_at", { ascending: true })
      .throwOnError();
    return data;
  }

  type ListByUserIdParams = {
    archived: boolean;
  };
  async function listByUserId({ archived }: ListByUserIdParams) {
    const query = supabase.from(fromTable).select(SELECT_WITH_TAGS);

    if (!archived) {
      query.eq("archived", false);
    }

    const { data } = await query
      // .order("created_at", { ascending: false })
      .throwOnError();
    return data as TTask[];
  }

  async function search(query: string, userId: string) {
    const { data } = await supabase
      .from(fromTable)
      .select(SELECT_WITH_TAGS)
      .eq("user_id", userId)
      .eq("archived", false)
      .ilike("title", `%${query}%`)
      .limit(10)
      .throwOnError();
    return data as TTask[];
  }

  return {
    getOne,
    insert,
    update,
    archive,
    unarchive,
    listByPomodoroId,
    listByUserId,
    search,
  };
};
