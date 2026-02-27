<script setup lang="ts">
import ScheduledNotificationsTab from "~/components/notifications/ScheduledNotificationsTab.vue";

const tabItems = [
  { label: "Dispositivos", icon: "i-lucide-smartphone", slot: "devices" },
  { label: "Programadas", icon: "i-lucide-calendar-clock", slot: "scheduled" },
];

const open = defineModel<boolean>({ default: false });

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const pushNotifications = usePushNotifications();

// List of user's subscriptions
const subscriptions = ref<
  Array<{
    id: string;
    device_info: string | null;
    created_at: string | null;
  }>
>([]);
const loadingList = ref(false);

// Fetch subscriptions
async function fetchSubscriptions() {
  if (!user.value) return;
  loadingList.value = true;
  try {
    const { data } = await supabase
      .from("push_subscriptions")
      .select("id, device_info, created_at")
      .eq("user_id", user.value.sub)
      .order("created_at", { ascending: false });
    subscriptions.value = data || [];
  } catch (e) {
    console.error("Error fetching subscriptions:", e);
  } finally {
    loadingList.value = false;
  }
}

// Delete a subscription
async function deleteSubscription(id: string) {
  try {
    await supabase.from("push_subscriptions").delete().eq("id", id);
    subscriptions.value = subscriptions.value.filter((s) => s.id !== id);
  } catch (e) {
    console.error("Error deleting subscription:", e);
  }
}

// Subscribe current device
async function subscribeDevice() {
  const success = await pushNotifications.subscribe();
  if (success) {
    await fetchSubscriptions();
  }
}

// Format device info for display
function formatDevice(deviceInfo: string | null): string {
  if (!deviceInfo) return "Dispositivo desconocido";
  if (deviceInfo.includes("Mobile")) return "📱 Móvil";
  if (deviceInfo.includes("Android")) return "📱 Android";
  if (deviceInfo.includes("iPhone") || deviceInfo.includes("iPad"))
    return "📱 iOS";
  if (deviceInfo.includes("Windows")) return "💻 Windows";
  if (deviceInfo.includes("Mac")) return "💻 Mac";
  if (deviceInfo.includes("Linux")) return "💻 Linux";
  return "🖥️ Navegador";
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("es", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Load when modal opens
watch(open, (isOpen) => {
  if (isOpen) {
    fetchSubscriptions();
    pushNotifications.checkStatus();
  }
});
</script>

<template>
  <UModal
    v-model:open="open"
    title="Push Notifications"
    :ui="{ content: 'sm:max-w-lg' }"
  >
    <template #body>
      <UTabs :items="tabItems" class="w-full">
        <template #devices>
          <div class="space-y-4 pt-4">
            <!-- Status -->
            <div
              v-if="!pushNotifications.isSupported.value"
              class="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-600 text-sm"
            >
              ⚠️ Tu navegador no soporta Push Notifications
            </div>

            <div
              v-else-if="pushNotifications.permissionState.value === 'denied'"
              class="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 text-sm"
            >
              🚫 Has bloqueado las notificaciones. Habilítalas desde la
              configuración del navegador.
            </div>

            <!-- Subscribe button -->
            <div v-else class="flex items-center justify-between">
              <div>
                <p class="font-medium">Este dispositivo</p>
                <p class="text-sm text-neutral-500">
                  {{
                    pushNotifications.isSubscribed.value
                      ? "✅ Suscrito"
                      : "Recibe alertas cuando termine tu Pomodoro"
                  }}
                </p>
              </div>
              <UButton
                v-if="!pushNotifications.isSubscribed.value"
                @click="subscribeDevice"
                :loading="pushNotifications.isLoading.value"
                icon="i-lucide-bell"
                color="primary"
              >
                Activar
              </UButton>
            </div>

            <USeparator />

            <!-- Subscriptions list -->
            <div>
              <p class="font-medium mb-2">Dispositivos suscritos</p>

              <div v-if="loadingList" class="text-center py-4">
                <UIcon name="i-lucide-loader-2" class="animate-spin" />
              </div>

              <div
                v-else-if="subscriptions.length === 0"
                class="text-neutral-500 text-sm py-4 text-center"
              >
                No hay dispositivos suscritos
              </div>

              <div v-else class="space-y-2">
                <div
                  v-for="sub in subscriptions"
                  :key="sub.id"
                  class="flex items-center justify-between p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg"
                >
                  <div>
                    <p class="font-medium">
                      {{ formatDevice(sub.device_info) }}
                    </p>
                    <p class="text-xs text-neutral-500">
                      {{ formatDate(sub.created_at) }}
                    </p>
                  </div>
                  <UButton
                    @click="deleteSubscription(sub.id)"
                    icon="i-lucide-trash-2"
                    color="error"
                    variant="ghost"
                    size="sm"
                  />
                </div>
              </div>
            </div>

            <!-- Error message -->
            <div
              v-if="pushNotifications.error.value"
              class="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 text-sm"
            >
              {{ pushNotifications.error.value }}
            </div>
          </div>
        </template>

        <template #scheduled>
          <ScheduledNotificationsTab />
        </template>
      </UTabs>
    </template>

    <template #footer>
      <div class="flex justify-end">
        <UButton @click="open = false" color="neutral" variant="ghost">
          Cerrar
        </UButton>
      </div>
    </template>
  </UModal>
</template>
