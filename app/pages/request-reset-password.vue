<script setup lang="ts">
import type { FormError, FormSubmitEvent } from "@nuxt/ui";
import * as z from "zod";

const supabase = useSupabaseClient();
const toast = useToast();

const schema = z.object({
  email: z.email("Invalid email"),
});

type Schema = z.output<typeof schema>;

const state = reactive({
  email: "",
});

async function onSubmit(event: FormSubmitEvent<Schema>) {
  const { error } = await supabase.auth.resetPasswordForEmail(
    event.data.email,
    { redirectTo: `${window.location.origin}/update-password` }
  );
  if (error) {
    toast.add({ title: "Error", description: error.message, color: "error" });
    return;
  } else {
    toast.add({
      title: "Success",
      description: "check your email for the reset link.",
      color: "success",
    });
    navigateTo("/login");
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center h-screen gap-4 p-4">
    <UPageCard class="w-full max-w-sm">
      <div class="flex flex-col gap-4">
        <div class="text-center">
          <h1 class="text-2xl font-bold">Reset Password</h1>
          <p class="text-muted">Enter your email to receive a reset link.</p>
        </div>
        <UForm
          :schema="schema"
          :state="state"
          class="space-y-4 flex flex-col items-center justify-center"
          @submit="onSubmit"
        >
          <UFormField class="w-fit" label="Email" name="email">
            <UInput
              v-model="state.email"
              type="email"
              placeholder="Enter your email"
              icon="i-lucide-mail"
            />
          </UFormField>

          <UButton class="w-fit" type="submit" block :loading="false">
            Send Reset Link
          </UButton>
        </UForm>
      </div>
      <div class="mt-4 text-center">
        <ULink
          to="/login"
          class="text-sm text-primary font-medium hover:underline"
        >
          Back to Login
        </ULink>
      </div>
    </UPageCard>
  </div>
</template>
