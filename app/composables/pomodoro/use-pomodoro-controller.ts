import { usePomodoroStore, usePomodoroStoreRefs } from "~/stores/pomodoro";
import { useNotificationController } from "../system/use-notification-controller";
import type { Pomodoro, PomodoroCycle, TPomodoro } from "~/types/Pomodoro";
import {
  hasCycleFinished,
  calculateTimelineFromNow,
  calculatePomodoroTimelapse,
  TagType,
} from "~/utils/pomodoro-domain";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * TODO:
 * _ hacer global datos de configuracion como el tiempo de duracion del pomodoro
 */
export const usePomodoroController = () => {
  //#region VUE semantic context
  const channel = ref<RealtimeChannel>();
  const supabase = useSupabaseClient();

  const { profile } = useProfileController();

  const { currPomodoro, pomodorosListToday, loadingPomodoros } =
    usePomodoroStoreRefs();

  const pomodoroRepository = usePomodoroRepository();
  const pomodoroService = usePomodoroService();

  const timeController = useTimer();

  const toast = useSuccessErrorToast();
  const notificationController = useNotificationController();

  watch(currPomodoro, () => {
    localStorage.setItem("currPomodoro", JSON.stringify(currPomodoro.value));
  });

  const broadcastController = useBroadcastController();
  broadcastController.initSuscriptions({
    onPlay: (payload: any) => {
      console.log("pomodoro:play", payload);
      if (currPomodoro.value?.id === payload.payload.id) {
        currPomodoro.value!.toggle_timeline = payload.payload.toggle_timeline;
        currPomodoro.value!.state = "current";
        // Recalculate timelapse with new timeline
        currPomodoro.value!.timelapse = calculatePomodoroTimelapse(
          currPomodoro.value!.started_at,
          currPomodoro.value!.toggle_timeline as Array<{
            at: string;
            type: "play" | "pause";
          }>
        );
        handleStartTimer();
      }
    },
    onPause: (payload: any) => {
      console.log("pomodoro:pause", payload);
      if (currPomodoro.value?.id === payload.payload.id) {
        currPomodoro.value!.toggle_timeline = payload.payload.toggle_timeline;
        currPomodoro.value!.state = "paused";
        currPomodoro.value!.timelapse = calculatePomodoroTimelapse(
          currPomodoro.value!.started_at,
          currPomodoro.value!.toggle_timeline as Array<{
            at: string;
            type: "play" | "pause";
          }>
        );
        timeController.clearTimer();
        timeController.setClockInSeconds(
          ((currPomodoro.value as any).expected_duration || 25 * 60) -
            currPomodoro.value!.timelapse
        );
      }
    },
    onFinish: (payload: any) => {
      console.log("pomodoro:finish", payload);
      if (currPomodoro.value?.id === payload.payload.id) {
        handleFinishPomodoro({ withNext: false });
      }
    },
  });

  onMounted(() => {
    getCurrentPomodoro();

    handleListPomodoros();
    notificationController.requestPermission();

    window.onbeforeunload = async () => {
      if (import.meta.client) {
        localStorage.setItem(
          "currPomodoro",
          JSON.stringify(currPomodoro.value)
        );
        if (channel.value) {
          await channel.value.unsubscribe();
        }
      }
    };
  });
  onUnmounted(() => {
    timeController.clearTimer();
    window.onbeforeunload = null;
    if (channel.value) {
      supabase.removeChannel(channel.value);
    }
  });

  defineShortcuts({
    "t-n": () => {
      notificationController.notify("Pomodoro finished!", {
        body: "Time to take a break!",
        icon: "/favicon.ico",
        requireInteraction: false, // Keeps notification until user dismisses it
        // silent: false,
      });
    },
  });

  //#endregion

  //#region UI interaction and state handlers

  function computeExpectedEnd(pomodoro: TPomodoro) {
    const duration = (pomodoro as any).expected_duration || 25 * 60;
    const timelapse = calculatePomodoroTimelapse(
      pomodoro.started_at,
      pomodoro.toggle_timeline
    );
    const remaining = duration - timelapse;
    return new Date(Date.now() + remaining * 1000).toISOString();
  }

  function handleStartTimer() {
    timeController.startTimer({
      onTick: (remainingSeconds) => {
        const pomodoro = currPomodoro.value;
        if (!pomodoro) return;

        pomodoro.timelapse = calculatePomodoroTimelapse(
          pomodoro.started_at,
          pomodoro.toggle_timeline as Array<{
            at: string;
            type: "play" | "pause";
          }>
        );

        const now = Date.now();
        const _remainingSeconds = remainingSeconds;
        const _elapse = pomodoro.timelapse;

        // console.log( ... )

        if (pomodoro.timelapse % 10 === 0) {
          handleSyncPomodoro();
        }
      },
      onFinish: () => {
        // Trigger finish logic locally
        handleFinishPomodoro();

        // Notify others
        if (currPomodoro.value) {
          broadcastController.broadcastEvent("pomodoro:finish", {
            id: currPomodoro.value.id,
          });
        }

        notificationController.notify("Pomodoro finished!", {
          body: "Time to take a break!",
          icon: "/favicon.ico",
          silent: false,
        });
      },
      expected_end: computeExpectedEnd(
        currPomodoro.value as unknown as TPomodoro
      ),
      clockStartInMinute:
        (((currPomodoro.value as any).expected_duration || 25 * 60) -
          calculatePomodoroTimelapse(
            currPomodoro.value!.started_at,
            currPomodoro.value!.toggle_timeline as Array<{
              at: string;
              type: "play" | "pause";
            }>
          )) /
        60,
    });
  }

  async function getCurrentPomodoro() {
    const upstreamPomodoro = await pomodoroRepository.getCurrentPomodoro();

    if (upstreamPomodoro && upstreamPomodoro.state !== "finished") {
      currPomodoro.value = upstreamPomodoro as unknown as TPomodoro;
      localStorage.setItem("currPomodoro", JSON.stringify(upstreamPomodoro));

      const timelapse = calculatePomodoroTimelapse(
        upstreamPomodoro.started_at,
        upstreamPomodoro.toggle_timeline as Array<{
          at: string;
          type: "play" | "pause";
        }>
      );
      const remainingSeconds =
        ((upstreamPomodoro as any).expected_duration || 25 * 60) - timelapse;

      if (remainingSeconds <= 0) {
        return handleFinishPomodoro();
      }

      timeController.setClockInSeconds(remainingSeconds);
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

      currPomodoro.value = result as unknown as TPomodoro;

      // New pomodoro started, we might want to broadcast a 'start' too if useful,
      // but 'play' below handles the ticking state.
    } else {
      const result = await pomodoroService.registToggleTimelinePomodoro(
        currPomodoro.value.id,
        "play"
      );

      currPomodoro.value = result as unknown as TPomodoro;
    }

    handleStartTimer();

    // Broadcast Play
    if (currPomodoro.value) {
      broadcastController.broadcastEvent("pomodoro:play", {
        id: currPomodoro.value.id,
        toggle_timeline: currPomodoro.value.toggle_timeline,
        started_at: currPomodoro.value.started_at,
      });
    }
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

    const toggleTimeline = [
      ...currToggleTimeline,
      { at: new Date().toISOString(), type: "pause" },
    ];

    const result = await pomodoroRepository.update(currPomodoro.value.id, {
      timelapse: currPomodoro.value.timelapse,
      toggle_timeline: toggleTimeline,
      state: "paused",
      expected_end: computeExpectedEnd(
        currPomodoro.value as unknown as TPomodoro
      ),
    });
    currPomodoro.value = result as unknown as TPomodoro;
    timeController.clearTimer();

    // Broadcast Pause
    broadcastController.broadcastEvent("pomodoro:pause", {
      id: currPomodoro.value.id,
      toggle_timeline: currPomodoro.value.toggle_timeline,
    });
  }
  async function handleFinishPomodoro({
    clockInSeconds,
    withNext = false,
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

      _clockInSeconds = nextPomodoro?.expected_duration;
      currPomodoro.value = nextPomodoro as unknown as TPomodoro;
      localStorage.setItem("currPomodoro", JSON.stringify(nextPomodoro));
    }

    timeController.setClockInSeconds(_clockInSeconds || 0);
    timeController.clearTimer();
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
    localStorage.removeItem("currPomodoro");
    currPomodoro.value = null;
  }

  async function handleSkipPomodoro(tagType?: TagType) {
    if (!currPomodoro.value) {
      return;
    }

    try {
      await handleFinishPomodoro();
      // Broadcast Finish
      broadcastController.broadcastEvent("pomodoro:finish", {
        id: currPomodoro.value!.id,
      });
    } catch (error) {
      console.error(error);

      toast.addErrorToast({
        title: (error as any)?.type,
        description: (error as any)?.message,
      });
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

      if (result.state === "current") {
        handleStartTimer();
      } else {
        timeController.clearTimer();
      }

      currPomodoro.value = result as unknown as TPomodoro;
    } catch (error) {
      console.error(error);

      toast.addErrorToast({
        title: (error as any).type,
        description: (error as any).message,
      });
    }
  }

  async function handleListPomodoros() {
    try {
      loadingPomodoros.value = true;
      const result = await pomodoroRepository.listToday();

      pomodorosListToday.value = result as unknown as TPomodoro[];
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
    timeController,
  };
};

function useBroadcastController() {
  const channel = ref<RealtimeChannel>();
  const supabase = useSupabaseClient();

  const { profile } = useProfileController();

  const broadcastEvent = async (event: string, payload: any) => {
    if (channel.value) {
      await channel.value.send({
        type: "broadcast",
        event,
        payload,
      });
    }
  };

  const initChannel = () => {
    if (profile.value?.id && !channel.value) {
      channel.value = supabase.channel(`pomodoro_sync:${profile.value.id}`, {
        config: {
          private: true,
          broadcast: { self: false },
        },
      });
    }
  };

  const initSuscriptions = ({
    onPlay,
    onPause,
    onFinish,
  }: {
    onPlay: (payload: any) => void;
    onPause: (payload: any) => void;
    onFinish: (payload: any) => void;
  }) => {
    if (!channel.value) {
      return;
    }

    channel.value
      .on("broadcast", { event: "pomodoro:play" }, onPlay)
      .on("broadcast", { event: "pomodoro:pause" }, onPause)
      .on("broadcast", { event: "pomodoro:finish" }, onFinish)
      .subscribe();
  };

  watch(profile, () => {
    initChannel();
  });

  return {
    initChannel,
    initSuscriptions,
    broadcastEvent,
    channel,
  };
}
