<script setup lang="ts">
import type { EmailOtpType } from "@supabase/supabase-js";

const supabase = useSupabaseClient();
const route = useRoute();
const router = useRouter();

const verifyingOtp = ref(false);
const error = ref<string | null>(null);

onMounted(async () => {
  const token_hash = route.query.token_hash as string;
  const type = route.query.type as EmailOtpType;

  if (false && token_hash && type) {
    verifyingOtp.value = true;
    try {
      const { error } = await supabase.auth.verifyOtp({ token_hash, type });
      if (error) throw error;
      router.push("/");
    } catch (e: any) {
      error.value = e.message || "Error logging in.";
    } finally {
      verifyingOtp.value = false;
    }
  } else {
    // For OAuth, the session is handled automatically by the Supabase client.
    // We just wait a brief moment or check for the user.
    const user = useSupabaseUser();
    if (user.value) {
      router.push("/");
    } else {
      // Watch for user change or redirect
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        console.log({ event, session });
        if (event === "SIGNED_IN" || session) {
          router.push("/");
        }
      });
    }
  }
});
</script>

<template>
  <div v-if="verifyingOtp">Verifying...</div>
  <div v-else-if="error">{{ error }}</div>
</template>
