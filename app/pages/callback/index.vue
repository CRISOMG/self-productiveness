<script setup lang="ts">
const supabase = useSupabaseClient();
const route = useRoute();
const router = useRouter();

const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    // Check for OTP verification (magic link flow)
    const token_hash = route.query.token_hash as string;
    const type = route.query.type as string;
    const source = route.query.source as string;

    if (token_hash && type) {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as any,
      });
      if (verifyError) throw verifyError;

      // Redirect to home, preserving source if from landing
      router.push(source ? `/?source=${source}` : "/");
      return;
    }

    // For OAuth flows, the session is handled automatically by @nuxtjs/supabase.
    // Just wait for the user to be available and redirect.
    const user = useSupabaseUser();
    if (user.value) {
      router.push("/");
      return;
    }

    // If no user yet, wait for auth state change
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" || session) {
          listener.subscription.unsubscribe();
          router.push("/");
        }
      },
    );
  } catch (e: any) {
    error.value = e.message || "Error al iniciar sesión.";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="flex items-center justify-center min-h-screen">
    <div v-if="error" class="text-center">
      <p class="text-red-500">{{ error }}</p>
      <NuxtLink to="/landing" class="text-sm underline mt-2 block">
        Volver al inicio
      </NuxtLink>
    </div>
    <div v-else class="text-center">
      <p class="text-muted">Verificando sesión...</p>
    </div>
  </div>
</template>
