export const useNotificationController = () => {
  const { profile, handleUpdateProfile } = useProfileController();
  const permission = ref<NotificationPermission | "default">("default");

  // Initialize permission state
  if (import.meta.client && "Notification" in window) {
    permission.value = Notification.permission;
  }

  const isSupported = computed(
    () => import.meta.client && "Notification" in window
  );

  async function requestPermission() {
    if (!isSupported.value) return false;

    const result = await Notification.requestPermission();
    permission.value = result;

    // Sync permission status to settings if profile exists
    if (profile.value && result === "granted") {
      await updateSettings({ notificationsEnabled: true });
    }

    return result === "granted";
  }

  function notify(title: string, options?: NotificationOptions) {
    if (!isSupported.value) return;

    // Check if user has enabled notifications in their settings
    const settings = profile.value?.settings as Record<string, any> | null;
    if (settings?.notificationsEnabled === false) return;

    if (permission.value === "granted") {
      new Notification(title, options);
    } else if (permission.value !== "denied") {
      Notification.requestPermission().then((res) => {
        permission.value = res;
        if (res === "granted") {
          new Notification(title, options);
        }
      });
    }
  }

  async function updateSettings(newSettings: Record<string, any>) {
    const currentSettings =
      (profile.value?.settings as Record<string, any>) || {};
    await handleUpdateProfile({
      settings: { ...currentSettings, ...newSettings },
    });
  }

  return {
    permission,
    isSupported,
    requestPermission,
    notify,
    updateSettings,
  };
};
