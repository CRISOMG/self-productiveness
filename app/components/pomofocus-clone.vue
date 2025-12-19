<template>
  <section class="flex flex-col items-center justify-center mt-8">
    <div
      class="flex flex-col items-center max-w-sm w-full justify-center border rounded p-4 px-8 bg-amber-100/5"
    >
      <div class="flex flex-col">
        <div>
          <button
            @click="handlePomodoroTypeChange(PomodoroType.FOCUS)"
            class="cursor-pointer text-md p-2 py-1 rounded-md select-none"
            :class="{
              'bg-black/20': currentPomodoroType === PomodoroType.FOCUS,
            }"
          >
            Pomodoro
          </button>
          <button
            @click="handlePomodoroTypeChange(PomodoroType.BREAK)"
            class="cursor-pointer text-md p-2 py-1 rounded-md select-none"
            :class="{
              'bg-black/20': currentPomodoroType === PomodoroType.BREAK,
            }"
          >
            Short Break
          </button>
          <button
            @click="handlePomodoroTypeChange(PomodoroType.LONG_BREAK)"
            class="cursor-pointer text-md p-2 py-1 rounded-md select-none"
            :class="{
              'bg-black/20': currentPomodoroType === PomodoroType.LONG_BREAK,
            }"
          >
            Long Break
          </button>
        </div>
        <div class="flex items-center justify-center p-4">
          <h1 class="text-8xl">
            {{ timeController.clockInMinutes }}
          </h1>
        </div>
        <div class="flex items-center justify-center p-4">
          <div class="relative h-8 transition-none text-center shadow">
            <UButton
              :ui="{
                base: pomodoroBottonIsPlay
                  ? 'w-18 justify-center relative shadow shadow-[0_4px_0px_0px_#c0c0c0] -top-[4px] bg-white rounded-xs active:bg-white hover:bg-white '
                  : 'w-18 justify-center bg-white rounded-xs active:bg-white hover:bg-white',
              }"
              @click="
                () => {
                  if (!pomodoroBottonIsPlay) {
                    handlePausePomodoro();
                    pomodoroBottonIsPlay = false;
                  } else {
                    handleStartPomodoro(props.user_id);
                    pomodoroBottonIsPlay = true;
                  }
                }
              "
            >
              {{ pomodoroBottonIsPlay ? "Start" : "Pause" }}
            </UButton>
            <UButton
              v-if="!pomodoroBottonIsPlay"
              class="ml-4 absolute -right-12"
              color="neutral"
              icon="i-lucide-skip-forward"
              @click="() => handleSkipPomodoro()"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="flex justify-center mt-4">
      <p>Today Completed #{{ pomodoroFocusCompletedToday }}</p>
    </div>
    <div class="max-w-sm w-full mt-4">
      <div class="flex items-center justify-between p-1">
        <p class="text-lg">Tags</p>
        <div>
          <UPopover>
            <UButton icon="i-lucide-menu" color="neutral" variant="outline" />

            <template #content>
              <div class="p-2">
                <UCheckbox
                  v-model="keepTags"
                  label="Keep tags"
                  alt="Keep tags between pomodoros"
                />
              </div>
            </template>
          </UPopover>
        </div>
      </div>
      <USeparator />
      <PomodoroTagSelector
        class="mt-4"
        :initial-tags="currPomodoro?.tags || []"
        @add="handleAddTag"
        @remove="handleRemoveTag"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { usePomodoroStoreRefs } from "~/stores/pomodoro";
import type { TPomodoro } from "~/types/Pomodoro";

const { pomodorosListToday } = usePomodoroStoreRefs();

const keepTags = useKeepSelectedTags();

const pomodoroFocusCompletedToday = computed(() => {
  if (!pomodorosListToday.value) {
    return 0;
  }

  const pl = pomodorosListToday.value;
  return pl.filter(
    (p) => p.type === PomodoroType.FOCUS && p.state == PomodoroState.FINISHED
  ).length;
});

const pomodoroBottonIsPlay = ref(true);

const currentPomodoroType = ref<keyof typeof TagEnumByType>(PomodoroType.FOCUS);

const {
  handleStartPomodoro,
  handlePausePomodoro,
  handleSkipPomodoro,
  handleFinishPomodoro,
  handleListPomodoros,
  handleAddTag,
  handleRemoveTag,
  handleSelectPomodoro,
  currPomodoro,
  timeController,
} = usePomodoroController();

const currentPomodoroId = computed(() => currPomodoro.value?.id);

watch(currentPomodoroId, () => {
  handleListPomodoros();
});

const handlePomodoroTypeChange = (type: keyof typeof TagEnumByType) => {
  if (currPomodoro.value?.type === type) {
    return alert("You are already in " + type);
  }
  handleFinishPomodoro({
    clockInSeconds: PomodoroDurationInSecondsByDefaultCycleConfiguration[type],
    withNext: false,
  }).then(() => {
    handleSelectPomodoro(props.user_id, type);
  });
};

defineShortcuts({
  " ": () => {
    if (currPomodoro.value?.state !== "current") {
      handleStartPomodoro(props.user_id, currPomodoro.value?.type, "current");
      pomodoroBottonIsPlay.value = false;
    } else {
      handlePausePomodoro();
      pomodoroBottonIsPlay.value = true;
    }
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
  currPomodoro,
  () => {
    if (currPomodoro.value?.type) {
      currentPomodoroType.value = currPomodoro.value.type;
    }

    if (currPomodoro.value?.state === "current") {
      pomodoroBottonIsPlay.value = false;
    } else {
      pomodoroBottonIsPlay.value = true;
    }
    localStorage.setItem("currPomodoro", JSON.stringify(currPomodoro.value));
  },
  { deep: true }
);
</script>
