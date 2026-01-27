<template>
  <div class="audio-recorder">
    <!-- Recovery Modal -->
    <UModal v-model:open="showRecoveryModal" title="Grabación recuperada">
      <template #body>
        <div class="flex flex-col gap-4 p-4">
          <p class="text-sm text-muted">
            Se detectó una grabación interrumpida. ¿Deseas recuperarla?
          </p>
          <div class="flex gap-2">
            <UButton
              color="primary"
              @click="handleAcceptRecovery"
              class="flex-1"
            >
              Recuperar
            </UButton>
            <UButton
              color="neutral"
              variant="ghost"
              @click="handleDiscardRecovery"
              class="flex-1"
            >
              Descartar
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Duration Warning Toast -->
    <div
      v-if="status === 'recording' && showDurationWarning"
      class="fixed top-4 right-4 bg-yellow-500 text-black px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2"
    >
      <UIcon name="i-lucide-alert-triangle" class="size-5" />
      <span class="text-sm font-medium"
        >La grabación se detendrá en 5 minutos</span
      >
    </div>

    <!-- Idle State: Record Button -->
    <UButton
      v-if="status === 'idle'"
      size="xs"
      color="neutral"
      variant="ghost"
      icon="i-lucide-mic"
      :loading="isStarting"
      @click="handleStartRecording"
    />

    <!-- Recording State -->
    <div
      v-else-if="status === 'recording' || status === 'paused'"
      class="flex items-center gap-2"
    >
      <!-- Recording indicator -->
      <div class="flex items-center gap-2 px-2 py-1 rounded-lg bg-red-500/10">
        <div
          class="size-2 rounded-full bg-red-500"
          :class="{ 'animate-pulse': status === 'recording' }"
        />
        <span class="text-sm font-mono text-red-500">{{
          formattedDuration
        }}</span>
      </div>

      <!-- Pause/Resume -->
      <UButton
        v-if="status === 'recording'"
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

      <!-- Stop -->
      <UButton
        size="xs"
        color="error"
        variant="solid"
        icon="i-lucide-square"
        @click="handleStopRecording"
      />

      <!-- Wake Lock indicator -->
      <UTooltip v-if="isWakeLockActive" text="Pantalla activa">
        <UIcon name="i-lucide-sun" class="size-4 text-yellow-500" />
      </UTooltip>
    </div>

    <!-- Pending Upload State -->
    <div
      v-else-if="status === 'pending_upload'"
      class="flex items-center gap-2"
    >
      <!-- Audio player -->
      <audio
        v-if="audioUrl"
        ref="audioPlayerRef"
        :src="audioUrl"
        class="hidden"
        @ended="isPlaying = false"
      />

      <!-- Duration badge -->
      <UBadge color="neutral" variant="subtle" size="sm">
        {{ formattedDuration }}
      </UBadge>

      <!-- Play/Pause audio -->
      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        :icon="isPlaying ? 'i-lucide-pause' : 'i-lucide-play'"
        @click="togglePlayback"
      />

      <!-- Discard -->
      <UButton
        size="xs"
        color="error"
        variant="ghost"
        icon="i-lucide-trash-2"
        @click="handleDiscard"
      />

      <!-- Send -->
      <UButton
        size="xs"
        color="primary"
        variant="solid"
        icon="i-lucide-send"
        :loading="isUploading"
        @click="handleSend"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GoogleDriveFile } from "~~/shared/utils/file";

interface AudioUploadResponse {
  audio?: GoogleDriveFile;
  text?: GoogleDriveFile;
  message?: string;
}

const emit = defineEmits<{
  uploaded: [response: AudioUploadResponse];
  error: [message: string];
}>();

const config = useRuntimeConfig();
const user = useSupabaseUser();

const {
  status,
  formattedDuration,
  audioUrl,
  showDurationWarning,
  hasRecovery,
  isWakeLockActive,
  startRecording,
  stopRecording,
  pauseRecording,
  resumeRecording,
  discardRecording,
  getAudioBlob,
  clearAfterUpload,
  getFileExtension,
  acceptRecovery,
  discardRecovery,
} = useAudioRecorder();

// Local state
const isStarting = ref(false);
const isUploading = ref(false);
const isPlaying = ref(false);
const showRecoveryModal = ref(false);
const audioPlayerRef = ref<HTMLAudioElement | null>(null);

// Watch for recovery
watch(
  hasRecovery,
  (hasRecovery) => {
    if (hasRecovery) {
      showRecoveryModal.value = true;
    }
  },
  { immediate: true },
);

// Start recording
async function handleStartRecording() {
  isStarting.value = true;
  try {
    const success = await startRecording();
    if (!success) {
      emit("error", "No se pudo acceder al micrófono");
    }
  } finally {
    isStarting.value = false;
  }
}

// Stop recording
async function handleStopRecording() {
  await stopRecording();
}

// Toggle audio playback
function togglePlayback() {
  if (!audioPlayerRef.value) return;

  if (isPlaying.value) {
    audioPlayerRef.value.pause();
    isPlaying.value = false;
  } else {
    audioPlayerRef.value.play();
    isPlaying.value = true;
  }
}

// Discard recording
async function handleDiscard() {
  if (isPlaying.value && audioPlayerRef.value) {
    audioPlayerRef.value.pause();
    isPlaying.value = false;
  }
  await discardRecording();
}

// Send recording
async function handleSend() {
  isUploading.value = true;

  try {
    const blob = await getAudioBlob();
    if (!blob) {
      emit("error", "No hay audio para enviar");
      return;
    }

    const extension = getFileExtension();
    const fileName = `audio-${Date.now()}.${extension}`;
    const file = new File([blob], fileName, { type: blob.type });

    const formData = new FormData();
    formData.append("data", file);
    formData.append("user_id", user.value?.sub || "");

    const response = await $fetch<AudioUploadResponse[]>(
      config.public.n8nGoogleDriveInboxWebhookUrl,
      {
        method: "POST",
        headers: {
          Authorization: config.public.n8nAuthHeader,
        },
        body: formData,
      },
    );

    const result = response?.[0];

    if (result?.audio) {
      emit("uploaded", result);
      await clearAfterUpload();
    } else {
      emit("error", "Error al subir el audio");
    }
  } catch (error) {
    console.error("Upload error:", error);
    emit("error", "Error al subir el audio");
  } finally {
    isUploading.value = false;
  }
}

// Accept recovery
async function handleAcceptRecovery() {
  await acceptRecovery();
  showRecoveryModal.value = false;
}

// Discard recovery
async function handleDiscardRecovery() {
  await discardRecovery();
  showRecoveryModal.value = false;
}
</script>

<style scoped>
.audio-recorder {
  display: inline-flex;
  align-items: center;
}
</style>
