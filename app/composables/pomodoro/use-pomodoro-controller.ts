import { usePomodoroStore } from "~/stores/pomodoro";
import { useNotificationController } from "../system/use-notification-controller";
import type { Pomodoro, PomodoroCycle } from "~/types/Pomodoro";
import {
  hasCycleFinished,
  calculateTimelineFromNow,
  TagType,
} from "~/utils/pomodoro-domain";

/**
 * TODO:
 * _ hacer global datos de configuracion como el tiempo de duracion del pomodoro
 */
export const usePomodoroController = () => {
  //#region VUE semantic context
  const pomodoroStore = usePomodoroStore();
  const { currPomodoro, pomodorosListToday, loadingPomodoros } =
    storeToRefs(pomodoroStore);

  const pomodoroRepository = usePomodoroRepository();
  const { timer, startTimer, clockInMinutes, setClockInSeconds } = useTimer();

  const pomodoroService = usePomodoroService();
  const toast = useSuccessErrorToast();
  const { notify, requestPermission } = useNotificationController();
  watch(currPomodoro, () => {
    localStorage.setItem("currPomodoro", JSON.stringify(currPomodoro.value));
  });

  onMounted(() => {
    getCurrentPomodoro();

    handleListPomodoros();
    requestPermission();
    // TODO: mejorar logica para pausar pomodoro al cerrar la pestaña. se puede usar un websocket para mantener la syncronizacion o pushing en intervalos de tiempo
    window.onbeforeunload = () => {
      if (import.meta.client) {
        localStorage.setItem(
          "currPomodoro",
          JSON.stringify(currPomodoro.value)
        );
        // if (currPomodoro.value?.state === "current") {
        //   await handlePausePomodoro();
        // }
      }
    };
  });
  onUnmounted(() => {
    if (timer.value) clearInterval(timer.value);
    window.onbeforeunload = null;
  });

  //#endregion

  //#region UI interaction and state management

  function handleStartTimer() {
    startTimer({
      onTick: () => {
        if (!currPomodoro.value) return;
        currPomodoro.value.timelapse += 1;

        if (currPomodoro.value.timelapse % 10 === 0) {
          handleSyncPomodoro();
        }
      },
      onFinish: () => {
        handleFinishPomodoro();
        notify("Pomodoro finished!", {
          body: "Time to take a break!",
          icon: "/favicon.ico",
          requireInteraction: true, // Keeps notification until user dismisses it
          // silent: false,
        });
      },
      syncAccSeconds: currPomodoro.value?.timelapse || 0,
      clockStartInMinute: (currPomodoro.value?.expected_duration || 0) / 60,
    });
  }

  defineShortcuts({
    "t-n": () => {
      notify("Pomodoro finished!", {
        body: "Time to take a break!",
        icon: "/favicon.ico",
        requireInteraction: true, // Keeps notification until user dismisses it
        // silent: false,
      });
    },
  });

  async function getCurrentPomodoro() {
    const upstreamPomodoro = await pomodoroRepository.getCurrentPomodoro();

    if (upstreamPomodoro && upstreamPomodoro.state !== "finished") {
      currPomodoro.value = upstreamPomodoro;
      localStorage.setItem("currPomodoro", JSON.stringify(upstreamPomodoro));

      const remainingSeconds =
        upstreamPomodoro.timelapse <= upstreamPomodoro.expected_duration
          ? upstreamPomodoro.expected_duration - upstreamPomodoro.timelapse
          : 0;

      if (remainingSeconds <= 0) {
        return handleFinishPomodoro();
      }

      setClockInSeconds(remainingSeconds);
    }

    if (upstreamPomodoro?.state === "current") {
      handleStartTimer();
    }

    if (!upstreamPomodoro) {
      localStorage.removeItem("currPomodoro");
    }
  }
  async function handleStartPomodoro(
    user_id: string,
    type?: "focus" | "break" | "long-break"
  ) {
    if (type || !currPomodoro.value?.id) {
      const result = await pomodoroService.startPomodoro({
        user_id,
        type,
      });
      await handleListPomodoros();

      currPomodoro.value = result;
    } else {
      const result = await pomodoroService.registToggleTimelinePomodoro(
        currPomodoro.value.id,
        "play"
      );
      currPomodoro.value = result;
    }

    handleStartTimer();
  }
  async function handlePausePomodoro() {
    if (!currPomodoro.value) {
      return;
    }
    const currToggleTimeline =
      ((currPomodoro.value as any)?.toggle_timeline as Array<{
        at: string;
        type: "play" | "pause";
      }>) || [];
    const result = await pomodoroRepository.update(currPomodoro.value.id, {
      timelapse: currPomodoro.value.timelapse,
      toggle_timeline: [
        ...currToggleTimeline,
        {
          at: new Date().toISOString(),
          type: "pause",
        },
      ],
      state: "paused",
    });
    currPomodoro.value = result;
    if (timer.value) clearInterval(timer.value);
  }
  async function handleFinishPomodoro({
    clockInSeconds,
    withNext = true,
  }: { clockInSeconds?: number; withNext?: boolean } = {}) {
    if (!currPomodoro.value) {
      return;
    }

    const result = await pomodoroService.finishCurrentPomodoro({
      timelapse: currPomodoro.value.timelapse,
    });

    const isCurrentCycleEnd = await pomodoroService.checkIsCurrentCycleEnd();
    if (isCurrentCycleEnd) {
      await pomodoroService.finishCurrentCycle();
    }

    let _clockInSeconds = clockInSeconds;

    if (withNext) {
      const nextPomodoro = await pomodoroService.createNextPomodoro({
        user_id: currPomodoro.value.user_id,
      });

      _clockInSeconds = nextPomodoro.expected_duration;
      currPomodoro.value = nextPomodoro;
      localStorage.setItem("currPomodoro", JSON.stringify(nextPomodoro));
    }

    setClockInSeconds(_clockInSeconds);
    if (timer.value) clearInterval(timer.value);
  }
  async function handleResetPomodoro() {
    if (
      !confirm(
        "Are you sure you want to reset the pomodoro? this will finish the current cycle."
      )
    ) {
      return;
    }

    if (timer.value) clearInterval(timer.value);
    await handleFinishPomodoro();
    await pomodoroService.finishCurrentCycle();
    setClockInSeconds(
      PomodoroDurationInSecondsByDefaultCycleConfiguration[TagIdByType.FOCUS]
    );
    localStorage.removeItem("currPomodoro");
    currPomodoro.value = null;
  }

  async function handleSkipPomodoro(tagType?: TagType) {
    if (!currPomodoro.value) {
      return;
    }

    try {
      await handleFinishPomodoro();
    } catch (error) {
      console.error(error);

      toast.addErrorToast({ title: error.type, description: error.message });
    }
  }

  async function handleSyncPomodoro() {
    if (!currPomodoro.value) {
      return;
    }

    try {
      const result = await pomodoroRepository.update(currPomodoro.value.id, {
        timelapse: currPomodoro.value.timelapse,
      });
      currPomodoro.value = result;
    } catch (error) {
      console.error(error);

      toast.addErrorToast({ title: error.type, description: error.message });
    }
  }

  async function handleListPomodoros() {
    try {
      loadingPomodoros.value = true;
      const result = await pomodoroRepository.listToday();

      pomodorosListToday.value = result;
      return result;
    } catch (error) {
      console.error(error);
      toast.addErrorToast({
        title: "Error",
        description: (error as Error).message,
      });
      return null;
    } finally {
      loadingPomodoros.value = false;
    }
  }

  //#endregion

  return {
    handleSyncPomodoro,
    handleStartPomodoro,
    handlePausePomodoro,
    handleFinishPomodoro,
    handleResetPomodoro,
    handleSkipPomodoro,
    getCurrentPomodoro,
    handleListPomodoros,
    currPomodoro,
    clockInMinutes,
    timer,
    startTimer,
  };
};
