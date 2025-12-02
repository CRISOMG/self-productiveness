import type { Pomodoro, PomodoroCycle } from "~/types/Pomodoro";
import {
  hasCycleFinished,
  calculateTimelineFromNow,
  DEFAULT_POMODORO_DURATION_IN_MINUTES,
} from "~/utils/pomodoro-domain";
import {
  usePomodoroRepository,
  usePomodoroCycleRepository,
} from "./use-pomodoro-repository";

export const usePomodoroService = () => {
  const pomodoroRepository = usePomodoroRepository();
  const cycleRepository = usePomodoroCycleRepository();

  async function checkIsCurrentCycleEnd() {
    const currCycle = await cycleRepository.getCurrent();

    if (!currCycle) {
      return false;
    }

    const pomodoros = currCycle.pomodoros;
    const required_tags = currCycle.required_tags;

    const pomodoroTagsTypesArray =
      pomodoros?.flatMap((p) => p.tags?.map((t) => t.type)) || [];
    return hasCycleFinished(pomodoroTagsTypesArray, required_tags);
  }

  async function getOrCreateCurrentCycleId(userId: string): Promise<number> {
    const currentCycle = await cycleRepository.getCurrent();

    if (currentCycle) {
      return currentCycle.id;
    }

    const newCycle = await cycleRepository.insert({
      state: "current",
      user_id: userId,
    });

    if (!newCycle) {
      throw new Error("Failed to create new pomodoro cycle.");
    }
    return newCycle.id;
  }

  async function startPomodoro({
    user_id,
    tagId,
  }: {
    user_id: string;
    tagId: TagIdByType;
  }) {
    const { started_at, expected_end } = calculateTimelineFromNow();

    const pomodoroCycleId = await getOrCreateCurrentCycleId(user_id);

    const result = await pomodoroRepository.insert(
      {
        user_id,
        started_at,
        expected_end,
        timelapse: 0,
        toggle_timeline: [],
        created_at: new Date().toISOString(),
        state: "current",
        expected_duration: DEFAULT_POMODORO_DURATION_IN_MINUTES * 60,
        cycle: pomodoroCycleId,
      },
      tagId
    );

    return result;
  }

  async function registToggleTimelinePomodoro(
    pomodoroId: number,
    type: "play" | "pause"
  ) {
    const { toggle_timeline } = await pomodoroRepository.getOne(pomodoroId);

    const result = await pomodoroRepository.update(pomodoroId, {
      state: "current",
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
    await pomodoroRepository.update(pomodoro.id, {
      timelapse,
      state: "finished",
      finished_at: new Date().toISOString(),
    });
  }

  return {
    checkIsCurrentCycleEnd,
    finishCurrentCycle,
    registToggleTimelinePomodoro,
    startPomodoro,
    getOrCreateCurrentCycleId,
    finishCurrentPomodoro,
  };
};
