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

export enum TagType {
  FOCUS = "focus",
  BREAK = "break",
  LONG_BREAK = "long-break",
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
