import type { Tag } from "~/types/Pomodoro";

export const useTagRepository = () => {
  const supabase = useSupabaseClient();
  const fromTable = "tags";

  async function getOneByType(type: string) {
    const { data } = await supabase
      .from(fromTable)
      .select()
      .eq("type", type)
      .maybeSingle()
      .throwOnError();
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

  async function listByUserId(userId: string) {
    const { data } = await supabase
      .from(fromTable)
      .select()
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order("label", { ascending: true })
      .throwOnError();
    return data;
  }

  async function search(query: string, userId: string) {
    const { data } = await supabase
      .from(fromTable)
      .select()
      .or(`user_id.eq.${userId},user_id.is.null`)
      .ilike("label", `%${query}%`)
      .limit(10)
      .throwOnError();
    return data;
  }

  return {
    getOneByType,
    insert,
    update,
    getOne,
    listByUserId,
    search,
  };
};
