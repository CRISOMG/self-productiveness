<template>
  <section class="flex flex-col items-center justify-center h-screen">
    <div class="flex flex-col items-center justify-center border rounded">
      <div class="flex flex-row border-b">
        <div class="flex items-center justify-center p-4">
          <h1 class="text-4xl">
            {{ clockInMinutes }}
          </h1>
        </div>
        <div class="flex items-center justify-center p-4">
          <UButton
            v-if="currPomodoro?.state !== 'current'"
            @click="handleStartPomodoro(props.user_id)"
            >Start</UButton
          >
          <UButton
            v-if="currPomodoro?.state === 'current'"
            @click="handlePausePomodoro"
            >Pause</UButton
          >
          <UButton
            v-if="currPomodoro?.state === 'current'"
            class="ml-4"
            color="error"
            icon="heroicons-solid:x-mark"
            @click="handleResetPomodoro"
          />
        </div>
      </div>
      <TimeGrid :pomodoros="pomodorosListToday" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { usePomodoroStore } from "~/stores/pomodoro";
import { storeToRefs } from "pinia";

const pomodoroStore = usePomodoroStore();
const { pomodorosListToday } = storeToRefs(pomodoroStore);
const {
  handleStartPomodoro,
  handlePausePomodoro,
  handleResetPomodoro,
  getCurrentPomodoro,
  handleListPomodoros,
  currPomodoro,
  clockInMinutes,
  timer,
} = usePomodoroUtils();

defineShortcuts({
  " ": () => {
    if (currPomodoro.value?.state !== "current") {
      handleStartPomodoro(props.user_id);
    } else {
      handlePausePomodoro();
    }
  },
});

const props = defineProps({
  user_id: {
    type: String,
    required: true,
  },
});

watch(currPomodoro, () => {
  localStorage.setItem("currPomodoro", JSON.stringify(currPomodoro.value));
});

onMounted(() => {
  getCurrentPomodoro();

  handleListPomodoros();
  // TODO: mejorar logica para pausar pomodoro al cerrar la pestaña. se puede usar un websocket para mantener la syncronizacion o pushing en intervalos de tiempo
  window.onbeforeunload = async () => {
    if (currPomodoro.value) {
      if (currPomodoro.value.state === "current") {
        localStorage.setItem(
          "currPomodoro",
          JSON.stringify(currPomodoro.value)
        );
        await handlePausePomodoro();
      }
    }
  };

  const storedPomodoro = localStorage.getItem("currPomodoro");
  const pomodoroFromLocalStorage = JSON.parse(storedPomodoro || "null");
  if (pomodoroFromLocalStorage?.state !== "finished") {
    currPomodoro.value = pomodoroFromLocalStorage;
  }
  if (currPomodoro.value) {
    const totalSeconds = DEFAULT_POMODORO_DURATION_IN_MINUTES * 60;
    const remainingSeconds = totalSeconds - currPomodoro.value.timelapse;
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    clockInMinutes.value = `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
});
onUnmounted(() => {
  if (timer.value) clearInterval(timer.value);
  window.onbeforeunload = null;
});
</script>
