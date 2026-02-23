import type { Database } from "~/types/database.types";

export type TaskTemplateRow =
  Database["public"]["Tables"]["task_templates"]["Row"];
export type TaskTemplateTagRow =
  Database["public"]["Tables"]["task_templates_tags"]["Row"];

export type TTaskTemplate = TaskTemplateRow & {
  tags: { id: number; label: string }[];
};

export const useTaskTemplatesController = () => {
  const supabase = useSupabaseClient<Database>();
  const { profile } = useProfileController();

  const templates = ref([] as TTaskTemplate[]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function loadTemplates() {
    if (!profile.value?.id) return;

    isLoading.value = true;
    try {
      const { data, error: fetchError } = await supabase
        .from("task_templates")
        .select(
          `
          *,
          task_templates_tags (
            tag_id,
            tags (id, label)
          )
        `,
        )
        .eq("user_id", profile.value.id)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      templates.value =
        data?.map((t: any) => ({
          ...t,
          tags:
            t.task_templates_tags?.map((tt: any) => tt.tags).filter(Boolean) ||
            [],
        })) || [];
    } catch (e: any) {
      error.value = e.message;
      console.error("Error loading task templates:", e);
    } finally {
      isLoading.value = false;
    }
  }

  async function handleCreateTemplate(
    title: string,
    defaultDescription?: string,
    tagIds?: number[],
  ) {
    if (!profile.value?.id) return null;

    isLoading.value = true;
    try {
      const { data: template, error: createError } = await supabase
        .from("task_templates")
        .insert({
          title,
          default_description: defaultDescription || null,
          user_id: profile.value.id,
        })
        .select()
        .single();

      if (createError) throw createError;

      if (tagIds && tagIds.length > 0 && template) {
        const tagRows = tagIds.map((tagId) => ({
          template_id: template.id,
          tag_id: tagId,
        }));
        await supabase.from("task_templates_tags").insert(tagRows);
      }

      await loadTemplates();
      return template;
    } catch (e: any) {
      error.value = e.message;
      console.error("Error creating task template:", e);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  async function handleUpdateTemplate(
    id: string,
    title?: string,
    defaultDescription?: string,
    tagIds?: number[],
  ) {
    if (!profile.value?.id) return;

    isLoading.value = true;
    try {
      const updates: Partial<TaskTemplateRow> = {};
      if (title !== undefined) updates.title = title;
      if (defaultDescription !== undefined)
        updates.default_description = defaultDescription;

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from("task_templates")
          .update(updates)
          .eq("id", id)
          .eq("user_id", profile.value.id);

        if (updateError) throw updateError;
      }

      if (tagIds !== undefined) {
        await supabase
          .from("task_templates_tags")
          .delete()
          .eq("template_id", id);

        if (tagIds.length > 0) {
          const tagRows = tagIds.map((tagId) => ({
            template_id: id,
            tag_id: tagId,
          }));
          await supabase.from("task_templates_tags").insert(tagRows);
        }
      }

      await loadTemplates();
    } catch (e: any) {
      error.value = e.message;
      console.error("Error updating task template:", e);
    } finally {
      isLoading.value = false;
    }
  }

  async function handleDeleteTemplate(id: string) {
    if (!profile.value?.id) return;

    isLoading.value = true;
    try {
      const { error: deleteError } = await supabase
        .from("task_templates")
        .delete()
        .eq("id", id)
        .eq("user_id", profile.value.id);

      if (deleteError) throw deleteError;

      templates.value = templates.value.filter((t) => t.id !== id);
    } catch (e: any) {
      error.value = e.message;
      console.error("Error deleting task template:", e);
    } finally {
      isLoading.value = false;
    }
  }

  return {
    templates,
    isLoading,
    error,
    loadTemplates,
    handleCreateTemplate,
    handleUpdateTemplate,
    handleDeleteTemplate,
  };
};
