import { useAuthStore } from "~/stores/auth";

let listenerRegistered = false;

export default defineNuxtRouteMiddleware(() => {
  if (listenerRegistered) return;
  listenerRegistered = true;

  const supabase = useSupabaseClient();

  const authStore = useAuthStore();
  const authStoreRefs = storeToRefs(authStore);

  supabase.auth.onAuthStateChange((event, session) => {
    authStoreRefs.eventSessionLogs.value[event] = session;
    authStoreRefs.user.value = session?.user;
  });
});
