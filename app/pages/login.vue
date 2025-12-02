<script setup lang="ts">
import type { FormError, FormSubmitEvent } from "@nuxt/ui";
import { useAuthStore } from "~/stores/auth";
const supabase = useSupabaseClient();

const authStore = useAuthStore();
const authStoreRefs = storeToRefs(authStore);
const config = useRuntimeConfig();
const state = reactive({
  email: config.public.test_email,
  password: undefined,
});
async function signInWithEmail({ email }: { email: string }) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
  });

  return { data, error };
}
async function signInWithEmailPassword({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
}

onMounted(() => {
  supabase.auth.onAuthStateChange((event, session) => {
    authStoreRefs.eventSessionLogs.value[event] = session;
    authStoreRefs.user.value = session?.user;
  });
});

type Schema = typeof state;

function validate(state: Partial<Schema>): FormError[] {
  const errors = [];
  if (!state.email) errors.push({ name: "email", message: "Required" });
  if (!state.password) errors.push({ name: "password", message: "Required" });
  return errors;
}

const toast = useSuccessErrorToast();
async function onSubmit(event: FormSubmitEvent<Schema>) {
  const { data, error } = await signInWithEmailPassword({
    email: event.data.email as unknown as string,
    password: event.data.password as unknown as string,
  });
  if (error) {
    toast.addErrorToast({ title: "Error", description: error.message });
    return;
  } else {
    toast.addSuccessToast({
      title: "Success",
      description: "The form has been submitted.",
    });
    navigateTo("/");
  }
}
</script>

<template>
  <div class="flex items-center justify-center h-screen">
    <UForm
      :validate="validate"
      :state="state"
      class="space-y-4"
      @submit="onSubmit"
    >
      <UFormField label="Email" name="email">
        <UInput v-model="state.email" />
      </UFormField>

      <UFormField label="Password" name="password">
        <UInput v-model="state.password" type="password" />
      </UFormField>
      <UFormField>
        <ULink to="/request-reset-password">reset password</ULink>
      </UFormField>

      <UButton type="submit"> Submit </UButton>
    </UForm>
  </div>
</template>
