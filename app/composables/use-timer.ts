export const useTimer = () => {
  const timer = ref<NodeJS.Timeout | null>(null);
  const clockInMinutes = ref(`${DEFAULT_POMODORO_DURATION_IN_MINUTES}:00`);
  const accSeconds = ref(0);

  function setClockInSeconds(remainingSeconds: number) {
    if (remainingSeconds < 0) return;
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
    clockStartInMinute = DEFAULT_POMODORO_DURATION_IN_MINUTES,
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
      if (remainingSeconds <= 0) {
        if (timer.value) clearInterval(timer.value);
        clockInMinutes.value = `${
          clockStartInMinute < 1 ? "00" : clockStartInMinute
        }:00`;
        accSeconds.value = 0;
        return onFinish();
      }

      setClockInSeconds(remainingSeconds);
      onTick(remainingSeconds);
      accSeconds.value += 1;
    }, 1000);
  }

  function clearTimer() {
    if (timer.value) clearInterval(timer.value);
    timer.value = null;
  }

  return {
    DEFAULT_POMODORO_DURATION_IN_MINUTES,
    startTimer,
    setClockInSeconds,
    clearTimer,
    timer,
    clockInMinutes,
  };
};
