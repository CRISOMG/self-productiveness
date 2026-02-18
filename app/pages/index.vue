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
            leadingIcon: 'w-12 h-12',
          }"
        />
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

  <!-- Mobile Bottom Navbar -->
  <Teleport to="body">
    <nav
      v-if="!openChatDrawer && isMobile"
      class="fixed bottom-0 left-0 right-0 z-90 sm:hidden"
    >
      <!-- Mic reveal indicator (appears on long press) -->
      <Transition name="mic-reveal">
        <div
          v-if="isLongPressing"
          ref="micTargetRef"
          class="absolute left-[calc(50%-6px)] -translate-x-1/2 bottom-32 flex flex-col items-center gap-1 pointer-events-none transition-all duration-200"
          :class="[
            isOverMic
              ? 'scale-125 text-peach-500'
              : 'scale-100 text-[var(--ui-text)]',
          ]"
        >
          <div
            class="w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-200"
            :class="[
              isOverMic
                ? 'bg-peach-500/30 ring-2 ring-peach-500 shadow-lg shadow-peach-500/30'
                : 'bg-[var(--ui-bg)]/80 ring-1 ring-[var(--ui-text)]/20',
            ]"
          >
            <UIcon name="i-lucide-mic" class="w-7 h-7" />
          </div>
          <span
            class="text-xs font-medium transition-opacity duration-200"
            :class="[isOverMic ? 'opacity-100' : 'opacity-70 animate-pulse']"
          >
            {{ isOverMic ? "Soltar para activar" : "Desliza hacia arriba" }}
          </span>
        </div>
      </Transition>

      <!-- Navbar bar -->
      <div
        class="flex items-end justify-around px-4 pt-2 pb-6 bg-[var(--ui-bg)]/90 backdrop-blur-xl border-t border-[var(--ui-text)]/10"
      >
        <!-- Notes button -->
        <button
          class="flex flex-col items-center gap-1 text-[var(--ui-text)]/60 hover:text-[var(--ui-text)] transition-colors active:scale-95"
          @click="layoutModals.openNotes()"
        >
          <UIcon name="i-lucide-file-text" class="w-6 h-6" />
          <span class="text-[10px] font-medium">Notes</span>
        </button>

        <!-- Center Brain/Mic button -->
        <div class="relative -mt-5">
          <button
            ref="brainButtonRef"
            class="relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-200"
            :class="[
              isMicMode
                ? 'bg-peach-500 text-white shadow-peach-500/40'
                : 'bg-[var(--ui-bg)] text-[var(--ui-text)] ring-2 ring-peach-500/50 shadow-peach-500/20',
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
              <UIcon v-else key="brain" name="i-lucide-brain" class="w-8 h-8" />
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
          class="flex flex-col items-center gap-1 text-[var(--ui-text)]/60 hover:text-[var(--ui-text)] transition-colors active:scale-95"
          @click="layoutModals.openTimeline()"
        >
          <UIcon name="i-lucide-chart-column" class="w-6 h-6" />
          <span class="text-[10px] font-medium">Timeline</span>
        </button>
      </div>
    </nav>
  </Teleport>
</template>

<script setup lang="ts">
import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";

definePageMeta({
  layout: "default",
});

const profileController = useProfileController();
const openChatDrawer = ref(false);
const isMicMode = ref(false);

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

const user = useSupabaseUser();
const user_id = computed(() => {
  return user.value?.sub || "";
});

const openPasswordSetupModal = ref(false);

watch(profileController.profile, () => {
  if (!profileController.profile.value?.has_password) {
    openPasswordSetupModal.value = true;
  }
});

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
    // If in mic mode, tapping again turns off mic mode
    isMicMode.value = false;
  } else {
    openChatDrawer.value = !openChatDrawer.value;
  }
}

function handleTouchStart(e: TouchEvent) {
  touchStartY = e.touches[0].clientY;
  isOverMic.value = false;
  didLongPress = false;

  longPressTimer = setTimeout(() => {
    isLongPressing.value = true;
    didLongPress = true;
  }, 400);
}

function handleTouchMove(e: TouchEvent) {
  if (!isLongPressing.value) {
    // If finger moves significantly before long press triggers, cancel it
    const dy = touchStartY - e.touches[0].clientY;
    if (Math.abs(dy) > 10 && longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
    return;
  }

  // Check if the touch is over the mic target
  const touch = e.touches[0];
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
      // Activate mic mode
      isMicMode.value = true;
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
