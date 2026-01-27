/**
 * Audio Recorder Composable
 *
 * Robust audio recording with:
 * - IndexedDB persistence for crash recovery
 * - Wake Lock API to keep screen on
 * - Chunked recording to prevent memory issues
 * - Support for 5-60 min recordings (max 80MB)
 */

// ============================================================
// TYPES
// ============================================================

export type AudioRecorderStatus =
  | "idle"
  | "recording"
  | "paused"
  | "pending_upload";

export interface AudioSession {
  id: string;
  status: AudioRecorderStatus;
  createdAt: number;
  mimeType: string;
  duration?: number;
}

export interface AudioChunk {
  sessionId: string;
  blob: Blob;
  timestamp: number;
}

export interface RecoveryInfo {
  sessionId: string;
  status: AudioRecorderStatus;
  createdAt: number;
  chunkCount: number;
}

// ============================================================
// CONSTANTS
// ============================================================

const DB_NAME = "AudioRecorderDB";
const DB_VERSION = 1;
const CHUNK_INTERVAL_MS = 3000; // 3 seconds per chunk
const MAX_DURATION_MS = 60 * 60 * 1000; // 60 minutes
const WARNING_DURATION_MS = 55 * 60 * 1000; // 55 minutes
const MAX_SIZE_BYTES = 80 * 1024 * 1024; // 80MB

// ============================================================
// INDEXEDDB LAYER
// ============================================================

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains("sessions")) {
        db.createObjectStore("sessions", { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains("chunks")) {
        const chunkStore = db.createObjectStore("chunks", {
          autoIncrement: true,
        });
        chunkStore.createIndex("sessionId", "sessionId", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveSession(session: AudioSession): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["sessions"], "readwrite");
    const store = tx.objectStore("sessions");
    const request = store.put(session);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getSession(sessionId: string): Promise<AudioSession | null> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(["sessions"], "readonly");
    const store = tx.objectStore("sessions");
    const request = store.get(sessionId);
    request.onsuccess = () => resolve(request.result || null);
  });
}

async function saveChunk(sessionId: string, blob: Blob): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["chunks"], "readwrite");
    const store = tx.objectStore("chunks");
    const chunk: AudioChunk = { sessionId, blob, timestamp: Date.now() };
    const request = store.add(chunk);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getSessionChunks(sessionId: string): Promise<Blob[]> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(["chunks"], "readonly");
    const store = tx.objectStore("chunks");
    const index = store.index("sessionId");
    const request = index.getAll(sessionId);

    request.onsuccess = () => {
      const sorted = (request.result as AudioChunk[]).sort(
        (a, b) => a.timestamp - b.timestamp,
      );
      resolve(sorted.map((item) => item.blob));
    };
  });
}

async function getActiveSession(): Promise<AudioSession | null> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(["sessions"], "readonly");
    const store = tx.objectStore("sessions");
    const request = store.getAll();

    request.onsuccess = () => {
      const sessions = request.result as AudioSession[];
      const active = sessions.find(
        (s) => s.status === "recording" || s.status === "pending_upload",
      );
      resolve(active || null);
    };
  });
}

async function deleteSession(sessionId: string): Promise<void> {
  const db = await openDB();

  // Delete session
  await new Promise<void>((resolve) => {
    const tx = db.transaction(["sessions"], "readwrite");
    const store = tx.objectStore("sessions");
    store.delete(sessionId);
    tx.oncomplete = () => resolve();
  });

  // Delete all chunks for this session
  await new Promise<void>((resolve) => {
    const tx = db.transaction(["chunks"], "readwrite");
    const store = tx.objectStore("chunks");
    const index = store.index("sessionId");
    const request = index.openCursor(IDBKeyRange.only(sessionId));

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    tx.oncomplete = () => resolve();
  });
}

async function countSessionChunks(sessionId: string): Promise<number> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(["chunks"], "readonly");
    const store = tx.objectStore("chunks");
    const index = store.index("sessionId");
    const request = index.count(sessionId);
    request.onsuccess = () => resolve(request.result);
  });
}

// ============================================================
// COMPOSABLE
// ============================================================

export function useAudioRecorder() {
  // State
  const status = ref<AudioRecorderStatus>("idle");
  const currentSessionId = ref<string | null>(null);
  const recordingStartTime = ref<number | null>(null);
  const recordingDuration = ref(0);
  const audioBlob = ref<Blob | null>(null);
  const audioUrl = ref<string | null>(null);
  const totalSize = ref(0);
  const showDurationWarning = ref(false);

  // Recovery
  const hasRecovery = ref(false);
  const recoveryInfo = ref<RecoveryInfo | null>(null);

  // Wake Lock
  const wakeLock = ref<WakeLockSentinel | null>(null);
  const isWakeLockActive = computed(() => wakeLock.value !== null);

  // Private refs
  let mediaRecorder: MediaRecorder | null = null;
  let stream: MediaStream | null = null;
  let durationInterval: ReturnType<typeof setInterval> | null = null;
  let mimeType = "";

  // Get supported MIME type
  function getSupportedMimeType(): string {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg",
    ];
    return types.find((t) => MediaRecorder.isTypeSupported(t)) || "";
  }

  // Request Wake Lock
  async function requestWakeLock(): Promise<void> {
    if (!("wakeLock" in navigator)) {
      console.warn("Wake Lock API not supported");
      return;
    }

    try {
      wakeLock.value = await navigator.wakeLock.request("screen");
      wakeLock.value.addEventListener("release", () => {
        wakeLock.value = null;
      });
    } catch (err) {
      console.warn("Could not acquire wake lock:", err);
    }
  }

  // Release Wake Lock
  async function releaseWakeLock(): Promise<void> {
    if (wakeLock.value) {
      await wakeLock.value.release();
      wakeLock.value = null;
    }
  }

  // Start duration timer
  function startDurationTimer(): void {
    recordingStartTime.value = Date.now();
    durationInterval = setInterval(() => {
      if (recordingStartTime.value) {
        recordingDuration.value = Date.now() - recordingStartTime.value;

        // Warning at 55 minutes
        if (
          recordingDuration.value >= WARNING_DURATION_MS &&
          !showDurationWarning.value
        ) {
          showDurationWarning.value = true;
        }

        // Auto-stop at 60 minutes
        if (recordingDuration.value >= MAX_DURATION_MS) {
          stopRecording();
        }
      }
    }, 1000);
  }

  // Stop duration timer
  function stopDurationTimer(): void {
    if (durationInterval) {
      clearInterval(durationInterval);
      durationInterval = null;
    }
  }

  // Cleanup stream
  function cleanupStream(): void {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }
  }

  // Start recording
  async function startRecording(): Promise<boolean> {
    try {
      // Request microphone permission with audio processing disabled
      // This preserves background sounds and prevents auto volume adjustments
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      mimeType = getSupportedMimeType();
      if (!mimeType) {
        throw new Error("No supported audio MIME type found");
      }

      // Create new session
      const sessionId = crypto.randomUUID();
      currentSessionId.value = sessionId;
      totalSize.value = 0;
      showDurationWarning.value = false;

      await saveSession({
        id: sessionId,
        status: "recording",
        createdAt: Date.now(),
        mimeType,
      });

      // Create MediaRecorder with chunking
      mediaRecorder = new MediaRecorder(stream, { mimeType });

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data && event.data.size > 0) {
          totalSize.value += event.data.size;

          // Check size limit
          if (totalSize.value >= MAX_SIZE_BYTES) {
            stopRecording();
            return;
          }

          await saveChunk(sessionId, event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        cleanupStream();
        stopDurationTimer();
        await releaseWakeLock();

        if (currentSessionId.value) {
          await saveSession({
            id: currentSessionId.value,
            status: "pending_upload",
            createdAt: Date.now(),
            mimeType,
            duration: recordingDuration.value,
          });
          status.value = "pending_upload";

          // Build audio blob for preview
          await buildAudioBlob();
        }
      };

      // Start recording with chunk interval
      mediaRecorder.start(CHUNK_INTERVAL_MS);
      status.value = "recording";

      // Request wake lock and start timer
      await requestWakeLock();
      startDurationTimer();

      return true;
    } catch (error) {
      console.error("Error starting recording:", error);
      cleanupStream();
      return false;
    }
  }

  // Stop recording
  async function stopRecording(): Promise<void> {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
  }

  // Pause recording
  function pauseRecording(): void {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.pause();
      status.value = "paused";
      stopDurationTimer();
    }
  }

  // Resume recording
  function resumeRecording(): void {
    if (mediaRecorder && mediaRecorder.state === "paused") {
      mediaRecorder.resume();
      status.value = "recording";
      startDurationTimer();
    }
  }

  // Build audio blob from chunks
  async function buildAudioBlob(): Promise<Blob | null> {
    if (!currentSessionId.value) return null;

    const chunks = await getSessionChunks(currentSessionId.value);
    if (chunks.length === 0) return null;

    const blob = new Blob(chunks, { type: mimeType || "audio/webm" });
    audioBlob.value = blob;

    // Create URL for audio element
    if (audioUrl.value) {
      URL.revokeObjectURL(audioUrl.value);
    }
    audioUrl.value = URL.createObjectURL(blob);

    return blob;
  }

  // Get audio blob
  async function getAudioBlob(): Promise<Blob | null> {
    if (audioBlob.value) return audioBlob.value;
    return buildAudioBlob();
  }

  // Discard recording
  async function discardRecording(): Promise<void> {
    if (currentSessionId.value) {
      await deleteSession(currentSessionId.value);
    }

    if (audioUrl.value) {
      URL.revokeObjectURL(audioUrl.value);
    }

    currentSessionId.value = null;
    audioBlob.value = null;
    audioUrl.value = null;
    recordingDuration.value = 0;
    totalSize.value = 0;
    status.value = "idle";
    hasRecovery.value = false;
    recoveryInfo.value = null;
  }

  // Check for recovery on mount
  async function checkRecovery(): Promise<
    "recovered_from_crash" | "restored_pending" | null
  > {
    const activeSession = await getActiveSession();

    if (activeSession) {
      const chunkCount = await countSessionChunks(activeSession.id);

      if (chunkCount === 0) {
        // Empty session, clean up
        await deleteSession(activeSession.id);
        return null;
      }

      currentSessionId.value = activeSession.id;
      mimeType = activeSession.mimeType;

      recoveryInfo.value = {
        sessionId: activeSession.id,
        status: activeSession.status,
        createdAt: activeSession.createdAt,
        chunkCount,
      };

      if (activeSession.status === "recording") {
        // Crashed while recording
        await saveSession({
          ...activeSession,
          status: "pending_upload",
        });
        hasRecovery.value = true;
        return "recovered_from_crash";
      } else if (activeSession.status === "pending_upload") {
        hasRecovery.value = true;
        return "restored_pending";
      }
    }

    return null;
  }

  // Accept recovery
  async function acceptRecovery(): Promise<void> {
    if (recoveryInfo.value) {
      status.value = "pending_upload";
      await buildAudioBlob();
      hasRecovery.value = false;
    }
  }

  // Discard recovery
  async function discardRecovery(): Promise<void> {
    await discardRecording();
  }

  // Clear after successful upload
  async function clearAfterUpload(): Promise<void> {
    await discardRecording();
  }

  // Formatted duration
  const formattedDuration = computed(() => {
    const totalSeconds = Math.floor(recordingDuration.value / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  });

  // Get file extension from mime type
  function getFileExtension(): string {
    if (mimeType.includes("webm")) return "webm";
    if (mimeType.includes("mp4")) return "m4a";
    if (mimeType.includes("ogg")) return "ogg";
    return "webm";
  }

  // Lifecycle
  onMounted(async () => {
    await checkRecovery();
  });

  onUnmounted(async () => {
    stopDurationTimer();
    cleanupStream();
    await releaseWakeLock();
  });

  return {
    // State
    status: readonly(status),
    currentSessionId: readonly(currentSessionId),
    recordingDuration: readonly(recordingDuration),
    formattedDuration,
    audioBlob: readonly(audioBlob),
    audioUrl: readonly(audioUrl),
    totalSize: readonly(totalSize),
    showDurationWarning: readonly(showDurationWarning),

    // Recovery
    hasRecovery: readonly(hasRecovery),
    recoveryInfo: readonly(recoveryInfo),

    // Wake Lock
    isWakeLockActive,

    // Actions
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    discardRecording,
    getAudioBlob,
    clearAfterUpload,
    getFileExtension,

    // Recovery actions
    acceptRecovery,
    discardRecovery,
  };
}
