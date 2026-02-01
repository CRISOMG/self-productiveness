<template>
  <UModal
    :ui="{ body: 'sm:p-0' }"
    :overlay="false"
    v-model:open="isOpen"
    title="Timeline"
  >
    <template #body>
      <div class="flex h-[85vh] p-0">
        <TimeGrid
          :pomodoros="(pomodoroController.pomodorosListToday as TPomodoro[])"
        />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const pomodoroController = usePomodoroController();

onMounted(() => {
  pomodoroController.handleListPomodoros();
});

const isOpen = defineModel<boolean>({ default: false });
</script>
