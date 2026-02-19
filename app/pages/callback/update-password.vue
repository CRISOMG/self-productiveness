<script setup lang="ts">
import type { FormError, FormSubmitEvent } from "@nuxt/ui";
import type { EmailOtpType } from "@supabase/supabase-js";
import * as z from "zod";

const route = useRoute();
const supabase = useSupabaseClient();
const user = useSupabaseUser();
const toast = useToast();

const schema = z.object({
  password: z.string().min(8, "Must be at least 8 characters"),
});

type Schema = z.output<typeof schema>;

const state = reactive({
  password: "",
});

const loading = ref(false);

onMounted(async () => {
  // If we have a hash, we are in the reset password flow
  const token_hash = route.query.token_hash as string;
  const type = route.query.type as EmailOtpType;

  if (token_hash && type) {
    loading.value = true;
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (error) {
      toast.add({
        title: "Error",
        description: "Invalid or expired link.",
        color: "error",
      });
      navigateTo("/login"); // Redirect if invalid
    }
    loading.value = false;
  } else {
    // If no hash, we expect to be logged in
    if (!user.value) {
      navigateTo("/login");
    }
  }
});

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true;
  const { error } = await supabase.auth.updateUser({
    password: event.data.password,
  });
  loading.value = false;

  if (error) {
    toast.add({ title: "Error", description: error.message, color: "error" });
  } else {
    toast.add({
      title: "Success",
      description: "Password updated successfully.",
      color: "success",
    });
    navigateTo("/");
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center h-screen gap-4 p-4">
    <UPageCard class="w-full max-w-sm">
      <div class="flex flex-col gap-4">
        <div class="text-center">
          <h1 class="text-2xl font-bold">Update Password</h1>
          <p class="text-muted">Set your new password.</p>
        </div>

        <UForm
          :schema="schema"
          :state="state"
          class="space-y-4 flex flex-col items-center justify-center"
          @submit="onSubmit"
        >
          <UFormField class="w-fit" label="New Password" name="password">
            <UInput
              v-model="state.password"
              type="password"
              placeholder="Enter new password"
              icon="i-lucide-lock"
            />
          </UFormField>

          <UButton class="w-fit" type="submit" block :loading="loading">
            Update Password
          </UButton>
        </UForm>
      </div>
    </UPageCard>
  </div>
</template>
