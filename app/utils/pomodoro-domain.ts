export const DEFAULT_REQUIRED_TAGS_FOR_FINISH_CYCLE = [
  "focus",
  "break",
  "focus",
  "long-break",
];

export const DEFAULT_POMODORO_DURATION_IN_MINUTES = 25;
export const DEFAULT_BREAK_DURATION_IN_MINUTES = 5;
export const DEFAULT_LONG_BREAK_DURATION_IN_MINUTES = 15;

export enum TagIdByType {
  FOCUS = "focus",
  BREAK = "break",
  LONG_BREAK = "long-break",
}

export enum PomodoroType {
  FOCUS = "focus",
  BREAK = "break",
  LONG_BREAK = "long-break",
}

export enum PomodoroState {
  CURRENT = "current",
  PAUSED = "paused",
  FINISHED = "finished",
}

export const TagEnumByType = {
  ["focus"]: TagIdByType.FOCUS,
  ["break"]: TagIdByType.BREAK,
  ["long-break"]: TagIdByType.LONG_BREAK,
};

export const TagTypeById = {
  [TagIdByType.FOCUS]: "focus",
  [TagIdByType.BREAK]: "break",
  [TagIdByType.LONG_BREAK]: "long-break",
};

export const PomodoroDurationInSecondsByDefaultCycleConfiguration = {
  [TagIdByType.FOCUS]: DEFAULT_POMODORO_DURATION_IN_MINUTES * 60,
  [TagIdByType.BREAK]: DEFAULT_BREAK_DURATION_IN_MINUTES * 60,
  [TagIdByType.LONG_BREAK]: DEFAULT_LONG_BREAK_DURATION_IN_MINUTES * 60,
};

export function calculateSecondsRemaining({
  estimated_start,
  expected_end,
}: {
  estimated_start?: string;
  expected_end?: string;
} = {}) {
  const finishingAt = new Date(expected_end || 0);
  const now = estimated_start
    ? new Date(estimated_start).getTime()
    : Date.now();
  const remainingSeconds = Math.floor((finishingAt.getTime() - now) / 1000);

  return remainingSeconds;
}

export function hasCycleFinished(
  currentSecuense: string[],
  requiredSecuense: string[]
): boolean {
  const rest = structuredClone(requiredSecuense);

  requiredSecuense.forEach((tag) => {
    if (currentSecuense?.length === 0) {
      return;
    }

    const currTagFromSecuense = currentSecuense[0];

    const currentSecuenceIncludeARequiredTag = currTagFromSecuense === tag;

    if (!currentSecuenceIncludeARequiredTag) {
      rest.shift();
      return;
    }

    currentSecuense.shift();
    rest.shift();
  });

  return rest.length === 0;
}

export function calculateTimelineFromNow(
  pomodoroDuration: number = PomodoroDurationInSecondsByDefaultCycleConfiguration[
    TagIdByType.FOCUS
  ]
) {
  const started_at = new Date();
  const expectedDate = new Date(started_at.getTime());
  const durationInMs = pomodoroDuration * 1000;
  expectedDate.setTime(expectedDate.getTime() + durationInMs);

  return {
    started_at: started_at.toISOString(),
    expected_end: expectedDate.toISOString(),
  };
}

export function calculateNextTagFromCycleSecuence(
  currentSecuense: string[],
  requiredSecuense: string[]
): string {
  const rest = structuredClone(requiredSecuense);

  requiredSecuense.forEach((tag) => {
    if (currentSecuense?.length === 0) {
      return;
    }

    const currTagFromSecuense = currentSecuense[0];

    const currentSecuenceIncludeARequiredTag = currTagFromSecuense === tag;

    if (!currentSecuenceIncludeARequiredTag) {
      rest.shift();
      return;
    }

    currentSecuense.shift();
    rest.shift();
  });

  return rest[0] || "";
}

export function calculatePomodoroTimelapse(
  startedAt: string | null,
  toggleTimeline: Array<{ at: string; type: "play" | "pause" }>,
  now = Date.now()
): number {
  if (!startedAt) return 0;

  const start = new Date(startedAt).getTime();
  let elapsed = 0;

  const events = [...toggleTimeline].sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()
  );

  let currentSegmentStart = start;
  let isRunning = true;

  for (const event of events) {
    const eventTime = new Date(event.at).getTime();

    if (event.type === "pause" && isRunning) {
      elapsed += Math.max(0, eventTime - currentSegmentStart);
      isRunning = false;
    }

    if (event.type === "play" && !isRunning) {
      currentSegmentStart = eventTime;
      isRunning = true;
    }
  }

  if (isRunning) {
    elapsed += Math.max(0, now - currentSegmentStart);
  }

  return Math.floor(elapsed / 1000);
}
