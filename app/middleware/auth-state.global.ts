import { useAuthStore } from "~/stores/auth";

export default defineNuxtRouteMiddleware(() => {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();

  const authStore = useAuthStore();
  const authStoreRefs = storeToRefs(authStore);

  supabase.auth.onAuthStateChange((event, session) => {
    authStoreRefs.eventSessionLogs.value[event] = session;
    authStoreRefs.user.value = session?.user;
  });
});
