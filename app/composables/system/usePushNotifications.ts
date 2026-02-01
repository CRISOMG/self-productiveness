/**
 * Composable for managing Web Push Notifications
 * Handles subscription, permission, and registration with Supabase
 */

// Helper to convert VAPID key from base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const usePushNotifications = () => {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();
  const config = useRuntimeConfig();

  const isSubscribed = ref(false);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const registration = ref<ServiceWorkerRegistration | null>(null);

  const isSupported = computed(
    () =>
      import.meta.client &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window,
  );

  const permissionState = ref<NotificationPermission>("default");

  // Check current state on mount
  async function checkStatus() {
    if (!isSupported.value || !user.value) return;

    // Update permission state
    permissionState.value = Notification.permission;

    // Check if already registered
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw-push.js");
      if (reg) {
        registration.value = reg;
        const subscription = await reg.pushManager.getSubscription();
        isSubscribed.value = !!subscription;
      }
    } catch (e) {
      console.error("Error checking push status:", e);
    }
  }

  // Subscribe to push notifications
  async function subscribe(): Promise<boolean> {
    if (!isSupported.value) {
      error.value = "Push notifications not supported in this browser";
      return false;
    }

    if (!user.value) {
      error.value = "Must be logged in to enable notifications";
      return false;
    }

    const vapidKey = config.public.vapidPublicKey as string;
    if (!vapidKey) {
      error.value = "VAPID key not configured";
      console.error("Missing VAPID_PUBLIC_KEY in runtime config");
      return false;
    }

    isLoading.value = true;
    error.value = null;

    let subscription: PushSubscription | null = null;

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      permissionState.value = permission;

      if (permission !== "granted") {
        error.value = "Notification permission denied";
        return false;
      }

      // Register service worker
      const reg = await navigator.serviceWorker.register("/sw-push.js");
      await navigator.serviceWorker.ready;
      registration.value = reg;

      // Subscribe to push manager
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      // Save subscription to Supabase
      const { error: dbError } = await supabase
        .from("push_subscriptions")
        .upsert(
          {
            user_id: user.value.sub,
            subscription: subscription.toJSON(),
            device_info: navigator.userAgent.substring(0, 200),
          },
          { onConflict: "user_id,subscription" },
        );

      if (dbError) {
        // Rollback: unsubscribe from PushManager since DB save failed
        await subscription.unsubscribe();
        throw new Error(dbError.message);
      }

      isSubscribed.value = true;
      return true;
    } catch (e) {
      const err = e as Error;
      error.value = err.message;
      console.error("Push subscription error:", err);

      // Ensure we rollback the subscription if it was created
      if (subscription) {
        try {
          await subscription.unsubscribe();
        } catch {
          // Ignore rollback errors
        }
      }

      return false;
    } finally {
      isLoading.value = false;
    }
  }

  // Unsubscribe from push notifications
  async function unsubscribe(): Promise<boolean> {
    if (!registration.value || !user.value) return false;

    isLoading.value = true;
    error.value = null;

    try {
      const subscription =
        await registration.value.pushManager.getSubscription();

      if (subscription) {
        // Remove from Supabase
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("user_id", user.value.sub)
          .eq("subscription", subscription.toJSON());

        // Unsubscribe from push manager
        await subscription.unsubscribe();
      }

      isSubscribed.value = false;
      return true;
    } catch (e) {
      const err = e as Error;
      error.value = err.message;
      console.error("Push unsubscribe error:", err);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  // Initialize on client
  if (import.meta.client) {
    checkStatus();
  }

  return {
    isSupported,
    isSubscribed,
    isLoading,
    error,
    permissionState,
    subscribe,
    unsubscribe,
    checkStatus,
  };
};
