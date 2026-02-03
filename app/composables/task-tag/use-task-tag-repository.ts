export const useTaskTagRepository = () => {
  const supabase = useSupabaseClient();
  const fromTable = "tasks_tags";

  async function insert(taskId: string, tagId: number, userId: string) {
    const { data, error } = await supabase
      .from(fromTable)
      .insert({ task: taskId, tag: tagId, user_id: userId })
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async function remove(taskId: string, tagId: number) {
    const { error } = await supabase
      .from(fromTable)
      .delete()
      .eq("task", taskId)
      .eq("tag", tagId);

    if (error) throw error;
  }

  async function listByTaskId(taskId: string) {
    const { data, error } = await supabase
      .from(fromTable)
      .select("tag, tags:tag(id, label, type)")
      .eq("task", taskId);

    if (error) throw error;
    return data?.map((row) => row.tags) || [];
  }

  async function removeAllByTaskId(taskId: string) {
    const { error } = await supabase
      .from(fromTable)
      .delete()
      .eq("task", taskId);

    if (error) throw error;
  }

  async function bulkInsert(taskId: string, tagIds: number[], userId: string) {
    if (tagIds.length === 0) return [];

    const rows = tagIds.map((tagId) => ({
      task: taskId,
      tag: tagId,
      user_id: userId,
    }));

    const { data, error } = await supabase
      .from(fromTable)
      .insert(rows)
      .select();

    if (error) throw error;
    return data;
  }

  async function replaceTagsForTask(
    taskId: string,
    tagIds: number[],
    userId: string,
  ) {
    // Delete all existing tags for this task
    await removeAllByTaskId(taskId);

    // Insert new tags
    if (tagIds.length > 0) {
      return await bulkInsert(taskId, tagIds, userId);
    }
    return [];
  }

  return {
    insert,
    remove,
    listByTaskId,
    removeAllByTaskId,
    bulkInsert,
    replaceTagsForTask,
  };
};
