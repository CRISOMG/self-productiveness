<script setup lang="ts">
import type { FormError, FormSubmitEvent } from "@nuxt/ui";
import type { EmailOtpType } from "@supabase/supabase-js";

const route = useRoute();
const supabase = useSupabaseClient();

const config = useRuntimeConfig();
const state = reactive({
  password: "",
});

const verifyingOtp = ref(false);
onMounted(async () => {
  const token_hash = route.query.token_hash as string;
  const type = route.query.type as EmailOtpType;

  verifyingOtp.value = true;
  try {
    const { error, data } = await supabase.auth.verifyOtp({ token_hash, type });

    if (error) throw error;
  } catch (e) {
    console.error(isError(e) ? e.message : "Error resetting password.");
  }
  verifyingOtp.value = false;
});

type Schema = typeof state;

function validate(state: Partial<Schema>): FormError[] {
  const errors = [];
  if (!state.password) errors.push({ name: "password", message: "Required" });
  return errors;
}

const toast = useToast();
async function onSubmit(event: FormSubmitEvent<Schema>) {
  const { error, data } = await supabase.auth.updateUser({
    password: event.data.password as unknown as string,
  });

  if (error) {
    toast.add({ title: "Error", description: error.message, color: "error" });
    return;
  } else {
    toast.add({
      title: "Success",
      description: "The form has been submitted.",
      color: "success",
    });
    navigateTo("/dashboard");
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
      <UFormField label="Password" name="password">
        <div class="flex items-center gap-1">
          <UInput v-model="state.password" type="password" />
          <UButton type="submit" icon="i-lucide-send-horizontal" size="md" />
        </div>
      </UFormField>
    </UForm>
  </div>
</template>
