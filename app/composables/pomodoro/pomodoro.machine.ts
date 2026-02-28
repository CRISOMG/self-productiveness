import { setup, assign, fromPromise, fromCallback } from "xstate";
import {
  computeExpectedEnd,
  updatePomodoroTimelapse,
  createTimelineEntry,
  DEFAULT_DURATION_SECONDS,
} from "~/utils/pomodoro-domain";
import type { TPomodoro } from "../types";

export enum PomodoroMachineEvent {
  INIT = "INIT",
  START = "START",
  PAUSE = "PAUSE",
  RESUME = "RESUME",
  FINISH = "FINISH",
  RESET = "RESET",
  SKIP = "SKIP",
  SYNC = "SYNC",
  BROADCAST_PLAY = "BROADCAST.PLAY",
  BROADCAST_PAUSE = "BROADCAST.PAUSE",
  BROADCAST_FINISH = "BROADCAST.FINISH",
  BROADCAST_NEXT = "BROADCAST.NEXT",
  TIMER_FINISH = "TIMER.FINISH",
  TAGS_UPDATE = "TAGS.UPDATE",
}

export enum PomodoroMachineState {
  IDLE = "idle",
  FETCHING = "fetching",
  STARTING = "starting",
  RUNNING = "running",
  PAUSING = "pausing",
  PAUSED = "paused",
  RESUMING = "resuming",
  FINISHING = "finishing",
  SKIPPING = "skipping",
  CREATING_NEXT = "creatingNext",
}

export const MachineActors = {
  FETCH_CURRENT: "fetchCurrent",
  CREATE_OR_RESUME: "createOrResume",
  TOGGLE_PLAY: "togglePlay",
  START_TIMER: "startTimerActor",
  FINISH_POMODORO: "finishPomodoro",
  SKIP_POMODORO: "skipPomodoro",
  CREATE_NEXT: "createNextPomodoro",
} as const;

export const MachineActions = {
  ASSIGN_POMODORO: "assignPomodoro",
  UPDATE_TIME_ON_PAUSE: "updateTimeOnPause",
  UPDATE_TIME_ON_NEXT: "updateTimeOnNext",
  OPTIMISTIC_PAUSE: "optimisticPause",
  OPTIMISTIC_PLAY: "optimisticPlay",
  BROADCAST_PLAY: "broadcastPlay",
  BROADCAST_PAUSE: "broadcastPause",
  BROADCAST_FINISH: "broadcastFinish",
  BROADCAST_SKIP: "broadcastSkip",
  BROADCAST_NEXT: "broadcastNext",
  NOTIFY_FINISH: "notifyFinish",
  REFRESH_LIST: "refreshList",
  HANDLE_ERROR: "handleError",
} as const;

type MachineEvents =
  | { type: string; output?: any; actorId?: string }
  | TPomodoro
  | { type: PomodoroMachineEvent.INIT }
  | {
      type: PomodoroMachineEvent.START;
      inputs: {
        user_id: string;
        type?: string;
        state?: "current" | "paused";
        existingIdleId?: number;
      };
    }
  | { type: PomodoroMachineEvent.PAUSE }
  | { type: PomodoroMachineEvent.RESUME }
  | {
      type: PomodoroMachineEvent.FINISH;
      withNext?: boolean;
      broadcast?: boolean;
    }
  | { type: PomodoroMachineEvent.RESET }
  | { type: PomodoroMachineEvent.SKIP; withNext?: boolean }
  | { type: PomodoroMachineEvent.SYNC; pomodoro: TPomodoro }
  | { type: PomodoroMachineEvent.BROADCAST_PLAY; payload: any }
  | { type: PomodoroMachineEvent.BROADCAST_PAUSE; payload: any }
  | { type: PomodoroMachineEvent.BROADCAST_FINISH; payload: any }
  | { type: PomodoroMachineEvent.BROADCAST_NEXT; payload: any }
  | { type: PomodoroMachineEvent.TAGS_UPDATE; pomodoro: TPomodoro }
  | { type: PomodoroMachineEvent.TIMER_FINISH };

export interface PomodoroMachineDeps {
  pomodoroService: ReturnType<typeof usePomodoroService>;
  timeController: ReturnType<typeof useTimer>;
  notificationController: ReturnType<typeof useNotificationController>;
  broadcastPomodoroController: ReturnType<typeof useBroadcastPomodoro>;
  keepTags: Ref<boolean>;
  handleListPomodoros: () => Promise<any>;
  toast: ReturnType<typeof useSuccessErrorToast>;
}

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
      [MachineActors.FETCH_CURRENT]: fromPromise(async () => {
        return await pomodoroService.getCurrentPomodoro();
      }),
      [MachineActors.CREATE_OR_RESUME]: fromPromise(
        async ({
          input,
        }: {
          input: {
            user_id: string;
            type?: string;
            state?: "current" | "paused" | "idle";
            existingIdleId?: number;
          } | null;
        }) => {
          if (input) {
            if (input.existingIdleId) {
              return await pomodoroService.activateIdlePomodoro(
                input.existingIdleId,
              );
            }
            return await pomodoroService.startPomodoro({
              user_id: input.user_id,
              type: input.type as any,
              state: input.state,
            });
          }
          throw new Error("Invalid Input");
        },
      ),
      [MachineActors.TOGGLE_PLAY]: fromPromise(
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
      [MachineActors.START_TIMER]: fromCallback(
        ({ sendBack, receive, input }) => {
          const pomodoro = (input as any).pomodoro as TPomodoro;
          if (!pomodoro) return;

          timeController.startTimer({
            expected_end: computeExpectedEnd(pomodoro),
            clockStartInMinute:
              ((pomodoro.expected_duration || DEFAULT_DURATION_SECONDS) -
                pomodoro.timelapse) /
              60,
            onTick: (remaining) => {
              if (remaining % 5 === 0) {
                // Trigger sync check if needed?
              }
            },
            onFinish: () => {
              sendBack({ type: PomodoroMachineEvent.TIMER_FINISH });
            },
          });

          return () => {
            timeController.clearTimer();
          };
        },
      ),
      [MachineActors.FINISH_POMODORO]: fromPromise(
        async ({ input }: { input: { pomodoro: TPomodoro } }) => {
          await pomodoroService.finishCurrentPomodoro({
            timelapse: input.pomodoro.timelapse,
          });
          const cycleEnded = await pomodoroService.checkIsCurrentCycleEnd();
          if (cycleEnded) {
            await pomodoroService.finishCurrentCycle();
          }
          return { cycleEnded };
        },
      ),
      [MachineActors.SKIP_POMODORO]: fromPromise(
        async ({ input }: { input: { pomodoro: TPomodoro } }) => {
          await pomodoroService.skipCurrentPomodoro({
            timelapse: input.pomodoro.timelapse,
          });
          const cycleEnded = await pomodoroService.checkIsCurrentCycleEnd();
          if (cycleEnded) {
            await pomodoroService.finishCurrentCycle();
          }
          return { cycleEnded };
        },
      ),
      [MachineActors.CREATE_NEXT]: fromPromise(
        async ({
          input,
        }: {
          input: { user_id: string; tags: any[]; forceIdle?: boolean };
        }) => {
          const next = await pomodoroService.createNextPomodoro({
            user_id: input.user_id,
            forceIdle: input.forceIdle,
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
      [MachineActions.ASSIGN_POMODORO]: assign({
        pomodoro: (params: any) => {
          const { context, event } = params;
          const e = event as any;
          const p = e.output || e.pomodoro || e.payload;
          if (p) updatePomodoroTimelapse(p);
          return p;
        },
      }),
      [MachineActions.UPDATE_TIME_ON_PAUSE]: ({ context }: any) => {
        if (!context.pomodoro) return;
        timeController.clearTimer();
        const remaining =
          (context.pomodoro.expected_duration || DEFAULT_DURATION_SECONDS) -
          context.pomodoro.timelapse;
        timeController.setClockInSeconds(remaining);
      },
      [MachineActions.UPDATE_TIME_ON_NEXT]: ({ context }: any) => {
        if (!context.pomodoro) return;
        timeController.setClockInSeconds(
          context.pomodoro.expected_duration || DEFAULT_DURATION_SECONDS,
        );
      },
      [MachineActions.OPTIMISTIC_PAUSE]: assign({
        pomodoro: ({ context }: any) => {
          if (!context.pomodoro) return null;
          const newTimeline = [
            ...(context.pomodoro.toggle_timeline || []),
            createTimelineEntry("pause"),
          ];
          const updated = {
            ...context.pomodoro,
            state: "paused" as const,
            toggle_timeline: newTimeline,
          };
          updatePomodoroTimelapse(updated);
          return updated as unknown as TPomodoro;
        },
      }),
      [MachineActions.OPTIMISTIC_PLAY]: assign({
        pomodoro: ({ context }: any) => {
          if (!context.pomodoro) return null;
          const newTimeline = [
            ...(context.pomodoro.toggle_timeline || []),
            createTimelineEntry("play"),
          ];
          const updated = {
            ...context.pomodoro,
            state: "current" as const,
            toggle_timeline: newTimeline,
          };
          updatePomodoroTimelapse(updated);
          return updated as unknown as TPomodoro;
        },
      }),
      [MachineActions.BROADCAST_PLAY]: ({ context }: any) => {
        if (context.pomodoro)
          broadcastPomodoroController.broadcastEvent("pomodoro:play", {
            id: context.pomodoro.id,
            toggle_timeline: context.pomodoro.toggle_timeline,
          });
      },
      [MachineActions.BROADCAST_PAUSE]: ({ context }: any) => {
        if (context.pomodoro)
          broadcastPomodoroController.broadcastEvent("pomodoro:pause", {
            id: context.pomodoro.id,
            toggle_timeline: context.pomodoro.toggle_timeline,
          });
      },
      [MachineActions.BROADCAST_FINISH]: ({ context }: any) => {
        if (context.pomodoro)
          broadcastPomodoroController.broadcastEvent("pomodoro:finish", {
            id: context.pomodoro.id,
          });
      },
      [MachineActions.BROADCAST_SKIP]: ({ context }: any) => {
        if (context.pomodoro)
          broadcastPomodoroController.broadcastEvent("pomodoro:skip", {
            id: context.pomodoro.id,
          });
      },
      [MachineActions.BROADCAST_NEXT]: ({ context }: any) => {
        if (context.pomodoro)
          broadcastPomodoroController.broadcastEvent("pomodoro:next", {
            id: context.pomodoro.id,
          });
      },
      [MachineActions.NOTIFY_FINISH]: () => {
        // notificationController.notify("Pomodoro finished!", {
        //   body: "Time to take a break!",
        //   icon: "/favicon.ico",
        //   requireInteraction: true,
        // });
      },
      [MachineActions.REFRESH_LIST]: () => handleListPomodoros(),
      [MachineActions.HANDLE_ERROR]: ({ event }: any) => {
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
    initial: PomodoroMachineState.IDLE,
    on: {
      [PomodoroMachineEvent.INIT]: `.${PomodoroMachineState.FETCHING}`,
      [PomodoroMachineEvent.SYNC]: { actions: MachineActions.ASSIGN_POMODORO },
      [PomodoroMachineEvent.TAGS_UPDATE]: {
        actions: MachineActions.ASSIGN_POMODORO,
      },
    },
    states: {
      [PomodoroMachineState.IDLE]: {
        entry: ({ context }: any) => {
          if (context.pomodoro) {
            timeController.setClockInSeconds(
              context.pomodoro.expected_duration || DEFAULT_DURATION_SECONDS,
            );
          }
        },
        on: {
          [PomodoroMachineEvent.START]: PomodoroMachineState.STARTING,
        },
      },
      [PomodoroMachineState.FETCHING]: {
        invoke: {
          src: MachineActors.FETCH_CURRENT,
          onDone: [
            {
              guard: ({ event }: any) => event.output?.state === "current",
              target: PomodoroMachineState.RUNNING,
              actions: MachineActions.ASSIGN_POMODORO,
            },
            {
              guard: ({ event }: any) => event.output?.state === "paused",
              target: PomodoroMachineState.PAUSED,
              actions: MachineActions.ASSIGN_POMODORO,
            },
            {
              guard: ({ event }: any) => event.output?.state === "idle",
              target: PomodoroMachineState.IDLE,
              actions: MachineActions.ASSIGN_POMODORO,
            },
            {
              target: PomodoroMachineState.IDLE,
            },
          ],
          onError: {
            target: PomodoroMachineState.IDLE,
            actions: MachineActions.HANDLE_ERROR,
          },
        },
      },
      [PomodoroMachineState.STARTING]: {
        invoke: {
          src: MachineActors.CREATE_OR_RESUME,
          input: ({ event }: any) => (event as any).inputs,
          onDone: {
            target: PomodoroMachineState.RUNNING,
            actions: [
              MachineActions.ASSIGN_POMODORO,
              MachineActions.BROADCAST_PLAY,
              MachineActions.REFRESH_LIST,
            ],
          },
          onError: {
            target: PomodoroMachineState.IDLE,
            actions: MachineActions.HANDLE_ERROR,
          },
        },
      },
      [PomodoroMachineState.RUNNING]: {
        entry: MachineActions.ASSIGN_POMODORO,
        invoke: {
          src: MachineActors.START_TIMER,
          input: ({ context }: any) => ({ pomodoro: context.pomodoro }),
          onDone: { target: PomodoroMachineState.FINISHING },
        },
        on: {
          [PomodoroMachineEvent.PAUSE]: {
            target: PomodoroMachineState.PAUSING,
            actions: MachineActions.OPTIMISTIC_PAUSE,
          },
          [PomodoroMachineEvent.FINISH]: PomodoroMachineState.FINISHING,
          [PomodoroMachineEvent.SKIP]: PomodoroMachineState.SKIPPING,
          [PomodoroMachineEvent.TIMER_FINISH]: PomodoroMachineState.FINISHING,
          [PomodoroMachineEvent.BROADCAST_PAUSE]: {
            target: PomodoroMachineState.PAUSED,
            actions: [
              MachineActions.ASSIGN_POMODORO,
              MachineActions.UPDATE_TIME_ON_PAUSE,
            ],
          },
          [PomodoroMachineEvent.BROADCAST_FINISH]: {
            target: PomodoroMachineState.IDLE,
            actions: [MachineActions.REFRESH_LIST],
          },
        },
      },
      [PomodoroMachineState.PAUSING]: {
        invoke: {
          src: MachineActors.TOGGLE_PLAY,
          input: ({ context }: any) => ({
            id: context.pomodoro!.id,
            type: "pause",
          }),
          onDone: {
            target: PomodoroMachineState.PAUSED,
            actions: [
              MachineActions.ASSIGN_POMODORO,
              MachineActions.BROADCAST_PAUSE,
            ],
          },
          onError: {
            target: PomodoroMachineState.RUNNING,
            actions: MachineActions.HANDLE_ERROR,
          },
        },
      },
      [PomodoroMachineState.PAUSED]: {
        entry: MachineActions.UPDATE_TIME_ON_PAUSE,
        on: {
          [PomodoroMachineEvent.RESUME]: {
            target: PomodoroMachineState.RESUMING,
            actions: MachineActions.OPTIMISTIC_PLAY,
          },
          [PomodoroMachineEvent.FINISH]: PomodoroMachineState.FINISHING,
          [PomodoroMachineEvent.SKIP]: PomodoroMachineState.SKIPPING,
          [PomodoroMachineEvent.BROADCAST_PLAY]: {
            target: PomodoroMachineState.RUNNING,
            actions: MachineActions.ASSIGN_POMODORO,
          },
          [PomodoroMachineEvent.BROADCAST_FINISH]: {
            target: PomodoroMachineState.IDLE,
            actions: [MachineActions.REFRESH_LIST],
          },
        },
      },
      [PomodoroMachineState.RESUMING]: {
        invoke: {
          src: MachineActors.TOGGLE_PLAY,
          input: ({ context }: any) => ({
            id: context.pomodoro!.id,
            type: "play",
          }),
          onDone: {
            target: PomodoroMachineState.RUNNING,
            actions: [
              MachineActions.ASSIGN_POMODORO,
              MachineActions.BROADCAST_PLAY,
            ],
          },
          onError: {
            target: PomodoroMachineState.PAUSED,
            actions: MachineActions.HANDLE_ERROR,
          },
        },
      },
      [PomodoroMachineState.FINISHING]: {
        invoke: {
          src: MachineActors.FINISH_POMODORO,
          input: ({ context }: any) => ({ pomodoro: context.pomodoro! }),
          onDone: [
            {
              guard: ({ event }: any) => {
                return broadcastPomodoroController.isMainHandler.value || false;
              },
              target: PomodoroMachineState.CREATING_NEXT,
            },
            {
              target: PomodoroMachineState.IDLE,
              actions: [
                MachineActions.NOTIFY_FINISH,
                MachineActions.BROADCAST_FINISH,
                MachineActions.REFRESH_LIST,
              ],
            },
          ],
        },
      },
      [PomodoroMachineState.SKIPPING]: {
        invoke: {
          src: MachineActors.SKIP_POMODORO,
          input: ({ context }: any) => ({ pomodoro: context.pomodoro! }),
          onDone: [
            {
              guard: ({ event }: any) => {
                return broadcastPomodoroController.isMainHandler.value || false;
              },
              target: PomodoroMachineState.CREATING_NEXT,
            },
            {
              target: PomodoroMachineState.IDLE,
              actions: [
                MachineActions.BROADCAST_SKIP,
                MachineActions.REFRESH_LIST,
              ],
            },
          ],
        },
      },
      [PomodoroMachineState.CREATING_NEXT]: {
        entry: [MachineActions.NOTIFY_FINISH, MachineActions.BROADCAST_FINISH],
        invoke: {
          src: MachineActors.CREATE_NEXT,
          input: ({ context, event }: any) => ({
            user_id: context.pomodoro!.user_id,
            tags: context.pomodoro?.tags || [],
            forceIdle: event?.output?.cycleEnded || false,
          }),
          onDone: [
            {
              guard: ({ event }: any) => event.output?.state === "current",
              target: PomodoroMachineState.RUNNING,
              actions: [
                MachineActions.ASSIGN_POMODORO,
                MachineActions.BROADCAST_NEXT,
                MachineActions.REFRESH_LIST,
              ],
            },
            {
              target: PomodoroMachineState.IDLE,
              actions: [
                MachineActions.ASSIGN_POMODORO,
                MachineActions.BROADCAST_NEXT,
                MachineActions.UPDATE_TIME_ON_NEXT,
                MachineActions.REFRESH_LIST,
              ],
            },
          ],
        },
      },
    },
  });
  return _machine;
};
