<template>
  <section class="flex flex-col items-center justify-center mt-8">
    <div
      class="flex flex-col items-center justify-center border rounded p-4 px-8 bg-amber-100/5"
    >
      <div class="flex flex-col">
        <div>
          <span
            class="text-md p-2 py-1 rounded-md"
            :class="{
              'bg-black/20': currentPomodoroType === TagType.FOCUS,
            }"
            >Pomodoro</span
          >
          <span
            class="text-md p-2 py-1 rounded-md"
            :class="{
              'bg-black/20': currentPomodoroType === TagType.BREAK,
            }"
            >Short Break</span
          >
          <span
            class="text-md p-2 py-1 rounded-md"
            :class="{
              'bg-black/20': currentPomodoroType === TagType.LONG_BREAK,
            }"
            >Long Break</span
          >
        </div>
        <div class="flex items-center justify-center p-4">
          <h1 class="text-8xl">
            {{ clockInMinutes }}
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
  </section>
</template>

<script setup lang="ts">
const pomodoroBottonIsPlay = ref(true);

const currentPomodoroType = ref<keyof typeof TagEnumByType>(TagType.FOCUS);

const {
  handleStartPomodoro,
  handlePausePomodoro,
  handleResetPomodoro,
  handleSkipPomodoro,
  handleFinishPomodoro,
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
      pomodoroBottonIsPlay.value = false;
    } else {
      handlePausePomodoro();
      pomodoroBottonIsPlay.value = true;
    }
  },
  "1": () => {
    if (currPomodoro.value?.type === TagType.FOCUS) {
      return alert("You are already in focus");
    }
    handleFinishPomodoro({
      clockInSeconds:
        PomodoroDurationInSecondsByDefaultCycleConfiguration[TagIdByType.FOCUS],
      withNext: false,
    }).then(() => {
      handleStartPomodoro(props.user_id, TagType.FOCUS);
    });
  },
  "2": () => {
    if (currPomodoro.value?.type === TagType.BREAK) {
      return alert("You are already in break");
    }
    handleFinishPomodoro({
      clockInSeconds:
        PomodoroDurationInSecondsByDefaultCycleConfiguration[TagIdByType.BREAK],
      withNext: false,
    }).then(() => {
      handleStartPomodoro(props.user_id, TagType.BREAK);
    });
  },
  "3": () => {
    if (currPomodoro.value?.type === TagType.LONG_BREAK) {
      return alert("You are already in break");
    }
    handleFinishPomodoro({
      clockInSeconds:
        PomodoroDurationInSecondsByDefaultCycleConfiguration[
          TagIdByType.LONG_BREAK
        ],
      withNext: false,
    }).then(() => {
      handleStartPomodoro(props.user_id, TagType.LONG_BREAK);
    });
  },
});

const props = defineProps({
  user_id: {
    type: String,
    required: true,
  },
});

watch(currPomodoro, () => {
  if (currPomodoro.value?.type) {
    currentPomodoroType.value = currPomodoro.value.type;
  }

  if (currPomodoro.value?.state === "current") {
    pomodoroBottonIsPlay.value = false;
  } else {
    pomodoroBottonIsPlay.value = true;
  }
  localStorage.setItem("currPomodoro", JSON.stringify(currPomodoro.value));
});

onMounted(() => {
  getCurrentPomodoro();

  handleListPomodoros();
  // TODO: mejorar logica para pausar pomodoro al cerrar la pestaña. se puede usar un websocket para mantener la syncronizacion o pushing en intervalos de tiempo
  window.onbeforeunload = async () => {
    if (import.meta.client) {
      localStorage.setItem("currPomodoro", JSON.stringify(currPomodoro.value));
      if (currPomodoro.value?.state === "current") {
        await handlePausePomodoro();
      }
    }
  };
});
onUnmounted(() => {
  if (timer.value) clearInterval(timer.value);
  window.onbeforeunload = null;
});
</script>
