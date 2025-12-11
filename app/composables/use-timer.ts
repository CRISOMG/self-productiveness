export const useTimer = () => {
  const timer = ref<NodeJS.Timeout | null>(null);
  const clockInMinutes = ref(`${DEFAULT_POMODORO_DURATION_IN_MINUTES}:00`);
  const accSeconds = ref(0);

  function setClockInSeconds(remainingSeconds: number) {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    clockInMinutes.value = `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  const _expected_end = ref<string | null>(null);

  function startTimer({
    onTick,
    onFinish,
    syncAccSeconds,
    clockStartInMinute,
    expected_end,
  }: {
    onTick: (remainingSeconds: number) => void;
    onFinish: () => void;
    syncAccSeconds?: number;
    clockStartInMinute?: number;
    expected_end: string;
  }) {
    if (timer.value) clearInterval(timer.value);
    _expected_end.value = expected_end;

    timer.value = setInterval(() => {
      const remainingSeconds = calculateSecondsRemaining({
        expected_end: _expected_end.value!,
      });

      setClockInSeconds(remainingSeconds);
      onTick(remainingSeconds);
      accSeconds.value += 1;
      if (remainingSeconds <= 0) {
        if (timer.value) clearInterval(timer.value);
        clockInMinutes.value = `${clockStartInMinute}:00`;
        accSeconds.value = 1;
        return onFinish();
      }
    }, 1000);
  }

  return {
    DEFAULT_POMODORO_DURATION_IN_MINUTES,
    startTimer,
    setClockInSeconds,
    timer,
    clockInMinutes,
  };
};
