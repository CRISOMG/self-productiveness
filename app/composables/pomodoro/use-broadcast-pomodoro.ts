import { type RealtimeChannel } from "@supabase/supabase-js";

type TBroadcastEvents = {
  onPlay: (payload: any) => void;
  onPause: (payload: any) => void;
  onFinish: (payload: any) => void;
  onSkip: (payload: any) => void;
  onNext: (payload: any) => void;
};

export const useBroadcastPomodoro = (handlers: TBroadcastEvents) => {
  const supabase = useSupabaseClient();
  const { profile } = useProfileController();

  // Estados globales para mantener la conexión viva entre navegaciones
  const channel = useState<RealtimeChannel | undefined>(
    "pomodoro_broadcast_channel",
  );
  const deviceId = useState<string>("pomodoro_device_id", () =>
    globalThis.crypto.randomUUID(),
  );
  const isMainHandler = useState<boolean>(
    "pomodoro_is_main_handler",
    () => false,
  );
  const connectionStatus = useState<"idle" | "connected" | "error">(
    "pomodoro_broadcast_status",
    () => "idle",
  );
  const connectionError = useState<string | null>(
    "pomodoro_broadcast_error",
    () => null,
  );

  const broadcastEvent = async (event: string, payload: any) => {
    if (channel.value) {
      await channel.value.send({
        type: "broadcast",
        event,
        payload,
      });
    }
  };

  const handlePresenceSync = () => {
    const state = channel.value?.presenceState();
    if (!state) return;

    const presences: any[] = [];
    Object.values(state).forEach((p: any) => presences.push(...p));

    // Ordenar por antigüedad (el más viejo es el "host" o main handler)
    presences.sort(
      (a, b) =>
        new Date(a.online_at).getTime() - new Date(b.online_at).getTime(),
    );

    if (presences.length > 0) {
      isMainHandler.value = presences[0].deviceId === deviceId.value;
    }
  };

  const initChannel = () => {
    if (!profile.value?.id || channel.value) return;

    channel.value = supabase.channel(`pomodoro_sync:${profile.value.id}`, {
      config: { private: true, broadcast: { self: false } },
    });

    channel.value
      .on("broadcast", { event: "pomodoro:play" }, handlers.onPlay)
      .on("broadcast", { event: "pomodoro:pause" }, handlers.onPause)
      .on("broadcast", { event: "pomodoro:finish" }, handlers.onFinish)
      .on("broadcast", { event: "pomodoro:skip" }, handlers.onSkip)
      .on("broadcast", { event: "pomodoro:next" }, handlers.onNext)
      .on("presence", { event: "sync" }, handlePresenceSync)
      .subscribe(async (status, err) => {
        if (status === "SUBSCRIBED") {
          connectionStatus.value = "connected";
          connectionError.value = null;
          await channel.value?.track({
            deviceId: deviceId.value,
            online_at: new Date().toISOString(),
          });
        }
        if (status === "CHANNEL_ERROR") {
          console.error("❌ Error en el canal de broadcast:", err);
          connectionStatus.value = "error";
          connectionError.value =
            err?.message || "Error de conexión en el canal de sincronización";
          // Asegurar que isMainHandler sea true cuando falla el canal
          // para que el flujo de crear siguiente pomodoro no se bloquee
          isMainHandler.value = true;
        }
      });
  };

  const disconnect = async () => {
    if (channel.value) {
      // await channel.value?.unsubscribe();
      supabase.removeChannel(channel.value);
      channel.value = undefined;
    }
  };

  // Reactividad: Iniciar cuando haya perfil
  watch(
    profile,
    (newProfile) => {
      if (newProfile) initChannel();
    },
    { immediate: true },
  );

  // Limpieza automática
  onUnmounted(() => {
    disconnect();
  });

  return {
    broadcastEvent,
    isMainHandler,
    connectionStatus,
    connectionError,
    disconnect,
    channel,
  };
};
