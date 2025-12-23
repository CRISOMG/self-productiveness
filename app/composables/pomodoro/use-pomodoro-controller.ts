import { useNotificationController } from "../system/use-notification-controller";
import { useTaskController } from "../task/use-task-controller";
import type { TimelineEvent, TPomodoro } from "~/types/Pomodoro";
import {
  calculatePomodoroTimelapse,
  PomodoroDurationInSecondsByDefaultCycleConfiguration,
  TagIdByType,
  PomodoroType,
} from "~/utils/pomodoro-domain";
import { useBroadcastPomodoro } from "./use-broadcast-pomodoro";

export const usePomodoroController = defineStore("pomodoro", () => {
  //#region DEPENDENCIES
  const keepTags = useKeepSelectedTags();

  const currPomodoro = ref<TPomodoro | null>(null);
  const pomodorosListToday = ref<TPomodoro[] | null>();
  const loadingPomodoros = ref<boolean>(false);

  const pomodoroService = usePomodoroService();
  // const taskController = useTaskController(); // Removed dependency as logic moved to DB triggers

  const timeController = useTimer();
  const toast = useSuccessErrorToast();
  const notificationController = useNotificationController();
  //#endregion

  //#region HELPER FUNCTIONS
  // Centraliza el cálculo del tiempo restante o timelapse
  const updateLocalState = (pomodoro: TPomodoro) => {
    if (!pomodoro.id) return;
    pomodoro.timelapse = calculatePomodoroTimelapse(
      pomodoro.started_at || "",
      pomodoro.toggle_timeline as Array<{
        at: string;
        type: "play" | "pause";
      }>
    );
  };

  const computeExpectedEnd = (pomodoro: TPomodoro) => {
    const duration = (pomodoro as any).expected_duration || 25 * 60;
    const timelapse = calculatePomodoroTimelapse(
      pomodoro.started_at,
      pomodoro.toggle_timeline
    );
    return new Date(Date.now() + (duration - timelapse) * 1000).toISOString();
  };
  //#endregion

  //#region BROADCAST & REALTIME
  const { broadcastEvent, isMainHandler } = useBroadcastPomodoro({
    onPlay: (payload: any) => {
      console.log("pomodoro:play", payload);

      currPomodoro.value!.toggle_timeline = payload.payload.toggle_timeline;
      currPomodoro.value!.state = "current";
      updateLocalState(currPomodoro.value!);
      handleStartTimer();
    },
    onPause: (payload: any) => {
      console.log("pomodoro:pause", payload);
      if (currPomodoro.value?.id !== payload.payload.id) return;

      currPomodoro.value!.toggle_timeline = payload.payload.toggle_timeline;
      currPomodoro.value!.state = "paused";
      updateLocalState(currPomodoro.value!);

      timeController.clearTimer();
      const remaining =
        ((currPomodoro.value as any).expected_duration || 25 * 60) -
        currPomodoro.value!.timelapse;
      timeController.setClockInSeconds(remaining);
    },
    onFinish: (payload: any) => {
      console.log("pomodoro:finish", payload);
      handleFinishPomodoro({ withNext: false, broadcast: false }); // Evitar loop infinito de broadcast
    },
    onNext: () => getCurrentPomodoro(),
  });
  //#endregion

  //#region PERSISTENCE & LIFECYCLE
  watch(
    () => currPomodoro.value,
    (newVal) => {
      if (newVal) {
        localStorage.setItem("currPomodoro.value", JSON.stringify(newVal));
        handleListPomodoros();
      } else {
        localStorage.removeItem("currPomodoro.value");
      }
    },
    { deep: true }
  );

  onMounted(async () => {
    await getCurrentPomodoro();
    handleListPomodoros();
    notificationController.requestPermission();
  });

  onUnmounted(() => {
    timeController.clearTimer();
  });

  // Shortcuts
  defineShortcuts({
    "t-n": () =>
      notificationController.notify("Test Notification", { body: "Working!" }),
  });
  //#endregion

  //#region CORE ACTIONS
  function handleStartTimer() {
    if (!currPomodoro.value) return;
    const safePomodoro = currPomodoro.value as TPomodoro;

    timeController.startTimer({
      expected_end: computeExpectedEnd(safePomodoro),
      clockStartInMinute:
        (((safePomodoro as any).expected_duration || 1500) -
          safePomodoro.timelapse) /
        60,

      onTick: (remaining) => {
        if (remaining % 5 === 0) {
          handleSyncPomodoro();
        }
      },
      onFinish: () => {
        // 1. Finalizar localmente y crear el siguiente si soy el "Main Handler"
        handleFinishPomodoro({
          withNext: isMainHandler.value,
          broadcast: true,
        });

        // 2. Notificar al usuario
        notificationController.notify("Pomodoro finished!", {
          body: "Time to take a break!",
          icon: "/favicon.ico",
          requireInteraction: true,
        });
      },
    });
  }

  async function getCurrentPomodoro() {
    const remotePomodoro = await pomodoroService.getCurrentPomodoro();

    // Prioridad: Servidor > LocalStorage (para evitar estados viejos)
    if (remotePomodoro) {
      currPomodoro.value = remotePomodoro;
      updateLocalState(remotePomodoro);

      const remaining =
        remotePomodoro.expected_duration - remotePomodoro.timelapse;

      if (remaining <= 0) return handleFinishPomodoro();

      timeController.setClockInSeconds(remaining);
      if (remotePomodoro.state === "current") handleStartTimer();
    } else {
      // Limpiar si no hay activo en servidor
      currPomodoro.value = null;
    }
  }

  async function handleStartPomodoro(
    user_id: string,
    type?: string,
    state?: "current" | "paused"
  ) {
    // Lógica para iniciar o reanudar
    if (!currPomodoro.value?.id) {
      // Crear uno nuevo
      currPomodoro.value = await pomodoroService.startPomodoro({
        user_id,
        type: type as any,
        state,
      });

      await handleListPomodoros();
    } else {
      // Reanudar existente (Play)
      currPomodoro.value = await pomodoroService.registToggleTimelinePomodoro(
        currPomodoro.value.id,
        "play"
      );
    }

    handleStartTimer();

    if (currPomodoro.value) {
      broadcastEvent("pomodoro:play", {
        id: currPomodoro.value.id,
        toggle_timeline: currPomodoro.value.toggle_timeline,
        started_at: currPomodoro.value.started_at,
      });
    }
  }

  async function handlePausePomodoro() {
    if (!currPomodoro.value) return;

    // Optimistic UI Update: Pausar visualmente antes de que responda el servidor
    timeController.clearTimer();

    const newEvent: TimelineEvent = {
      at: new Date().toISOString(),
      type: "pause",
    };
    const newTimeline = [
      ...(currPomodoro.value.toggle_timeline || []),
      newEvent,
    ];

    // Actualizar localmente para reactividad inmediata
    currPomodoro.value.state = "paused";
    currPomodoro.value.toggle_timeline = newTimeline;

    // Llamada API
    const result = await pomodoroService.update(currPomodoro.value.id, {
      toggle_timeline: newTimeline,
      state: "paused",
      expected_end: computeExpectedEnd(currPomodoro.value),
    });

    currPomodoro.value = result; // Reconciliación con servidor

    broadcastEvent("pomodoro:pause", {
      id: result.id,
      toggle_timeline: result.toggle_timeline,
    });
  }

  type TFinishParams = {
    clockInSeconds?: number;
    withNext?: boolean;
    broadcast?: boolean;
  };

  async function handleFinishPomodoro({
    clockInSeconds = 0,
    withNext = false,
    broadcast = true,
  }: TFinishParams = {}) {
    if (!currPomodoro.value || currPomodoro.value.state === "finished") return;

    const finishedId = currPomodoro.value.id;
    currPomodoro.value.state = "finished";

    // Detener timer UI
    timeController.clearTimer();
    timeController.setClockInSeconds(clockInSeconds);

    // Guardar en DB
    await pomodoroService.finishCurrentPomodoro({
      timelapse: currPomodoro.value.timelapse,
    });

    if (broadcast) {
      broadcastEvent("pomodoro:finish", { id: finishedId });
    }

    // Verificar fin de ciclo
    if (await pomodoroService.checkIsCurrentCycleEnd()) {
      await pomodoroService.finishCurrentCycle();
    }

    // Crear siguiente (generalmente solo el Main Handler hace esto automáticamente)
    if (withNext) {
      const nextPomodoro = await pomodoroService.createNextPomodoro({
        user_id: currPomodoro.value.user_id,
      });

      const selectedTags = currPomodoro.value?.tags || [];
      currPomodoro.value = nextPomodoro;
      if (keepTags.value && selectedTags) {
        for (const tag of selectedTags) {
          await handleAddTag(tag.id);
        }
      }

      broadcastEvent("pomodoro:next", { id: nextPomodoro.id });
      timeController.setClockInSeconds(nextPomodoro.expected_duration || 1500);
    }

    await handleListPomodoros();
  }

  async function handleAddTag(tagId: number) {
    try {
      if (!currPomodoro.value) return;
      await pomodoroService.addTagToPomodoro(
        currPomodoro.value.id,
        tagId,
        currPomodoro.value.user_id
      );
      const fresh = await pomodoroService.getOne(currPomodoro.value.id);
      if (fresh) currPomodoro.value = fresh;
    } catch (e) {
      console.log(e);
    }
  }

  async function handleRemoveTag(tagId: number) {
    if (!currPomodoro.value) return;
    await pomodoroService.removeTagFromPomodoro(currPomodoro.value.id, tagId);
    const fresh = await pomodoroService.getOne(currPomodoro.value.id);
    if (fresh) currPomodoro.value = fresh;
  }

  async function handleResetPomodoro() {
    if (
      !confirm(
        "Are you sure you want to reset the pomodoro? this will finish the current cycle."
      )
    ) {
      return;
    }

    timeController.clearTimer();
    await handleFinishPomodoro();
    await pomodoroService.finishCurrentCycle();
    timeController.setClockInSeconds(
      PomodoroDurationInSecondsByDefaultCycleConfiguration[TagIdByType.FOCUS]
    );
    localStorage.removeItem("currPomodoro.value");
    currPomodoro.value = null;
  }

  async function handleSkipPomodoro() {
    if (!currPomodoro.value) return;

    try {
      await handleFinishPomodoro({ withNext: true, broadcast: true });
    } catch (error) {
      console.error(error);
      toast.addErrorToast({
        title: "Error skipping",
        description: (error as any)?.message,
      });
    }
  }

  async function handleSyncPomodoro() {
    if (!currPomodoro.value) return;

    try {
      const result = await pomodoroService.getOne(currPomodoro.value.id);

      if (
        result &&
        result.state === "current" &&
        currPomodoro.value.id === result.id &&
        currPomodoro.value.state !== "current"
      ) {
        handleStartTimer();
      }

      if (
        result &&
        currPomodoro.value.id === result.id &&
        result.state === "paused" &&
        currPomodoro.value.state !== "paused"
      ) {
        handlePausePomodoro();
      }

      currPomodoro.value = result;
    } catch (error) {
      console.error(error);
      toast.addErrorToast({
        title: "Error syncing",
        description: (error as any).message,
      });
    }
  }

  async function handleListPomodoros() {
    try {
      loadingPomodoros.value = true;
      const result = await pomodoroService.listToday();
      pomodorosListToday.value = result;
      return result;
    } catch (error) {
      console.error(error);
      return null;
    } finally {
      loadingPomodoros.value = false;
    }
  }

  async function handleSelectPomodoro(
    user_id: string,
    type: "focus" | "break" | "long-break"
  ) {
    const result = await pomodoroService.startPomodoro({
      user_id,
      type,
    });
    const selectedTags = currPomodoro.value?.tags || [];
    currPomodoro.value = result;
    if (keepTags.value) {
      for (const tag of selectedTags) {
        await handleAddTag(tag.id);
      }
    }
    await handleListPomodoros();
  }

  async function getTaskIdsForCurrentPomodoro() {
    if (!currPomodoro.value) return [];
    return await pomodoroService.getTaskIdsFromPomodoro(currPomodoro.value.id);
  }

  async function addTaskToCurrentPomodoro(taskId: string) {
    if (!currPomodoro.value) return;
    return await pomodoroService.addTaskToPomodoro(
      currPomodoro.value.id,
      taskId,
      currPomodoro.value.user_id
    );
  }

  async function removeTaskFromCurrentPomodoro(taskId: string) {
    if (!currPomodoro.value) return;
    return await pomodoroService.removeTaskFromPomodoro(
      currPomodoro.value.id,
      taskId
    );
  }

  //#endregion

  return {
    timeController,
    handleStartPomodoro,
    handlePausePomodoro,
    handleFinishPomodoro,
    getCurrentPomodoro,
    handleResetPomodoro,
    handleSkipPomodoro,
    handleSyncPomodoro,
    handleListPomodoros,
    handleAddTag,
    handleRemoveTag,
    handleSelectPomodoro,
    isMainHandler,
    currPomodoro,
    pomodorosListToday,
    loadingPomodoros,
    getTaskIdsForCurrentPomodoro,
    addTaskToCurrentPomodoro,
    removeTaskFromCurrentPomodoro,
  };
});
