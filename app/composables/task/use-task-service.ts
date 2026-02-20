import { useTaskRepository, type TTaskUpdate } from "./use-task-repository";
import { normalizeTaskTitle, isValidTaskTitle } from "./use-task-domain";
import type { TaskStage } from "~/types/tables";

// DTO type
type CreateTaskParams = {
  title: string;
  pomodoroId?: number | null;
  userId: string;
  tagId?: number;
  description?: string;
  keep?: boolean;
  stage?: TaskStage;
};
export const useTaskService = () => {
  const repository = useTaskRepository();

  async function createTask({
    title,
    pomodoroId,
    userId,
    tagId,
    description,
    keep,
    stage,
  }: CreateTaskParams) {
    const normalized = normalizeTaskTitle(title);
    if (!isValidTaskTitle(normalized)) {
      throw new Error("Invalid task title");
    }

    return await repository.insert({
      title: normalized,
      pomodoro_id: pomodoroId as any, // Expecting nullable in DB but types not updated yet
      user_id: userId,
      tag_id: (tagId ? tagId : null) as any,
      description: description || null,
      archived: false,
      keep: keep ?? false,
      stage: stage || undefined,
    });
  }

  async function searchTasks(query: string, userId: string) {
    if (!query) return [];
    return await repository.search(query, userId);
  }

  async function getPomodoroTasks(pomodoroId: number) {
    return await repository.listByPomodoroId(pomodoroId);
  }

  type GetUserTasksParams = {
    archived: boolean;
  };
  async function getUserTasks({ archived }: GetUserTasksParams) {
    return await repository.listByUserId({ archived });
  }

  async function updateTaskPomodoro(id: string, pomodoroId: number | null) {
    return await repository.update(id, { pomodoro_id: pomodoroId });
  }

  async function archiveTask(id: string) {
    return await repository.archive(id);
  }

  async function unarchiveTask(id: string) {
    return await repository.unarchive(id);
  }

  async function updateTaskStatus(id: string, done: boolean) {
    return await repository.update(id, { done });
  }

  async function updateTask(id: string, data: TTaskUpdate) {
    return await repository.update(id, data);
  }

  return {
    createTask,
    searchTasks,
    getPomodoroTasks,
    getUserTasks,
    updateTaskPomodoro,
    archiveTask,
    unarchiveTask,
    updateTaskStatus,
    updateTask,
  };
};
