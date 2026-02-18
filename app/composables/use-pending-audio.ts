/**
 * Shared state for passing pending audio from the bottom navbar
 * to the chat container via Nuxt useState (global reactive state).
 */

export interface PendingAudioData {
  audio?: {
    path: string;
    name: string;
    url: string;
    mimeType: string;
  };
  text?: {
    path: string;
    name: string;
    url: string;
    mimeType: string;
  };
  formatted_id?: string;
}

export function usePendingAudio() {
  const pendingAudio = useState<PendingAudioData | null>(
    "pending-audio",
    () => null,
  );

  function setPendingAudio(data: PendingAudioData) {
    pendingAudio.value = data;
  }

  function consumePendingAudio(): PendingAudioData | null {
    const data = pendingAudio.value;
    if (data) {
      pendingAudio.value = null;
    }
    return data;
  }

  return {
    pendingAudio: readonly(pendingAudio),
    setPendingAudio,
    consumePendingAudio,
  };
}
