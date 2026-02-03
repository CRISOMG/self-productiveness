import { useTaskTagRepository } from "./use-task-tag-repository";

export const useTaskTagService = () => {
  const repo = useTaskTagRepository();

  async function addTagToTask(taskId: string, tagId: number, userId: string) {
    return await repo.insert(taskId, tagId, userId);
  }

  async function removeTagFromTask(taskId: string, tagId: number) {
    return await repo.remove(taskId, tagId);
  }

  async function getTaskTags(taskId: string) {
    return await repo.listByTaskId(taskId);
  }

  async function setTaskTags(taskId: string, tagIds: number[], userId: string) {
    return await repo.replaceTagsForTask(taskId, tagIds, userId);
  }

  return {
    addTagToTask,
    removeTagFromTask,
    getTaskTags,
    setTaskTags,
  };
};
