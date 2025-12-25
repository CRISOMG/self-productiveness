import { defineStore } from "pinia";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<Pomodoro["Row"] | null>(null);
  const loadingUser = ref<boolean>(false);
  const errorUser = ref<string | null>(null);

  const eventSessionLogs = ref<Record<string, any>>({});

  return { user, loadingUser, errorUser, eventSessionLogs };
});
