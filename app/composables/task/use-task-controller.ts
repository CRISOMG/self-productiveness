import type { TTaskUpdate } from "./use-task-repository";
import { useTaskService } from "./use-task-service";
import type { TaskRow, TagRow, TaskStage } from "~/types/tables";
import { type RealtimeChannel } from "@supabase/supabase-js";

export type { TaskStage };

export type TTask = TaskRow & {
  tag: TagRow;
  tags?: { id: number; label: string }[];
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

  const supabase = useSupabaseClient();

  // State
  const tasks = ref([] as TTask[]);
  const searchResults = ref<TTask[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function loadTasks() {
    isLoading.value = true;
    try {
      // Load all tasks for the user
      const userTasks =
        (await getUserTasks({
          archived: showArchivedTasks.value,
        })) || [];

      tasks.value = userTasks;
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
    tagId?: number,
  ) {
    if (!pomodoroController.currPomodoro || !profile.value) return;
    isLoading.value = true;
    try {
      const newTask = await createTask({
        title,
        pomodoroId: null,
        userId: profile.value.id,
        tagId: tagId,
        description,
        keep: false, // Default to false
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
    isLoading.value = true;
    try {
      await updateTask(taskId, { keep: true } as any);

      const task = tasks.value.find((t) => t.id === taskId);
      if (task) {
        task.keep = true;
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
      await updateTask(taskId, { keep: false } as any);

      const task = tasks.value.find((t) => t.id === taskId);
      if (task) {
        task.keep = false;
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
      // Since DB trigger resets 'keep' on done, we should reflect that locally if needed.
      // But typically we wait for a refresh or just let optimistic UI handle 'done'.
      // If we want to be strict, if done=true, keep should be false.
      if (newStatus) {
        task.keep = false;
      }
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

      await updateTask(taskId, cleanedData);
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
      // Logic for reloading tasks if context changes, although with 'keep' persistence
      // we might just want to ensure we have the latest state.
      // The previous logic synced assignedTaskIds, now we just reload to get latest 'keep' status
      // in case the DB triggers modified things (like carry over).
      if (newVal && newVal.id !== oldVal?.id) {
        await loadTasks();
      }
    },
    { immediate: true },
  );
  let myChannel: any = null;

  const setupRealtime = () => {
    // 1. IMPORTANTE: Usar un nombre de canal ÚNICO y NUEVO.
    // Esto evita que choques con la conexión "zombie" anterior que sale en los logs.
    const channelName = `tasks_realtime_${Date.now()}`;

    // 2. Definición limpia
    myChannel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks", // <--- ESTO FALTABA EN TU PAYLOAD
          // Si tienes problemas de RLS, prueba quitando el filter por ahora
          // filter: 'user_id=eq.TU_ID'
        },
        (payload) => {
          console.log("🔔 Cambio recibido:", payload);
          loadTasks(); // Tu función de recarga
        },
      )
      .subscribe((status, err) => {
        console.log(`Estado (${channelName}):`, status);

        if (status === "SUBSCRIBED") {
          console.log("✅ Conexión establecida y sincronizada.");
        }
        if (status === "CHANNEL_ERROR") {
          console.error("❌ Error de canal (Posible RLS o Mismatch):", err);
        }
      });
  };

  onMounted(() => {
    loadTasks();
    setupRealtime();
  });

  onUnmounted(async () => {
    if (myChannel) {
      console.log("🔌 Desconectando...");
      await supabase.removeChannel(myChannel);
      myChannel = null;
    }
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
