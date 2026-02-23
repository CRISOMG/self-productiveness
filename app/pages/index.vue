<template>
  <!-- body -->
  <div class="flex justify-center h-full p-0 w-full min-w-full">
    <div class="">
      <YourfocusTimer :user_id="user_id" />
      <TaskContainer class="mt-4" />
    </div>

    <!-- Chat Drawer: bottom on mobile, right on desktop -->
    <UDrawer
      v-model:open="openChatDrawer"
      :overlay="isMobile"
      :direction="isMobile ? 'bottom' : 'right'"
      :dismissible="false"
      :modal="false"
      :handle="false"
      :ui="{
        content: isMobile
          ? 'w-full max-w-full max-h-[calc(100vh-4rem)] rounded-t-2xl'
          : 'w-full max-w-full mt-auto sm:max-w-[35vw] max-h-[calc(100vh-4rem)]',
        container: 'p-0 m-0 overflow-y-hidden',
      }"
    >
      <!-- Desktop floating button (hidden on mobile since we have bottom nav) -->
      <div class="fixed bottom-4 right-4 hidden sm:block">
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-brain"
          class="rounded-4xl"
          :ui="{
            leadingIcon: 'relative w-12 h-12',
          }"
        />
        <UBadge
          v-if="brainPulse"
          color="neutral"
          variant="soft"
          :ui="{
            base: 'inline-flex items-center gap-1.5 absolute top-5 right-[0.9rem] z-[9999] ',
          }"
        >
          <span class="relative flex h-4 w-4">
            <span
              class="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"
            />
            <span
              class="relative inline-flex rounded-full h-4 w-4 bg-orange-400"
            />
          </span>
        </UBadge>
      </div>

      <template #body>
        <div class="grid grid-rows-[2rem_auto] w-full">
          <div class="flex w-full h-8">
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              @click="openChatDrawer = false"
              class="ml-auto"
            />
          </div>
          <div class="relative">
            <ChatContainer />
          </div>
        </div>
      </template>
    </UDrawer>
  </div>

  <PasswordSetupModal v-model="openPasswordSetupModal" />
  <SpecialOfferModal
    v-model="openSpecialOfferModal"
    @start="handleStartPromotion"
  />

  <!-- Mobile Bottom Navbar -->
  <ClientOnly>
    <Teleport to="body">
      <nav
        v-if="!openChatDrawer && !openSpecialOfferModal && isMobile"
        class="fixed bottom-0 left-0 right-0 z-90 sm:hidden pb-0!"
      >
        <!-- Mic reveal indicator (appears on long press, hidden during recording) -->
        <Transition name="mic-reveal">
          <div>
            <div
              v-if="isLongPressing && recorderStatus === 'idle'"
              ref="micTargetRef"
              class="absolute left-[calc(50%-6px)] -translate-x-1/2 bottom-32 flex flex-col items-center gap-1 pointer-events-none transition-all duration-200"
              :class="[
                isOverMic
                  ? 'scale-125 text-peach-500'
                  : 'scale-100 text-default',
              ]"
            >
              <div
                class="w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-200"
                :class="[
                  isOverMic
                    ? 'bg-peach-500/30 ring-2 ring-peach-500 shadow-lg shadow-peach-500/30'
                    : 'bg-(--ui-bg)/80 ring-1 ring-(--ui-text)/20',
                ]"
              >
                <UIcon name="i-lucide-mic" class="w-7 h-7" />
              </div>
              <span
                class="text-xs font-medium transition-opacity duration-200"
                :class="[
                  isOverMic ? 'opacity-100' : 'opacity-70 animate-pulse',
                ]"
              >
                {{ isOverMic ? "Soltar para activar" : "Desliza hacia arriba" }}
              </span>
            </div>

            <div
              v-if="
                recorderStatus === 'recording' ||
                recorderStatus === 'paused' ||
                isUploading
              "
              ref="micTargetRef"
              class="absolute left-[calc(50%-6px)] -translate-x-1/2 bottom-32 flex flex-col items-center gap-1 transition-all duration-200"
              :class="[
                isOverMic
                  ? 'scale-125 text-peach-500'
                  : 'scale-100 text-default',
              ]"
            >
              <!-- Recording controls (shown when recording) -->
              <div
                v-if="
                  recorderStatus === 'recording' || recorderStatus === 'paused'
                "
                class="flex items-center gap-2 bg-default ring-2 ring-red-500/50 rounded-full px-3 py-2 shadow-lg"
              >
                <!-- Recording indicator + duration -->
                <div class="flex items-center gap-1.5">
                  <div
                    class="w-2.5 h-2.5 rounded-full bg-red-500"
                    :class="{ 'animate-pulse': recorderStatus === 'recording' }"
                  />
                  <span class="text-sm font-mono text-red-500 min-w-[3ch]">
                    {{ formattedDuration }}
                  </span>
                </div>

                <!-- Pause/Resume -->
                <UButton
                  v-if="recorderStatus === 'recording'"
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-pause"
                  @click="pauseRecording"
                />
                <UButton
                  v-else
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-play"
                  @click="resumeRecording"
                />

                <!-- Stop & Send -->
                <UButton
                  size="xs"
                  color="error"
                  variant="solid"
                  icon="i-lucide-square"
                  :loading="isUploading"
                  @click="handleStopAndSend"
                />
              </div>

              <!-- Upload indicator (shown while uploading after stop) -->
              <div
                v-else-if="isUploading"
                class="w-16 h-16 rounded-full flex items-center justify-center bg-default text-default shadow-lg shadow-peach-500/40"
              >
                <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin" />
              </div>
            </div>
          </div>
        </Transition>

        <!-- Navbar bar -->
        <div
          class="flex items-end justify-around px-4 pt-2 pb-6 bg-(--ui-bg)/90 backdrop-blur-xl border-t border-(--ui-text)/10"
        >
          <!-- Notes button -->
          <button
            class="flex flex-col items-center gap-1 text-(--ui-text)/60 hover:text-default transition-colors active:scale-95"
            @click="layoutModals.openNotes()"
          >
            <UIcon name="i-lucide-file-text" class="w-6 h-6" />
            <span class="text-[10px] font-medium">Notes</span>
          </button>

          <!-- Center area: Brain/Mic button OR Recording controls -->
          <div class="relative -mt-5">
            <!-- Default Brain/Mic button -->
            <button
              ref="brainButtonRef"
              class="relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-200"
              :class="[
                isMicMode
                  ? 'bg-peach-500 text-white shadow-peach-500/40'
                  : 'bg-default text-default ring-2 ring-peach-500/50 shadow-peach-500/20',
                isLongPressing ? 'scale-110 ring-peach-500' : '',
              ]"
              @click="handleCenterButtonClick"
              @touchstart.prevent="handleTouchStart"
              @touchmove.prevent="handleTouchMove"
              @touchend.prevent="handleTouchEnd"
              @contextmenu.prevent
            >
              <Transition name="icon-swap" mode="out-in">
                <UIcon
                  v-if="isMicMode"
                  key="mic"
                  name="i-lucide-mic"
                  class="w-8 h-8"
                />
                <UIcon
                  v-else
                  key="brain"
                  name="i-lucide-brain"
                  class="w-8 h-8"
                />
              </Transition>

              <!-- Pulse ring animation when mic is active -->
              <span
                v-if="isMicMode"
                class="absolute inset-0 rounded-full bg-peach-500/30 animate-ping"
              />
            </button>
          </div>

          <!-- Timeline button -->
          <button
            class="flex flex-col items-center gap-1 text-(--ui-text)/60 hover:text-default transition-colors active:scale-95"
            @click="layoutModals.openTimeline()"
          >
            <UIcon name="i-lucide-chart-column" class="w-6 h-6" />
            <span class="text-[10px] font-medium">Timeline</span>
          </button>
        </div>
      </nav>
    </Teleport>
  </ClientOnly>
</template>

<script setup lang="ts">
import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";
import { getAudioStoragePath } from "~~/shared/utils/jornada";
import { useTaskController } from "~/composables/task/use-task-controller";

definePageMeta({
  layout: "default",
});

const { handleStartPomodoro } = usePomodoroController();
const { handleCreateTask } = useTaskController();
const profileController = useProfileController();
const openChatDrawer = ref(false);
const isMicMode = ref(false);
const brainPulse = useBrainPulseState();

async function handleStartPromotion({ name }: { name: string }) {
  // Save the user's name to their profile
  await profileController.handleUpdateProfile({ fullname: name });

  // Insert the welcome AI message in the chat
  await $fetch("/api/chat/welcome", {
    method: "POST",
    body: { name },
  });

  await handleStartPomodoro(
    user_id.value,
    PomodoroType.FOCUS,
    PomodoroState.CURRENT,
  );

  await handleCreateTask(
    "Recupera tu agencia!",
    "- [ ] reportarte con tu segundo cerebro.\n- [ ] crear tu primera bitacora del dia en el chat de tu segundo cerebro.\n- [ ] que tu segundo cerebro registre tu primera tarea y notas respecto a cualquier tema de tu interes en base al procesamiento de tus bitacoras.\n- [ ] hacer tus tareas en menos de 25 minutos y marcarlas como hechas.\n- [ ] repasar tus notas.\n- [ ] iterar.",
    undefined,
    "in_progress",
  );

  brainPulse.value = true;
}

// Layout modal controls via provide/inject
const layoutModals = useLayoutModals();

// Breakpoints
const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = computed(() => !breakpoints.sm.value);

useHead({
  bodyAttrs: {
    class: computed(() =>
      openChatDrawer.value ? "overflow-hidden sm:overflow-auto" : "",
    ),
  },
});

const { handleSetProfileSettingsKey } = useProfileController();
async function handleSetProfileSource(source: string) {
  await handleSetProfileSettingsKey("source", source);
}

onMounted(() => {
  const source = localStorage.getItem("source");
  const s = localStorage.getItem("s");
  if (source || s) {
    handleSetProfileSource(s || source);
    localStorage.removeItem("s");
    localStorage.removeItem("source");
  }
});

const user = useSupabaseUser();
const user_id = computed(() => {
  return user.value?.sub || "";
});

const openPasswordSetupModal = ref(false);
const openSpecialOfferModal = useState("openSpecialOfferModal", () => false);
const route = useRoute();
const router = useRouter();

watch(profileController.profile, () => {
  if (!profileController.profile.value?.has_password) {
    openPasswordSetupModal.value = true;
  }
});

onMounted(() => {
  if (route.query.source === "landing") {
    openSpecialOfferModal.value = true;
    router.replace({ query: {} });
  }

  if (
    profileController.profile.value &&
    !profileController.profile.value?.settings?.offerTermsAccepted
  ) {
    openSpecialOfferModal.value = true;
  }
});

// --- Audio Recording from Navbar ---
const {
  status: recorderStatus,
  formattedDuration,
  startRecording,
  stopRecording,
  pauseRecording,
  resumeRecording,
  getAudioBlob,
  clearAfterUpload,
  getFileExtension,
} = useAudioRecorder();

const supabase = useSupabaseClient();
const { setPendingAudio } = usePendingAudio();
const isUploading = ref(false);
const toast = useToast();

async function activateMicAndRecord() {
  isMicMode.value = true;
  const success = await startRecording();
  if (!success) {
    isMicMode.value = false;
    toast.add({
      description: "No se pudo acceder al micrófono",
      icon: "i-lucide-alert-circle",
      color: "error",
    });
  }
}

async function handleStopAndSend() {
  await stopRecording();

  // Wait a tick for the recorder to build the blob
  await nextTick();

  isUploading.value = true;
  try {
    const blob = await getAudioBlob();
    if (!blob) {
      toast.add({
        description: "No hay audio para enviar",
        icon: "i-lucide-alert-circle",
        color: "error",
      });
      return;
    }

    const userId = user.value?.sub || "";
    const extension = getFileExtension();
    const fileName = `audio-${Date.now()}.${extension}`;
    const storagePath = getAudioStoragePath(userId, fileName);
    const mimeType = blob.type || "audio/webm";

    // 1. Upload to Supabase
    const { error: uploadError } = await supabase.storage
      .from("yourfocus")
      .upload(storagePath, blob, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // 2. Register via API
    const uploadResult = await $fetch<{
      audio?: { path: string; name: string; url: string; mimeType: string };
      text?: { path: string; name: string; url: string; mimeType: string };
      formatted_id?: string;
    }>("/api/audio/upload", {
      method: "POST",
      body: {
        audioPath: storagePath,
        mimeType,
      },
    });

    if (!uploadResult?.audio) {
      throw new Error("Error al registrar el audio");
    }

    // 3. Set pending audio for chat container to consume
    setPendingAudio(uploadResult);

    // 4. Clear recorder state
    await clearAfterUpload();
    isMicMode.value = false;

    // 5. Open chat drawer
    openChatDrawer.value = true;
  } catch (error) {
    console.error("Upload error:", error);
    toast.add({
      description: "Error al subir el audio",
      icon: "i-lucide-alert-circle",
      color: "error",
    });
  } finally {
    recorderStatus.value = "idle";
    isUploading.value = false;
  }
}

// --- Long press + slide to mic logic ---
const brainButtonRef = ref<HTMLButtonElement | null>(null);
const micTargetRef = ref<HTMLDivElement | null>(null);
const isLongPressing = ref(false);
const isOverMic = ref(false);
let longPressTimer: ReturnType<typeof setTimeout> | null = null;
let touchStartY = 0;
let didLongPress = false;

function handleCenterButtonClick() {
  if (isMicMode.value) {
    // If in mic mode but not recording, tapping toggles mic off
    if (recorderStatus.value === "idle") {
      isMicMode.value = false;
    }
    // If recording, tap is ignored (use stop button)
  } else {
    openChatDrawer.value = !openChatDrawer.value;
  }
}

function handleTouchStart(e: TouchEvent) {
  const touch = e.touches[0];
  if (!touch) return;
  touchStartY = touch.clientY;
  isOverMic.value = false;
  didLongPress = false;

  longPressTimer = setTimeout(() => {
    isLongPressing.value = true;
    didLongPress = true;
  }, 400);
}

function handleTouchMove(e: TouchEvent) {
  const touch = e.touches[0];
  if (!touch) return;

  if (!isLongPressing.value) {
    // If finger moves significantly before long press triggers, cancel it
    const dy = touchStartY - touch.clientY;
    if (Math.abs(dy) > 10 && longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
    return;
  }

  // Check if the touch is over the mic target
  const micEl = micTargetRef.value;
  if (micEl) {
    const rect = micEl.getBoundingClientRect();
    const isOver =
      touch.clientX >= rect.left - 20 &&
      touch.clientX <= rect.right + 20 &&
      touch.clientY >= rect.top - 20 &&
      touch.clientY <= rect.bottom + 20;
    isOverMic.value = isOver;
  }
}

function handleTouchEnd() {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }

  if (isLongPressing.value) {
    if (isOverMic.value) {
      // Activate mic mode and start recording
      activateMicAndRecord();
    }
    isLongPressing.value = false;
    isOverMic.value = false;
  } else if (!didLongPress) {
    // Normal tap (short press)
    handleCenterButtonClick();
  }
}

onBeforeUnmount(() => {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
  }
});
</script>

<style scoped>
/* Mic reveal transition */
.mic-reveal-enter-active {
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.mic-reveal-leave-active {
  transition: all 0.15s ease-in;
}
.mic-reveal-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(20px) scale(0.5);
}
.mic-reveal-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px) scale(0.8);
}

/* Icon swap transition */
.icon-swap-enter-active {
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.icon-swap-leave-active {
  transition: all 0.15s ease-in;
}
.icon-swap-enter-from {
  opacity: 0;
  transform: scale(0.5) rotate(-90deg);
}
.icon-swap-leave-to {
  opacity: 0;
  transform: scale(0.5) rotate(90deg);
}

/* Safe area padding for notched phones */
nav {
  padding-bottom: max(env(safe-area-inset-bottom), 1.5rem);
}
</style>
