import { useMachine } from "@xstate/vue";
import { useNotificationController } from "../system/use-notification-controller";
import {
  PomodoroDurationInSecondsByDefaultCycleConfiguration,
  TagIdByType,
  buildDurationMap,
  DEFAULT_TIME_INTERVAL_CONFIGS,
} from "~/utils/pomodoro-domain";
import { useBroadcastPomodoro } from "./use-broadcast-pomodoro";
import type { TPomodoro } from "../types";
import { createPomodoroMachine } from "./pomodoro.machine";

export const usePomodoroController = defineStore("pomodoro", () => {
  //#region DEPENDENCIES
  const pomodoroService = usePomodoroService();
  const timeController = useTimer();
  const notificationController = useNotificationController();
  const keepTags = useKeepSelectedTags();
  const toast = useSuccessErrorToast();
  const { profile } = useProfileController();
  //#endregion

  //#region STATE
  const pomodorosListToday = ref<TPomodoro[]>([]);
  const loadingPomodoros = ref<boolean>(false);
  //#endregion

  //#region HELPER FUNCTIONS
  async function handleListPomodoros() {
    try {
      loadingPomodoros.value = true;
      pomodorosListToday.value = await pomodoroService.listToday();
    } catch (e) {
      console.error(e);
    } finally {
      loadingPomodoros.value = false;
    }
  }
  //#endregion

  //#region BROADCAST & REALTIME
  const broadcastPomodoroController = useBroadcastPomodoro({
    onPlay: (payload) => {
      // Only if ID matches or we are idle?
      if (
        snapshot.value.context.pomodoro?.id === payload.payload.id ||
        !snapshot.value.context.pomodoro
      ) {
        send({ type: "BROADCAST.PLAY", payload: payload.payload });
      } else {
        send({ type: "INIT" });
      }
    },
    onPause: (payload) => {
      if (snapshot.value.context.pomodoro?.id === payload.payload.id) {
        send({ type: "BROADCAST.PAUSE", payload: payload.payload });
      } else {
        send({ type: "INIT" });
      }
    },
    onFinish: (payload) => {
      // If we are handling the same pomodoro
      if (snapshot.value.context.pomodoro?.id === payload.payload.id) {
        send({ type: "BROADCAST.FINISH", payload: payload.payload });
      } else {
        send({ type: "INIT" });
      }
    },
    onSkip: (payload) => {
      if (snapshot.value.context.pomodoro?.id === payload.payload.id) {
        send({ type: "BROADCAST.FINISH", payload: payload.payload }); // We reuse FINISH logic for skip in the machine redirecting to idle
      } else {
        send({ type: "INIT" });
      }
    },
    onNext: () => {
      send({ type: "INIT" }); // Just re-fetch
    },
  });
  //#endregion

  //#region XSTATE MACHINE
  const pomodoroMachine = createPomodoroMachine({
    pomodoroService,
    timeController,
    notificationController,
    broadcastPomodoroController,
    keepTags,
    handleListPomodoros,
    toast,
  });

  const { snapshot, send } = useMachine(pomodoroMachine);

  // Initialize immediately
  send({ type: "INIT" });
  handleListPomodoros();
  //#endregion

  //#region EXPOSED FUNCTIONS (ACTIONS)
  async function handleStartPomodoro(
    user_id: string,
    type?: string,
    state?: "current" | "paused",
  ) {
    if (snapshot.value.context.pomodoro) {
      send({ type: "RESUME" });
    } else {
      send({ type: "START", inputs: { user_id, type, state } });
    }
  }

  async function handlePausePomodoro() {
    send({ type: "PAUSE" });
  }

  async function handleFinishPomodoro({
    withNext = false,
    broadcast = true,
  } = {}) {
    send({ type: "FINISH", withNext, broadcast });
  }

  async function handleResetPomodoro() {
    if (
      !confirm(
        "Are you sure you want to reset the pomodoro? this will finish the current cycle.",
      )
    )
      return;

    timeController.clearTimer();
    if (snapshot.value.context.pomodoro) {
      await pomodoroService.finishCurrentPomodoro({
        timelapse: snapshot.value.context.pomodoro.timelapse,
      });
    }
    await pomodoroService.finishCurrentCycle();

    const configs =
      (profile.value?.settings as any)?.time_interval_configs ??
      DEFAULT_TIME_INTERVAL_CONFIGS;
    timeController.setClockInSeconds(
      buildDurationMap(configs)[TagIdByType.FOCUS],
    );
    send({ type: "RESET" });
    localStorage.removeItem("currPomodoro.value");
  }

  async function handleSkipPomodoro() {
    send({ type: "SKIP", withNext: true });
  }

  // Tags
  async function handleAddTag(tagId: number) {
    if (!snapshot.value.context.pomodoro) return;
    await pomodoroService.addTagToPomodoro(
      snapshot.value.context.pomodoro.id,
      tagId,
      snapshot.value.context.pomodoro.user_id,
    );
    const fresh = await pomodoroService.getOne(
      snapshot.value.context.pomodoro.id,
    );
    send({ type: "TAGS.UPDATE", pomodoro: fresh });
  }

  async function handleRemoveTag(tagId: number) {
    if (!snapshot.value.context.pomodoro) return;
    await pomodoroService.removeTagFromPomodoro(
      snapshot.value.context.pomodoro.id,
      tagId,
    );
    const fresh = await pomodoroService.getOne(
      snapshot.value.context.pomodoro.id,
    );
    send({ type: "TAGS.UPDATE", pomodoro: fresh });
  }

  // Select/Tasks
  async function handleSelectPomodoro(user_id: string, type: PomodoroType) {
    send({ type: "START", inputs: { user_id, type, state: "current" } });
  }

  // Sync
  async function handleSyncPomodoro() {
    const currentId = snapshot.value.context.pomodoro?.id;
    if (!currentId) return;
    try {
      const remote = await pomodoroService.getOne(currentId);
      if (remote) send({ type: "SYNC", pomodoro: remote });
    } catch (e) {
      console.error(e);
    }
  }

  // Watch for persistence
  watch(
    () => snapshot.value.context.pomodoro,
    (newVal) => {
      if (newVal) {
        localStorage.setItem("currPomodoro.value", JSON.stringify(newVal));
      } else {
        localStorage.removeItem("currPomodoro.value");
      }
    },
    { deep: true },
  );

  //#endregion
  return {
    timeController,
    currPomodoro: computed(() => snapshot.value.context.pomodoro),
    pomodorosListToday,
    loadingPomodoros,
    getCurrentPomodoro: () => send({ type: "INIT" }),
    handleStartPomodoro,
    handlePausePomodoro,
    handleFinishPomodoro,
    handleResetPomodoro,
    handleSkipPomodoro,
    handleSyncPomodoro,
    handleListPomodoros,
    handleSelectPomodoro,
    handleAddTag,
    handleRemoveTag,
    getTaskIdsForCurrentPomodoro: async () => {
      if (!snapshot.value.context.pomodoro) return [];
      return await pomodoroService.getTaskIdsFromPomodoro(
        snapshot.value.context.pomodoro.id,
      );
    },
    addTaskToCurrentPomodoro: async (taskId: string) => {
      if (!snapshot.value.context.pomodoro) return;
      return await pomodoroService.addTaskToPomodoro(
        snapshot.value.context.pomodoro.id,
        taskId,
        snapshot.value.context.pomodoro.user_id,
      );
    },
    removeTaskFromCurrentPomodoro: async (taskId: string) => {
      if (!snapshot.value.context.pomodoro) return;
      return await pomodoroService.removeTaskFromPomodoro(
        snapshot.value.context.pomodoro.id,
        taskId,
      );
    },
  };
});
