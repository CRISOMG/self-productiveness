import {
  hasCycleFinished,
  calculateTimelineFromNow,
  PomodoroType,
  buildDurationMap,
  DEFAULT_TIME_INTERVAL_CONFIGS,
  createTimelineEntry,
} from "~/utils/pomodoro-domain";
import type { TimelineEvent } from "~/composables/types";
import {
  usePomodoroRepository,
  usePomodoroCycleRepository,
} from "./use-pomodoro-repository";
import { useTagRepository } from "~/composables/tag/use-tag-repository";

type PomodoroCycleWithPomodoros = PomodoroCycle & {
  pomodoros?: Pomodoro[];
};

export const usePomodoroService = () => {
  const pomodoroRepository = usePomodoroRepository();
  const cycleRepository = usePomodoroCycleRepository();
  const tagRepository = useTagRepository();
  const { profile } = useProfileController();

  const durationMap = computed(() => {
    const configs = (profile.value?.settings as any)?.time_interval_configs;
    return buildDurationMap(configs ?? DEFAULT_TIME_INTERVAL_CONFIGS);
  });

  async function checkIsCurrentCycleEnd() {
    const currCycle = await cycleRepository.getCurrent();

    if (!currCycle) {
      return false;
    }

    const pomodoros = currCycle.pomodoros;
    const required_tags = currCycle.required_tags || [];

    const pomodoroTagsTypesArray = pomodoros?.flatMap((p) => p.type) || [];
    return hasCycleFinished(pomodoroTagsTypesArray, required_tags);
  }

  async function getOrCreateCurrentCycle(
    userId: string,
  ): Promise<PomodoroCycle> {
    const isCurrentCycleEnd = await checkIsCurrentCycleEnd();
    if (isCurrentCycleEnd) {
      await finishCurrentCycle();
    } else {
      const currentCycle = await cycleRepository.getCurrent();
      if (currentCycle) {
        return currentCycle;
      }
    }

    const newCycle = await cycleRepository.insert({
      state: "current",
      user_id: userId,
    });

    if (!newCycle) {
      throw new Error("Failed to create new pomodoro cycle.");
    }
    return newCycle;
  }

  type TStartPomodoroProps = {
    user_id: string;
    state?: "current" | "paused" | "idle";
    type?: "focus" | "break" | "long_break";
  };
  async function startPomodoro({
    user_id,
    state = "paused",
    type,
  }: TStartPomodoroProps) {
    const cycle = await getOrCreateCurrentCycle(user_id);

    const _type: PomodoroType =
      (type as PomodoroType) ||
      (await getTagByCycleSecuense(cycle)) ||
      PomodoroType.FOCUS;
    const defaultDurationBytag = durationMap.value[_type];

    const isStarting = state === "current";
    const isIdle = state === "idle";
    const { started_at, expected_end } = isStarting
      ? calculateTimelineFromNow(defaultDurationBytag)
      : {};

    const expected_duration = defaultDurationBytag;

    const toggle_timeline: TimelineEvent[] = isStarting
      ? [createTimelineEntry("start")]
      : [];

    const result = await pomodoroRepository.insert({
      user_id,
      started_at: isStarting ? new Date().toISOString() : undefined,
      expected_end: isIdle ? undefined : expected_end,
      timelapse: 0,
      toggle_timeline,
      created_at: new Date().toISOString(),
      state,
      type: _type,
      expected_duration,
      cycle: cycle.id,
    });

    //     {
    //     "id": 279,
    //     "created_at": "2026-02-12T01:05:49.064+00:00",
    //     "started_at": "2026-02-12T01:05:49.064+00:00",
    //     "expected_end": null,
    //     "timelapse": 0,
    //     "user_id": "4ddb8909-ef46-4cde-8feb-8ce0a3c72564",
    //     "state": "paused",
    //     "finished_at": null,
    //     "toggle_timeline": [
    //         {
    //             "at": "2026-02-12T01:05:49.064Z",
    //             "type": "start"
    //         }
    //     ],
    //     "cycle": {
    //         "id": 76,
    //         "state": "current",
    //         "user_id": "4ddb8909-ef46-4cde-8feb-8ce0a3c72564",
    //         "pomodoros": [
    //             {
    //                 "id": 278,
    //                 "type": "focus",
    //                 "cycle": 76,
    //                 "state": "finished",
    //                 "user_id": "4ddb8909-ef46-4cde-8feb-8ce0a3c72564",
    //                 "timelapse": 1024,
    //                 "created_at": "2026-02-11T22:22:23.934+00:00",
    //                 "started_at": "2026-02-11T22:22:23.934+00:00",
    //                 "finished_at": "2026-02-11T22:48:15.906+00:00",
    //                 "expected_end": "2026-02-11T22:48:33.638316+00:00",
    //                 "toggle_timeline": [
    //                     {
    //                         "at": "2026-02-11T22:22:23.934Z",
    //                         "type": "start"
    //                     },
    //                     {
    //                         "at": "2026-02-11T22:23:35.930Z",
    //                         "type": "play"
    //                     },
    //                     {
    //                         "at": "2026-02-11T22:48:15.906Z",
    //                         "type": "finish"
    //                     }
    //                 ],
    //                 "expected_duration": 1500
    //             }
    //         ],
    //         "created_at": "2026-02-11T22:21:03.669794+00:00",
    //         "required_tags": [
    //             "focus",
    //             "break",
    //             "focus",
    //             "long-break"
    //         ]
    //     },
    //     "expected_duration": 1500,
    //     "type": "focus",
    //     "tags": []
    // }
    return result as TPomodoro;
  }

  async function registToggleTimelinePomodoro(
    pomodoroId: number,
    type: "play" | "pause",
  ) {
    let { toggle_timeline, started_at, ...restPomodoro } =
      await pomodoroRepository.getOne(pomodoroId);

    if (!started_at) {
      started_at = new Date().toISOString();
    }
    const result = await pomodoroRepository.update(pomodoroId, {
      started_at,
      state: type == "play" ? "current" : "paused",
      toggle_timeline: [
        ...(toggle_timeline as TimelineEvent[]),
        createTimelineEntry(type),
      ],
    });

    return result;
  }

  async function finishCurrentCycle() {
    const cycle = await cycleRepository.getCurrent();
    if (!cycle) {
      return;
    }
    await cycleRepository.update(cycle.id, {
      state: "finished",
    });
  }

  async function finishCurrentPomodoro({ timelapse }: { timelapse: number }) {
    const pomodoro = await pomodoroRepository.getCurrentPomodoro();
    if (!pomodoro) {
      return;
    }

    const { toggle_timeline } = pomodoro;
    const updatedTimeline = [...toggle_timeline, createTimelineEntry("finish")];

    return await pomodoroRepository.update(pomodoro.id, {
      timelapse,
      state: "finished",
      finished_at: new Date().toISOString(),
      toggle_timeline: updatedTimeline,
    });
  }

  async function skipCurrentPomodoro({ timelapse }: { timelapse: number }) {
    const pomodoro = await pomodoroRepository.getCurrentPomodoro();
    if (!pomodoro) {
      return;
    }

    const { toggle_timeline } = pomodoro;
    const updatedTimeline = [...toggle_timeline, createTimelineEntry("skip")];

    return await pomodoroRepository.update(pomodoro.id, {
      timelapse,
      state: "skipped",
      finished_at: new Date().toISOString(),
      toggle_timeline: updatedTimeline,
    });
  }

  async function getTagByCycleSecuense(cycle: PomodoroCycle | null) {
    let _cycle: PomodoroCycleWithPomodoros | null = cycle;
    if (!_cycle) {
      const currCycle = await cycleRepository.getCurrent();

      if (!currCycle) {
        throw new Error("No current cycle found");
      }

      _cycle = currCycle;
    }
    const pomodoros = _cycle.pomodoros || [];
    const required_tags =
      _cycle.required_tags || DEFAULT_REQUIRED_TAGS_FOR_FINISH_CYCLE;

    const pomodoroTagsTypesArray = pomodoros
      .filter((p) => p.state === "finished" || p.state === "skipped")
      .map((p) => p.type);

    const tagType = calculateNextTagFromCycleSecuence(
      pomodoroTagsTypesArray,
      required_tags,
    );

    return tagType as PomodoroType;
  }

  async function getTagIdByType(type: string) {
    const tag = await tagRepository.getOneByType(type);
    if (!tag) {
      return;
    }
    return tag.id;
  }
  async function createNextPomodoro({
    user_id,
    forceIdle,
  }: {
    user_id: string;
    forceIdle?: boolean;
  }) {
    const autoplay =
      (profile.value?.settings as any)?.time_interval_configs?.autoplay ?? true;
    const state = autoplay && !forceIdle ? "current" : "idle";
    return await startPomodoro({ user_id, state });
  }

  async function addTagToPomodoro(
    pomodoroId: number,
    tagId: number,
    userId: string,
  ) {
    return await pomodoroRepository.addTag(pomodoroId, tagId, userId);
  }

  async function removeTagFromPomodoro(pomodoroId: number, tagId: number) {
    return await pomodoroRepository.removeTag(pomodoroId, tagId);
  }

  async function addTaskToPomodoro(
    pomodoroId: number,
    taskId: string,
    userId: string,
  ) {
    return await pomodoroRepository.addTask(pomodoroId, taskId, userId);
  }

  async function removeTaskFromPomodoro(pomodoroId: number, taskId: string) {
    return await pomodoroRepository.removeTask(pomodoroId, taskId);
  }

  async function listToday() {
    return await pomodoroRepository.listToday();
  }

  async function getCurrentPomodoro() {
    return await pomodoroRepository.getCurrentPomodoro();
  }

  async function getTaskIdsFromPomodoro(pomodoroId: number) {
    return await pomodoroRepository.getTaskIds(pomodoroId);
  }

  async function update(pomodoroId: number, data: Partial<TPomodoro>) {
    return await pomodoroRepository.update(pomodoroId, data);
  }

  async function getOne(id: number) {
    return await pomodoroRepository.getOne(id);
  }

  async function activateIdlePomodoro(id: number) {
    const pomodoro = await pomodoroRepository.getOne(id);
    if (!pomodoro || pomodoro.state !== "idle") {
      throw new Error("Pomodoro is not in idle state");
    }

    const duration = pomodoro.expected_duration;
    const { started_at, expected_end } = calculateTimelineFromNow(duration);
    const toggle_timeline: TimelineEvent[] = [createTimelineEntry("start")];

    return await pomodoroRepository.update(id, {
      state: "current",
      started_at: new Date().toISOString(),
      expected_end,
      toggle_timeline,
    } as any);
  }

  return {
    checkIsCurrentCycleEnd,
    finishCurrentCycle,
    registToggleTimelinePomodoro,
    startPomodoro,
    activateIdlePomodoro,
    getOrCreateCurrentCycle,
    finishCurrentPomodoro,
    skipCurrentPomodoro,
    getTagByCycleSecuense,
    getTagIdByType,
    createNextPomodoro,
    addTagToPomodoro,
    removeTagFromPomodoro,
    listToday,
    getCurrentPomodoro,
    update,
    getOne,
    addTaskToPomodoro,
    removeTaskFromPomodoro,
    getTaskIdsFromPomodoro,
    durationMap,
  };
};
