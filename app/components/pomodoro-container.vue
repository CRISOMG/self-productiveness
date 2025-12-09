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
      <div class="w-2xl h-[80vh]">
        <TimeGrid :pomodoros="pomodoros" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { usePomodoroStore } from "~/stores/pomodoro";
import { storeToRefs } from "pinia";
import type { Pomodoro } from "~/types/Pomodoro";
import { computed } from "vue";

const pomodoroStore = usePomodoroStore();
const { pomodorosListToday } = storeToRefs(pomodoroStore);
const pomodoros = computed<Pomodoro["Row"][]>(
  () => (pomodorosListToday.value as any) || []
);
const {
  handleStartPomodoro,
  handlePausePomodoro,
  handleResetPomodoro,
  getCurrentPomodoro,
  handleListPomodoros,
  currPomodoro,
  clockInMinutes,
  timer,
} = usePomodoroController();

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
</script>
