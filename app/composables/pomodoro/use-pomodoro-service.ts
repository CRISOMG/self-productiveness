import type { Pomodoro, PomodoroCycle } from "~/types/Pomodoro";
import {
  hasCycleFinished,
  calculateTimelineFromNow,
  DEFAULT_POMODORO_DURATION_IN_MINUTES,
} from "~/utils/pomodoro-domain";
import {
  usePomodoroRepository,
  usePomodoroCycleRepository,
  useTagRepository,
} from "./use-pomodoro-repository";

type PomodoroCycleWithPomodoros = PomodoroCycle["Row"] & {
  pomodoros?: Pomodoro["Row"][];
};

export const usePomodoroService = () => {
  const pomodoroRepository = usePomodoroRepository();
  const cycleRepository = usePomodoroCycleRepository();
  const tagRepository = useTagRepository();

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
    userId: string
  ): Promise<PomodoroCycle["Row"]> {
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
  async function startPomodoro({
    user_id,
    state = "paused",
    type,
  }: {
    user_id: string;
    state?: "current" | "paused";
    type?: "focus" | "break" | "long-break";
  }) {
    const cycle = await getOrCreateCurrentCycle(user_id);

    const _type = type || (await getTagByCycleSecuense(cycle));
    const defaultDurationBytag =
      PomodoroDurationInSecondsByDefaultCycleConfiguration[_type];

    const { started_at, expected_end } =
      calculateTimelineFromNow(defaultDurationBytag);

    const expected_duration = defaultDurationBytag;
    const result = await pomodoroRepository.insert({
      user_id,
      started_at,
      expected_end,
      timelapse: 0,
      toggle_timeline: [
        {
          at: new Date().toISOString(),
          type: state === "current" ? "play" : "pause",
        },
      ],
      created_at: new Date().toISOString(),
      state,
      type: _type,
      expected_duration,
      cycle: cycle.id,
    });

    return result;
  }

  async function registToggleTimelinePomodoro(
    pomodoroId: number,
    type: "play" | "pause"
  ) {
    const { toggle_timeline } = await pomodoroRepository.getOne(pomodoroId);

    const result = await pomodoroRepository.update(pomodoroId, {
      state: type == "play" ? "current" : "paused",
      toggle_timeline: [
        ...(toggle_timeline as []),
        {
          at: new Date().toISOString(),
          type: type,
        },
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
    return await pomodoroRepository.update(pomodoro.id, {
      timelapse,
      state: "finished",
      finished_at: new Date().toISOString(),
    });
  }

  async function getTagByCycleSecuense(cycle: PomodoroCycle["Row"] | null) {
    let _cycle: PomodoroCycleWithPomodoros | null = cycle;
    if (!_cycle) {
      const currCycle = await cycleRepository.getCurrent();

      if (!currCycle) {
        throw new Error("No current cycle found");
      }

      _cycle = currCycle;
    }
    const pomodoros = _cycle.pomodoros;
    const required_tags =
      _cycle.required_tags || DEFAULT_REQUIRED_TAGS_FOR_FINISH_CYCLE;

    const pomodoroTagsTypesArray = pomodoros?.map((p) => p.type) || [];

    const tagType = calculateNextTagFromCycleSecuence(
      pomodoroTagsTypesArray,
      required_tags
    );

    return tagType as Pomodoro["Row"]["type"];
  }

  async function getTagIdByType(type: string) {
    const tag = await tagRepository.getOneByType(type);
    if (!tag) {
      return;
    }
    return tag.id;
  }
  async function createNextPomodoro({ user_id }: { user_id: string }) {
    return await startPomodoro({ user_id, state: "paused" });
  }
  return {
    checkIsCurrentCycleEnd,
    finishCurrentCycle,
    registToggleTimelinePomodoro,
    startPomodoro,
    getOrCreateCurrentCycle,
    finishCurrentPomodoro,
    getTagByCycleSecuense,
    getTagIdByType,
    createNextPomodoro,
  };
};
