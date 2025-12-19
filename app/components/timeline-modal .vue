<template>
  <UModal
    :ui="{ body: 'sm:p-0' }"
    :overlay="false"
    v-model:open="isOpen"
    title="Timeline"
  >
    <template #body>
      <div class="flex h-[85vh] p-0">
        <TimeGrid :pomodoros="(pomodorosListToday as TPomodoro[])" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { usePomodoroStoreRefs } from "~/stores/pomodoro";
import type { TPomodoro } from "~/types/Pomodoro";

const { pomodorosListToday } = usePomodoroStoreRefs();

const isOpen = defineModel<boolean>({ default: false });
</script>
