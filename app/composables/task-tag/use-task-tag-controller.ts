import { useTaskTagService } from "./use-task-tag-service";

export type TaskTag = {
  id: number;
  label: string;
  type: string | null;
};

export const useTaskTagController = () => {
  const service = useTaskTagService();
  const { profile } = useProfileController();

  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function handleAddTag(taskId: string, tagId: number) {
    if (!profile.value) return;
    isLoading.value = true;
    error.value = null;

    try {
      await service.addTagToTask(taskId, tagId, profile.value.id);
    } catch (e: any) {
      error.value = e.message;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function handleRemoveTag(taskId: string, tagId: number) {
    isLoading.value = true;
    error.value = null;

    try {
      await service.removeTagFromTask(taskId, tagId);
    } catch (e: any) {
      error.value = e.message;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function handleSetTags(taskId: string, tagIds: number[]) {
    if (!profile.value) return;
    isLoading.value = true;
    error.value = null;

    try {
      await service.setTaskTags(taskId, tagIds, profile.value.id);
    } catch (e: any) {
      error.value = e.message;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function loadTaskTags(taskId: string): Promise<TaskTag[]> {
    isLoading.value = true;
    error.value = null;

    try {
      const tags = await service.getTaskTags(taskId);
      return (tags || []) as TaskTag[];
    } catch (e: any) {
      error.value = e.message;
      return [];
    } finally {
      isLoading.value = false;
    }
  }

  return {
    isLoading,
    error,
    handleAddTag,
    handleRemoveTag,
    handleSetTags,
    loadTaskTags,
  };
};
