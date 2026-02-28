<template>
  <section class="flex flex-col items-center justify-center mt-8">
    <div
      class="flex flex-col items-center max-w-sm sm:max-w-full w-full justify-center border rounded-xl p-2 sm:p-4 sm:px-8 transition-colors duration-300 relative bg-inherit"
      :class="[
        isPomodoroLoading
          ? 'border-transparent before:absolute before:inset-0 before:rounded-xl before:-z-20 before:bg-gradient-to-r gap-transparent before:from-primary-500 before:via-orange-500 before:to-primary-500 before:bg-[length:200%_auto] before:animate-[gradient_2s_linear_infinite] after:absolute after:inset-[1px] after:rounded-xl after:-z-10 after:bg-[var(--ui-bg)]'
          : 'border-gray-200 dark:border-white/10',
      ]"
    >
      <div class="flex flex-col">
        <div class="flex flex-wrap items-center justify-center gap-2 mb-4">
          <UButton
            @click="handlePomodoroTypeChange(PomodoroType.FOCUS)"
            :variant="isTypeOfFocus ? 'solid' : 'ghost'"
            :color="isTypeOfFocus ? 'primary' : 'neutral'"
            class="min-w-[100px] justify-center font-title"
            size="sm"
          >
            Focus
          </UButton>
          <UButton
            @click="handlePomodoroTypeChange(PomodoroType.BREAK)"
            :variant="isTypeOfBreak ? 'solid' : 'ghost'"
            :color="isTypeOfBreak ? 'primary' : 'neutral'"
            class="min-w-[110px] justify-center font-title"
            size="sm"
          >
            Short Break
          </UButton>
          <UButton
            @click="handlePomodoroTypeChange(PomodoroType.LONG_BREAK)"
            :variant="isTypeOfLongBreak ? 'solid' : 'ghost'"
            :color="isTypeOfLongBreak ? 'primary' : 'neutral'"
            class="min-w-[110px] justify-center font-title"
            size="sm"
          >
            Long Break
          </UButton>
        </div>

        <div class="flex items-center justify-center">
          <h1
            class="w-82 text-center text-8xl sm:text-9xl font-title text-primary-500 overflow-hidden"
          >
            {{ isPomodoroLoading ? "..." : timeController.clockInMinutes }}
          </h1>
        </div>
        <div class="relative flex items-center justify-center p-4">
          <div class="absolute left-14">
            <UTooltip text="Intervals Settings">
              <UButton
                icon="i-lucide-settings"
                size="xl"
                variant="ghost"
                color="neutral"
                @click="openTimeIntervalsModal = true"
              />
            </UTooltip>
          </div>
          <div class="relative flex items-center h-12">
            <UButton
              size="xl"
              :color="pomodoroBottonIsPlay ? 'primary' : 'neutral'"
              :variant="pomodoroBottonIsPlay ? 'solid' : 'outline'"
              :ui="{
                base: [
                  'w-32 justify-center font-bold transition-all duration-100 uppercase tracking-wider',
                  pomodoroBottonIsPlay
                    ? 'relative -top-[4px] shadow-[0_4px_0px_0px_var(--color-peach-700)] active:top-0 active:shadow-none'
                    : '',
                ],
              }"
              @click="handlePlayPausePomodoro"
              :icon="pomodoroBottonIsPlay ? 'i-lucide-play' : 'i-lucide-pause'"
            >
              {{ pomodoroBottonIsPlay ? "Start" : "Pause" }}
            </UButton>

            <UButton
              v-if="!pomodoroBottonIsPlay"
              class="ml-4 cursor-pointer absolute -right-12"
              color="neutral"
              variant="ghost"
              icon="i-lucide-skip-forward"
              size="lg"
              @click="() => handleSkipPomodoro()"
            />
          </div>
        </div>

        <div>
          <div class="flex gap-1 items-center">
            <div class="flex items-center gap-1">
              <UTooltip text="Manage Tag">
                <UButton
                  :disabled="
                    (pomodoroController?.currPomodoro?.tags?.length || 0) > 10
                  "
                  icon="i-lucide-tag"
                  size="xs"
                  variant="ghost"
                  color="neutral"
                  @click="manageTagModal = true"
                />
              </UTooltip>
            </div>
            <div
              class="flex items-center gap-1"
              v-if="pomodoroController?.currPomodoro?.tags"
            >
              <UBadge
                v-for="tag in pomodoroController?.currPomodoro.tags"
                :key="tag.id"
                size="sm"
                variant="soft"
              >
                {{ tag.label }}
              </UBadge>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="flex justify-center mt-4">
      <p>Today Completed #{{ pomodoroFocusCompletedToday }}</p>
    </div>
    <div
      v-if="pomodoroController?.broadcastStatus === 'error'"
      class="flex items-center justify-center mt-2 gap-1 text-xs text-yellow-500"
    >
      <UIcon name="i-lucide-triangle-alert" class="size-3.5" />
      <UTooltip
        :text="pomodoroController?.broadcastError || 'Error de sincronización'"
      >
        <span class="cursor-help"
          >Sincronización entre pestañas no disponible</span
        >
      </UTooltip>
    </div>
    <ManageTagsModal v-model:open="manageTagModal" multiple />
    <TimeIntervalsModal v-model:open="openTimeIntervalsModal" />
  </section>
</template>

<script setup lang="ts">
const pomodoroController = usePomodoroController();
const taskController = useTaskController();

const manageTagModal = ref(false);
const openTimeIntervalsModal = ref(false);

const pomodoroFocusCompletedToday = computed(() => {
  if (!pomodoroController?.pomodorosListToday) {
    return 0;
  }

  const pl = pomodoroController?.pomodorosListToday;
  return pl.filter(
    (p) => p.type === PomodoroType.FOCUS && p.state == PomodoroState.FINISHED,
  ).length;
});

const pomodoroBottonIsPlay = ref(true);

const {
  handleStartPomodoro,
  handlePausePomodoro,
  handleSkipPomodoro,
  handleFinishPomodoro,
  handleListPomodoros,
  handleSelectPomodoro,
  timeController,
} = usePomodoroController();

const currentPomodoroId = computed(() => pomodoroController?.currPomodoro?.id);

watch(currentPomodoroId, () => {
  handleListPomodoros();
});

const handlePomodoroTypeChange = async (type: PomodoroType) => {
  if (pomodoroController?.currPomodoro?.type === type) {
    return alert("You are already in " + type);
  }
  debugger;
  await handleSkipPomodoro();
  await handleSelectPomodoro(props.user_id, type);
};

const handlePlayPausePomodoro = () => {
  if (pomodoroController?.currPomodoro?.state !== PomodoroState.CURRENT) {
    handleStartPomodoro(
      props.user_id,
      pomodoroController?.currPomodoro?.type,
      PomodoroState.CURRENT,
    );
    pomodoroBottonIsPlay.value = false;
  } else {
    handlePausePomodoro();
    pomodoroBottonIsPlay.value = true;
  }
};

const isPomodoroLoading = computed(() => pomodoroController?.loadingPomodoro);
const isTypeOfFocus = computed(
  () => pomodoroController?.currPomodoro?.type === PomodoroType.FOCUS,
);
const isTypeOfBreak = computed(
  () => pomodoroController?.currPomodoro?.type === PomodoroType.BREAK,
);
const isTypeOfLongBreak = computed(
  () => pomodoroController?.currPomodoro?.type === PomodoroType.LONG_BREAK,
);
defineShortcuts({
  " ": () => {
    handlePlayPausePomodoro();
  },
  "1": () => {
    handlePomodoroTypeChange(PomodoroType.FOCUS);
  },
  "2": () => {
    handlePomodoroTypeChange(PomodoroType.BREAK);
  },
  "3": () => {
    handlePomodoroTypeChange(PomodoroType.LONG_BREAK);
  },
});

const props = defineProps({
  user_id: {
    type: String,
    required: true,
  },
});

watch(
  () => pomodoroController?.currPomodoro,
  () => {
    if (pomodoroController?.currPomodoro?.state === "current") {
      pomodoroBottonIsPlay.value = false;
    } else {
      pomodoroBottonIsPlay.value = true;
    }
  },
  { deep: true },
);
</script>
