import { defineStore } from "pinia";
import type { Pomodoro, TPomodoro } from "~/types/Pomodoro";
import { storeToRefs } from "pinia";

export const usePomodoroStore = defineStore("pomodoro", () => {
  const currPomodoro = ref<TPomodoro | null>();
  const pomodorosListToday = ref<TPomodoro[] | null>();
  const loadingPomodoros = ref<boolean>(false);
  return { currPomodoro, pomodorosListToday, loadingPomodoros };
});

export const usePomodoroStoreRefs = () => storeToRefs(usePomodoroStore());
