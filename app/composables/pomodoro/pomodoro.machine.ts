import { setup, assign, fromPromise, fromCallback } from "xstate";
import { calculatePomodoroTimelapse } from "~/utils/pomodoro-domain";
import type { TPomodoro } from "../types";

type MachineEvents =
  | { type: string; output?: any; actorId?: string }
  | TPomodoro
  | { type: "INIT" }
  | {
      type: "START";
      inputs: {
        user_id: string;
        type?: string;
        state?: "current" | "paused";
      };
    }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "FINISH"; withNext?: boolean; broadcast?: boolean }
  | { type: "RESET" }
  | { type: "SKIP"; withNext?: boolean }
  | { type: "SYNC"; pomodoro: TPomodoro }
  | { type: "BROADCAST.PLAY"; payload: any }
  | { type: "BROADCAST.PAUSE"; payload: any }
  | { type: "BROADCAST.FINISH"; payload: any }
  | { type: "BROADCAST.NEXT"; payload: any }
  | { type: "TAGS.UPDATE"; pomodoro: TPomodoro };

export interface PomodoroMachineDeps {
  pomodoroService: ReturnType<typeof usePomodoroService>;
  timeController: ReturnType<typeof useTimer>;
  notificationController: ReturnType<typeof useNotificationController>;
  broadcastPomodoroController: ReturnType<typeof useBroadcastPomodoro>;
  keepTags: Ref<boolean>;
  handleListPomodoros: () => Promise<any>;
  toast: ReturnType<typeof useSuccessErrorToast>;
}

const computeExpectedEnd = (pomodoro: TPomodoro) => {
  const duration = (pomodoro as any).expected_duration || 25 * 60;
  const timelapse = calculatePomodoroTimelapse(
    pomodoro.toggle_timeline,
    duration,
  );
  return new Date(Date.now() + (duration - timelapse) * 1000).toISOString();
};

const updateLocalState = (pomodoro: TPomodoro) => {
  if (!pomodoro.id) return;
  const duration = (pomodoro as any).expected_duration || 25 * 60;
  pomodoro.timelapse = calculatePomodoroTimelapse(
    pomodoro.toggle_timeline,
    duration,
  );
};

export const createPomodoroMachine = (deps: PomodoroMachineDeps) => {
  const {
    pomodoroService,
    timeController,
    notificationController,
    broadcastPomodoroController,
    keepTags,
    handleListPomodoros,
    toast,
  } = deps;

  const _setup = setup({
    types: {
      context: {} as { pomodoro: TPomodoro | null },
      events: {} as MachineEvents,
    },
    actors: {
      fetchCurrent: fromPromise(async () => {
        return await pomodoroService.getCurrentPomodoro();
      }),
      createOrResume: fromPromise(
        async ({
          input,
        }: {
          input: {
            user_id: string;
            type?: string;
            state?: "current" | "paused";
          } | null;
        }) => {
          if (input) {
            return await pomodoroService.startPomodoro({
              user_id: input.user_id,
              type: input.type as any,
              state: input.state,
            });
          }
          throw new Error("Invalid Input");
        },
      ),
      togglePlay: fromPromise(
        async ({
          input,
        }: {
          input: { id: number; type: "play" | "pause" };
        }) => {
          return await pomodoroService.registToggleTimelinePomodoro(
            input.id,
            input.type,
          );
        },
      ),
      startTimerActor: fromCallback(({ sendBack, receive, input }) => {
        const pomodoro = (input as any).pomodoro as TPomodoro;
        if (!pomodoro) return;

        timeController.startTimer({
          expected_end: computeExpectedEnd(pomodoro),
          clockStartInMinute:
            (((pomodoro as any).expected_duration || 1500) -
              pomodoro.timelapse) /
            60,
          onTick: (remaining) => {
            if (remaining % 5 === 0) {
              // Trigger sync check if needed?
            }
          },
          onFinish: () => {
            sendBack({ type: "TIMER.FINISH" });
          },
        });

        return () => {
          timeController.clearTimer();
        };
      }),
      finishPomodoro: fromPromise(
        async ({ input }: { input: { pomodoro: TPomodoro } }) => {
          await pomodoroService.finishCurrentPomodoro({
            timelapse: input.pomodoro.timelapse,
          });
          if (await pomodoroService.checkIsCurrentCycleEnd()) {
            await pomodoroService.finishCurrentCycle();
          }
          return true;
        },
      ),
      skipPomodoro: fromPromise(
        async ({ input }: { input: { pomodoro: TPomodoro } }) => {
          await pomodoroService.skipCurrentPomodoro({
            timelapse: input.pomodoro.timelapse,
          });
          if (await pomodoroService.checkIsCurrentCycleEnd()) {
            await pomodoroService.finishCurrentCycle();
          }
          return true;
        },
      ),
      createNextPomodoro: fromPromise(
        async ({ input }: { input: { user_id: string; tags: any[] } }) => {
          const next = await pomodoroService.createNextPomodoro({
            user_id: input.user_id,
          });
          if (keepTags.value && input.tags.length) {
            for (const tag of input.tags) {
              await pomodoroService.addTagToPomodoro(
                next.id,
                tag.id,
                input.user_id,
              );
            }
          }
          return await pomodoroService.getOne(next.id);
        },
      ),
    },
    actions: {
      assignPomodoro: assign({
        pomodoro: (params: any) => {
          const { context, event } = params;
          const e = event as any;
          const p = e.output || e.pomodoro || e.payload;
          if (p) updateLocalState(p);
          return p;
        },
      }),
      updateTimeOnPause: ({ context }: any) => {
        if (!context.pomodoro) return;
        timeController.clearTimer();
        const remaining =
          ((context.pomodoro as any).expected_duration || 25 * 60) -
          context.pomodoro.timelapse;
        timeController.setClockInSeconds(remaining);
      },
      updateTimeOnNext: ({ context }: any) => {
        if (!context.pomodoro) return;
        timeController.setClockInSeconds(
          (context.pomodoro as any).expected_duration || 1500,
        );
      },
      optimisticPause: assign({
        pomodoro: ({ context }: any) => {
          if (!context.pomodoro) return null;
          const newTimeline = [
            ...(context.pomodoro.toggle_timeline || []),
            { at: new Date().toISOString(), type: "pause" as const },
          ];
          const updated = {
            ...context.pomodoro,
            state: "paused" as const,
            toggle_timeline: newTimeline,
          };
          updateLocalState(updated);
          return updated;
        },
      }),
      optimisticPlay: assign({
        pomodoro: ({ context }: any) => {
          if (!context.pomodoro) return null;
          const newTimeline = [
            ...(context.pomodoro.toggle_timeline || []),
            { at: new Date().toISOString(), type: "play" as const },
          ];
          const updated = {
            ...context.pomodoro,
            state: "current" as const,
            toggle_timeline: newTimeline,
          };
          updateLocalState(updated);
          return updated;
        },
      }),
      broadcastPlay: ({ context }: any) => {
        if (context.pomodoro)
          broadcastPomodoroController.broadcastEvent("pomodoro:play", {
            id: context.pomodoro.id,
            toggle_timeline: context.pomodoro.toggle_timeline,
          });
      },
      broadcastPause: ({ context }: any) => {
        if (context.pomodoro)
          broadcastPomodoroController.broadcastEvent("pomodoro:pause", {
            id: context.pomodoro.id,
            toggle_timeline: context.pomodoro.toggle_timeline,
          });
      },
      broadcastFinish: ({ context }: any) => {
        if (context.pomodoro)
          broadcastPomodoroController.broadcastEvent("pomodoro:finish", {
            id: context.pomodoro.id,
          });
      },
      broadcastSkip: ({ context }: any) => {
        if (context.pomodoro)
          broadcastPomodoroController.broadcastEvent("pomodoro:skip", {
            id: context.pomodoro.id,
          });
      },
      broadcastNext: ({ context }: any) => {
        if (context.pomodoro)
          broadcastPomodoroController.broadcastEvent("pomodoro:next", {
            id: context.pomodoro.id,
          });
      },
      notifyFinish: () => {
        // notificationController.notify("Pomodoro finished!", {
        //   body: "Time to take a break!",
        //   icon: "/favicon.ico",
        //   requireInteraction: true,
        // });
      },
      refreshList: () => handleListPomodoros(),
      handleError: ({ event }: any) => {
        console.error("Pomodoro Machine Error:", event.error);
        toast.addErrorToast({
          title: "Error de Pomodoro",
          description:
            event.error?.message ||
            "Ocurrió un error inesperado en la máquina de estados.",
        });
      },
    },
  });

  const _machine = _setup.createMachine({
    id: "pomodoro",
    context: { pomodoro: null },
    initial: "idle",
    on: {
      INIT: ".fetching",
      SYNC: { actions: "assignPomodoro" },
      "TAGS.UPDATE": { actions: "assignPomodoro" },
    },
    states: {
      idle: {
        entry: assign({ pomodoro: null }),
        on: {
          START: "starting",
        },
      },
      fetching: {
        invoke: {
          src: "fetchCurrent",
          onDone: [
            {
              guard: ({ event }: any) => event.output?.state === "current",
              target: "running",
              actions: "assignPomodoro",
            },
            {
              guard: ({ event }: any) => event.output?.state === "paused",
              target: "paused",
              actions: "assignPomodoro",
            },
            { target: "idle", actions: "assignPomodoro" },
          ],
          onError: {
            target: "idle",
            actions: "handleError",
          },
        },
      },
      starting: {
        invoke: {
          src: "createOrResume",
          input: ({ event }: any) => (event as any).inputs,
          onDone: {
            target: "running",
            actions: ["assignPomodoro", "broadcastPlay", "refreshList"],
          },
          onError: {
            target: "idle",
            actions: "handleError",
          },
        },
      },
      running: {
        entry: "assignPomodoro",
        invoke: {
          src: "startTimerActor",
          input: ({ context }: any) => ({ pomodoro: context.pomodoro }),
          onDone: { target: "finishing" },
        },
        on: {
          PAUSE: { target: "pausing", actions: "optimisticPause" },
          FINISH: "finishing",
          SKIP: "skipping",
          "TIMER.FINISH": "finishing",
          "BROADCAST.PAUSE": {
            target: "paused",
            actions: ["assignPomodoro", "updateTimeOnPause"],
          },
          "BROADCAST.FINISH": { target: "idle", actions: ["refreshList"] },
        },
      },
      pausing: {
        invoke: {
          src: "togglePlay",
          input: ({ context }: any) => ({
            id: context.pomodoro!.id,
            type: "pause",
          }),
          onDone: {
            target: "paused",
            actions: ["assignPomodoro", "broadcastPause"],
          },
          onError: { target: "running", actions: "handleError" },
        },
      },
      paused: {
        entry: "updateTimeOnPause",
        on: {
          RESUME: { target: "resuming", actions: "optimisticPlay" },
          FINISH: "finishing",
          SKIP: "skipping",
          "BROADCAST.PLAY": { target: "running", actions: "assignPomodoro" },
          "BROADCAST.FINISH": { target: "idle", actions: ["refreshList"] },
        },
      },
      resuming: {
        invoke: {
          src: "togglePlay",
          input: ({ context }: any) => ({
            id: context.pomodoro!.id,
            type: "play",
          }),
          onDone: {
            target: "running",
            actions: ["assignPomodoro", "broadcastPlay"],
          },
          onError: { target: "paused", actions: "handleError" },
        },
      },
      finishing: {
        invoke: {
          src: "finishPomodoro",
          input: ({ context }: any) => ({ pomodoro: context.pomodoro! }),
          onDone: [
            {
              guard: ({ event }: any) => {
                return broadcastPomodoroController.isMainHandler.value || false;
              },
              target: "creatingNext",
            },
            {
              target: "idle",
              actions: ["notifyFinish", "broadcastFinish", "refreshList"],
            },
          ],
        },
      },
      skipping: {
        invoke: {
          src: "skipPomodoro",
          input: ({ context }: any) => ({ pomodoro: context.pomodoro! }),
          onDone: [
            {
              guard: ({ event }: any) => {
                return broadcastPomodoroController.isMainHandler.value || false;
              },
              target: "creatingNext",
            },
            {
              target: "idle",
              actions: ["broadcastSkip", "refreshList"],
            },
          ],
        },
      },
      creatingNext: {
        entry: ["notifyFinish", "broadcastFinish"],
        invoke: {
          src: "createNextPomodoro",
          input: ({ context }: any) => ({
            user_id: context.pomodoro!.user_id,
            tags: context.pomodoro?.tags || [],
          }),
          onDone: {
            target: "paused",
            actions: [
              "assignPomodoro",
              "broadcastNext",
              "updateTimeOnNext",
              "refreshList",
            ],
          },
        },
      },
    },
  });
  return _machine;
};
