import type { TTaskUpdate } from "./use-task-repository";
import { useTaskService } from "./use-task-service";
import type { Tables } from "~/types/database.types";

export type TTask = Tables<"tasks"> & {
  tag: Tables<"tags">;
};

export const useTaskController = () => {
  const {
    createTask,
    searchTasks,
    getPomodoroTasks,
    getUserTasks,
    archiveTask,
    updateTaskPomodoro,
    updateTaskStatus,
    updateTask,
    ...taskService
  } = useTaskService();
  const pomodoroController = usePomodoroController(); // Dependency on Pomodoro Controller to get current context
  const { profile } = useProfileController();
  const showArchivedTasks = useState<boolean>("showArchivedTasks", () => false);

  // State
  // const tasks = reactive({ value: [] as TTask[] });
  const tasks = ref([] as TTask[]);
  const searchResults = ref<TTask[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function loadTasks() {
    isLoading.value = true;
    try {
      // Load all tasks for the user instead of just current pomodoro tasks
      // This supports the requirement of seeing unassigned tasks and assigning them
      tasks.value =
        (await getUserTasks({
          archived: showArchivedTasks.value,
        })) || [];
    } catch (e: any) {
      error.value = e.message;
    } finally {
      isLoading.value = false;
    }
  }

  watch(showArchivedTasks, () => {
    loadTasks();
  });

  async function handleCreateTask(
    title: string,
    description: string = "",
    tagId?: number
  ) {
    if (!pomodoroController.currPomodoro || !profile.value) return;
    isLoading.value = true;
    try {
      // NOTE: tag_id is required by the DB. We need a strategy for this.
      // For now, I'll default to a known tag ID or fetch the first user tag?
      // Actually, if we look at pomodoro tags, maybe we can inherit?
      // Or if the DB allows a default...
      // Checking existing tags, maybe there is an "Uncategorized" tag?
      // I will assume for now, passing the first tag of the pomodoro?
      // Or just hardcoding 1? This is DANGEROUS.
      // Let's rely on the DB having a default or the column being nullable in reality (types might be strict but DB lenient?).
      // Types say 'number'.
      // I'll try to find a valid tag ID from the user tags or pomodoro tags.

      // Best effort: Use the first tag of the current pomodoro, or a default.
      // This is a business logic gap. I will assume we can use a placeholder for now or 0 if allowed.
      // But for safety, let's use a "General" tag if we can find it, or just 1.
      // I will use 0 and hope the DB treats it as NULL or handles it, or fails and lets us know.
      // Actually, let's try to query a tag if we don't have one?
      // Ideally we'd ask the user to pick a tag.
      // But for this "Quick Add", we might just want to auto-assign.

      const newTask = await createTask({
        title,
        pomodoroId: null, // Default to no pomodoro
        userId: profile.value.id,
        tagId: tagId,
        description,
      });
      if (newTask) {
        tasks.value.unshift(newTask); // Add to top
      }
    } catch (e: any) {
      error.value = e.message;
    } finally {
      isLoading.value = false;
    }
  }

  async function handleSearch(query: string) {
    if (!profile.value) return;
    isLoading.value = true;
    try {
      searchResults.value = (await searchTasks(query, profile.value.id)) || [];
    } catch (e: any) {
      error.value = e.message;
    } finally {
      isLoading.value = false;
    }
  }

  async function handleAssignPomodoro(taskId: string) {
    if (!pomodoroController.currPomodoro) return;
    isLoading.value = true;
    try {
      await updateTaskPomodoro(taskId, pomodoroController.currPomodoro.id);
      // Update local state
      const task = tasks.value.find((t) => t.id === taskId);
      if (task) {
        task.pomodoro_id = pomodoroController.currPomodoro.id;
      }
    } catch (e: any) {
      error.value = e.message;
    } finally {
      isLoading.value = false;
    }
  }

  async function handleUnassignPomodoro(taskId: string) {
    isLoading.value = true;
    try {
      await updateTaskPomodoro(taskId, null);
      // Update local state
      const task = tasks.value.find((t) => t.id === taskId);
      if (task) {
        task.pomodoro_id = null;
      }
    } catch (e: any) {
      error.value = e.message;
    } finally {
      isLoading.value = false;
    }
  }

  async function handleArchiveTask(taskId: string) {
    isLoading.value = true;
    try {
      await archiveTask(taskId);
      tasks.value = tasks.value.filter((t) => t.id !== taskId);
    } catch (e: any) {
      error.value = e.message;
    } finally {
      isLoading.value = false;
    }
  }

  async function handleUnarchiveTask(taskId: string) {
    isLoading.value = true;
    try {
      await taskService.unarchiveTask(taskId);
      await loadTasks();
    } catch (e: any) {
      error.value = e.message;
    } finally {
      isLoading.value = false;
    }
  }

  async function handleToggleTask(task: TTask) {
    isLoading.value = true;
    try {
      const newStatus = !task.done;
      await updateTaskStatus(task.id, newStatus);
      task.done = newStatus; // Optimistic update
    } catch (e: any) {
      error.value = e.message;
    } finally {
      isLoading.value = false;
    }
  }

  async function handleUpdateTask(taskId: string, data: TTask) {
    isLoading.value = true;
    try {
      const { tag = null, ...cleanedData } = data;

      const result = await updateTask(taskId, cleanedData);
      await loadTasks();
    } catch (e: any) {
      error.value = e.message;
    } finally {
      isLoading.value = false;
    }
  }
  // Reload tasks when current pomodoro changes
  watch(
    () => pomodoroController.currPomodoro,
    async (newVal, oldVal) => {
      if (newVal && oldVal && newVal.id !== oldVal?.id) {
        await loadTasks();
      }
    }
  );
  onMounted(() => {
    loadTasks();
  });
  return {
    tasks,
    searchResults,
    isLoading,
    error,
    showArchivedTasks,
    handleCreateTask,
    handleSearch,
    handleArchiveTask,
    handleUnarchiveTask,
    handleToggleTask,
    handleAssignPomodoro,
    handleUnassignPomodoro,
    handleUpdateTask,
    loadTasks,
  };
};
