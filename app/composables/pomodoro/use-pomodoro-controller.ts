import { usePomodoroStore, usePomodoroStoreRefs } from "~/stores/pomodoro";
import { useNotificationController } from "../system/use-notification-controller";
import type {
  Pomodoro,
  PomodoroCycle,
  TimelineEvent,
  TPomodoro,
} from "~/types/Pomodoro";
import {
  hasCycleFinished,
  calculateTimelineFromNow,
  calculatePomodoroTimelapse,
  PomodoroType,
} from "~/utils/pomodoro-domain";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * TODO:
 * _ hacer global datos de configuracion como el tiempo de duracion del pomodoro
 */
export const usePomodoroController = () => {
  //#region VUE semantic context
  const supabase = useSupabaseClient();

  const selectedTags = useSelectedTags();
  const keepTags = useKeepSelectedTags();

  const { currPomodoro, pomodorosListToday, loadingPomodoros } =
    usePomodoroStoreRefs();

  const pomodoroService = usePomodoroService();

  const timeController = useTimer();

  const toast = useSuccessErrorToast();
  const notificationController = useNotificationController();

  watch(currPomodoro, () => {
    localStorage.setItem("currPomodoro", JSON.stringify(currPomodoro.value));
    handleListPomodoros();
  });

  const recalculateTimelapse = (pomodoro: TPomodoro) => {
    if (pomodoro.id) {
      pomodoro.timelapse = calculatePomodoroTimelapse(
        pomodoro.started_at || "",
        pomodoro.toggle_timeline as Array<{
          at: string;
          type: "play" | "pause";
        }>
      );
    }
  };
  const broadcastPomodoro = useBroadcastPomodoroController({
    onPlay: (payload: any) => {
      console.log("pomodoro:play", payload);
      if (currPomodoro.value?.id === payload.payload.id) {
        currPomodoro.value!.toggle_timeline = payload.payload.toggle_timeline;
        currPomodoro.value!.state = "current";
        // Recalculate timelapse with new timeline
        recalculateTimelapse(currPomodoro.value!);
        handleStartTimer();
      }
    },
    onPause: (payload: any) => {
      console.log("pomodoro:pause", payload);
      if (currPomodoro.value?.id === payload.payload.id) {
        currPomodoro.value!.toggle_timeline = payload.payload.toggle_timeline;
        currPomodoro.value!.state = "paused";
        recalculateTimelapse(currPomodoro.value!);
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
    onNext: (payload: any) => {
      console.log("pomodoro:next", payload);
      getCurrentPomodoro();
    },
  });

  onMounted(() => {
    getCurrentPomodoro();
    handleListPomodoros();
    notificationController.requestPermission();

    // code smell
    window.onbeforeunload = async () => {
      if (import.meta.client && currPomodoro.value?.state !== "finished") {
        localStorage.setItem(
          "currPomodoro",
          JSON.stringify(currPomodoro.value)
        );
        if (broadcastPomodoro.channel.value) {
          await broadcastPomodoro.channel.value.unsubscribe();
          supabase.removeChannel(broadcastPomodoro.channel.value);
        }
      }
    };
  });
  onUnmounted(() => {
    timeController.clearTimer();
    window.onbeforeunload = null;
    if (broadcastPomodoro.channel.value) {
      supabase.removeChannel(broadcastPomodoro.channel.value);
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
    if (!currPomodoro.value) return;

    const safeCurrentPomodoro = currPomodoro.value as TPomodoro;

    timeController.startTimer({
      onTick: (remainingSeconds) => {
        const pomodoro = currPomodoro.value;
        if (!pomodoro) return;

        // pomodoro.timelapse = calculatePomodoroTimelapse(
        //   pomodoro.started_at,
        //   pomodoro.toggle_timeline as Array<{
        //     at: string;
        //     type: "play" | "pause";
        //   }>
        // );

        if (pomodoro.timelapse % 10 === 0) {
          // handleSyncPomodoro();
        }
      },
      onFinish: () => {
        // Trigger finish logic locally
        handleFinishPomodoro({
          withNext: broadcastPomodoro.isMainHandler.value,
        });
        // Notify others
        broadcastPomodoro.broadcastEvent("pomodoro:finish", {
          id: safeCurrentPomodoro.id,
        });

        notificationController.notify("Pomodoro finished!", {
          body: "Time to take a break!",
          icon: "/favicon.ico",
          silent: false,
        });
      },
      expected_end: computeExpectedEnd(safeCurrentPomodoro),
      clockStartInMinute:
        (((safeCurrentPomodoro as any).expected_duration || 25 * 60) -
          calculatePomodoroTimelapse(
            safeCurrentPomodoro.started_at,
            safeCurrentPomodoro.toggle_timeline as Array<{
              at: string;
              type: "play" | "pause";
            }>
          )) /
        60,
    });
  }

  async function getCurrentPomodoro() {
    const upstreamPomodoro = await pomodoroService.getCurrentPomodoro();

    if (upstreamPomodoro && upstreamPomodoro.state !== "finished") {
      currPomodoro.value = upstreamPomodoro;
      localStorage.setItem("currPomodoro", JSON.stringify(upstreamPomodoro));

      const timelapse = calculatePomodoroTimelapse(
        upstreamPomodoro.started_at,
        upstreamPomodoro.toggle_timeline as Array<{
          at: string;
          type: "play" | "pause";
        }>
      );
      const remainingSeconds = upstreamPomodoro.expected_duration - timelapse;

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
    type?: "focus" | "break" | "long-break",
    state?: "current" | "paused"
  ) {
    if (!currPomodoro.value?.id) {
      const result = await pomodoroService.startPomodoro({
        user_id,
        type,
        state,
      });
      currPomodoro.value = result;

      await handleListPomodoros();

      // New pomodoro started, we might want to broadcast a 'start' too if useful,
      // but 'play' below handles the ticking state.
    } else {
      const result = await pomodoroService.registToggleTimelinePomodoro(
        currPomodoro.value.id,
        "play"
      );

      currPomodoro.value = result;
    }

    handleStartTimer();

    // Broadcast Play
    if (currPomodoro.value) {
      broadcastPomodoro.broadcastEvent("pomodoro:play", {
        id: currPomodoro.value.id,
        toggle_timeline: currPomodoro.value.toggle_timeline,
        started_at: currPomodoro.value.started_at,
      });
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
    await handleListPomodoros();

    currPomodoro.value = result;
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

    const toggleTimeline: TimelineEvent[] = [
      ...currToggleTimeline,
      { at: new Date().toISOString(), type: "pause" },
    ];

    const result = await pomodoroService.update(currPomodoro.value.id, {
      // timelapse: currPomodoro.value.timelapse,
      toggle_timeline: toggleTimeline,
      state: "paused",
      expected_end: computeExpectedEnd(currPomodoro.value),
    });
    currPomodoro.value = result;
    timeController.clearTimer();

    // Broadcast Pause
    broadcastPomodoro.broadcastEvent("pomodoro:pause", {
      id: currPomodoro.value.id,
      toggle_timeline: currPomodoro.value.toggle_timeline,
    });
  }

  type THandleFinishPomodoroParams = {
    clockInSeconds?: number;
    withNext?: boolean;
  };
  async function handleFinishPomodoro({
    clockInSeconds,
    withNext = false,
  }: THandleFinishPomodoroParams = {}) {
    if (!currPomodoro.value || currPomodoro.value.state == "finished") {
      return;
    }

    currPomodoro.value.state = "finished";

    const result = await pomodoroService.finishCurrentPomodoro({
      timelapse: currPomodoro.value.timelapse,
    });

    const isCurrentCycleEnd = await pomodoroService.checkIsCurrentCycleEnd();
    if (isCurrentCycleEnd) {
      await pomodoroService.finishCurrentCycle();
    }

    let _clockInSeconds = clockInSeconds || 0;

    if (withNext) {
      const nextPomodoro = await pomodoroService.createNextPomodoro({
        user_id: currPomodoro.value.user_id,
      });

      const tagsIds = selectedTags.value.map((tag) => tag.id);

      _clockInSeconds = nextPomodoro?.expected_duration || 0;
      currPomodoro.value = nextPomodoro;
      localStorage.setItem("currPomodoro", JSON.stringify(nextPomodoro));
      broadcastPomodoro.broadcastEvent("pomodoro:next", {
        id: currPomodoro.value.id,
      });

      if (keepTags.value) {
        tagsIds.forEach((tagId) => {
          handleAddTag(tagId);
        });
      }
    }

    timeController.setClockInSeconds(_clockInSeconds);
    timeController.clearTimer();
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
    localStorage.removeItem("currPomodoro");
    currPomodoro.value = null;
  }

  async function handleSkipPomodoro(tagType?: PomodoroType) {
    if (!currPomodoro.value) {
      return;
    }

    try {
      await handleFinishPomodoro({ withNext: true });
      // Broadcast Finish
      broadcastPomodoro.broadcastEvent("pomodoro:finish", {
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
      const result = await pomodoroService.update(currPomodoro.value.id, {
        timelapse: currPomodoro.value.timelapse,
      });

      if (result && result.state === "current") {
        handleStartTimer();
      } else {
        timeController.clearTimer();
      }

      currPomodoro.value = result;
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
      const result = await pomodoroService.listToday();

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
    handleAddTag,
    handleRemoveTag,
    handleSelectPomodoro,
    currPomodoro,
    timeController,
  };
};

//#region Broadcast Pomodoro

type TBroadcastPomodoroHandler = {
  onPlay: (payload: any) => void;
  onPause: (payload: any) => void;
  onFinish: (payload: any) => void;
  onNext: (payload: any) => void;
};
function useBroadcastPomodoroController({
  onPlay,
  onPause,
  onFinish,
  onNext,
}: TBroadcastPomodoroHandler) {
  const channel = useState<RealtimeChannel | undefined>(
    "pomodoro_broadcast_channel"
  );
  const deviceId = useState<string>("pomodoro_device_id", () =>
    globalThis.crypto.randomUUID()
  );
  const isMainHandler = useState<boolean>(
    "pomodoro_is_main_handler",
    () => false
  );

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
      console.log("Channel initialized");

      initSuscriptions();
    }
  };

  const initSuscriptions = () => {
    if (!channel.value) {
      return console.log("Channel not initialized");
    }

    channel.value
      .on("broadcast", { event: "pomodoro:play" }, onPlay)
      .on("broadcast", { event: "pomodoro:pause" }, onPause)
      .on("broadcast", { event: "pomodoro:finish" }, onFinish)
      .on("broadcast", { event: "pomodoro:next" }, onNext)
      .on("presence", { event: "sync" }, () => {
        const state = channel.value?.presenceState();
        console.log("sync", state);

        if (!state) return;

        const presences: any[] = [];
        Object.values(state).forEach((p: any) => {
          presences.push(...p);
        });

        // Sort by online_at ASC (oldest first)
        presences.sort(
          (a, b) =>
            new Date(a.online_at).getTime() - new Date(b.online_at).getTime()
        );

        if (presences.length > 0) {
          const main = presences[0];
          // Check if I am the main
          isMainHandler.value = main.deviceId === deviceId.value;
          console.log("Sync presence: am I main?", isMainHandler.value);
        }
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        console.log("join", key, newPresences);
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        console.log("leave", key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.value?.track({
            deviceId: deviceId.value,
            online_at: new Date().toISOString(),
          });
        }
      });

    console.log("Suscriptions initialized");
  };

  watch(profile, () => {
    initChannel();
  });

  return {
    initChannel,
    initSuscriptions,
    broadcastEvent,
    channel,
    isMainHandler,
    deviceId,
  };
}
//#endregion
