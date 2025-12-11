import { defineStore } from "pinia";
import type { Pomodoro, TPomodoro } from "~/types/Pomodoro";

export const usePomodoroStore = defineStore("pomodoro", () => {
  const currPomodoro = ref<TPomodoro | null>(null);
  const pomodorosListToday = ref<TPomodoro[] | null>(null);
  const loadingPomodoros = ref<boolean>(false);
  return { currPomodoro, pomodorosListToday, loadingPomodoros };
});
