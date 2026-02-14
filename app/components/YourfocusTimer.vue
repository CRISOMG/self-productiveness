<template>
  <section class="flex flex-col items-center justify-center mt-8">
    <div
      class="flex flex-col items-center max-w-sm sm:max-w-full w-full justify-center border border-gray-200 dark:border-white/10 rounded-xl p-2 sm:p-4 sm:px-8"
    >
      <div class="flex flex-col">
        <div class="flex flex-wrap items-center justify-center gap-2 mb-4">
          <UButton
            @click="handlePomodoroTypeChange(PomodoroType.FOCUS)"
            :variant="
              pomodoroController?.currPomodoro?.type === PomodoroType.FOCUS
                ? 'solid'
                : 'ghost'
            "
            :color="
              pomodoroController?.currPomodoro?.type === PomodoroType.FOCUS
                ? 'primary'
                : 'neutral'
            "
            class="min-w-[100px] justify-center font-title"
            size="sm"
          >
            Focus
          </UButton>
          <UButton
            @click="handlePomodoroTypeChange(PomodoroType.BREAK)"
            :variant="
              pomodoroController?.currPomodoro?.type === PomodoroType.BREAK
                ? 'solid'
                : 'ghost'
            "
            :color="
              pomodoroController?.currPomodoro?.type === PomodoroType.BREAK
                ? 'primary'
                : 'neutral'
            "
            class="min-w-[110px] justify-center font-title"
            size="sm"
          >
            Short Break
          </UButton>
          <UButton
            @click="handlePomodoroTypeChange(PomodoroType.LONG_BREAK)"
            :variant="
              pomodoroController?.currPomodoro?.type === PomodoroType.LONG_BREAK
                ? 'solid'
                : 'ghost'
            "
            :color="
              pomodoroController?.currPomodoro?.type === PomodoroType.LONG_BREAK
                ? 'primary'
                : 'neutral'
            "
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
            {{ timeController.clockInMinutes }}
          </h1>
        </div>
        <div class="flex items-center justify-center p-4">
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
    <ManageTagsModal v-model:open="manageTagModal" multiple />
  </section>
</template>

<script setup lang="ts">
const pomodoroController = usePomodoroController();
const taskController = useTaskController();

const manageTagModal = ref(false);

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
