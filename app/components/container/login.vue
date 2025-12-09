<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent, AuthFormField } from "@nuxt/ui";

const authController = useAuthController();

const toast = useToast();

const fields: AuthFormField[] = [
  {
    name: "email",
    type: "email",
    label: "Email",
    placeholder: "Enter your email",
    required: true,
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    placeholder: "Enter your password",
    required: true,
  },
  // {
  //   name: "remember",
  //   label: "Remember me",
  //   type: "checkbox",
  // },
];

const providers = [
  {
    label: "Google",
    icon: "i-simple-icons-google",
    onClick: () => {
      authController.handleLoginWithGoogle();
    },
  },
  {
    label: "GitHub",
    icon: "i-simple-icons-github",
    onClick: () => {
      authController.handleLoginWithGithub();
    },
  },
];

const schema = z.object({
  email: z.email("Invalid email"),
  password: z
    .string("Password is required")
    .min(8, "Must be at least 8 characters"),
});

type Schema = z.output<typeof schema>;

function onSubmit(payload: FormSubmitEvent<Schema>) {
  console.log("Submitted", payload);
  authController.handleLogin(payload.data);
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4">
    <UPageCard class="w-full max-w-md">
      <UAuthForm
        :schema="schema"
        title="Login"
        description="Enter your credentials to access your account."
        icon="i-lucide-user"
        :fields="fields"
        :providers="providers"
        @submit="onSubmit"
      />
      <div>
        <div class="flex flex-col gap-2 text-center">
          <ULink
            to="/request-reset-password"
            class="text-sm text-primary font-medium hover:underline"
          >
            Forgot your password?
          </ULink>
          <p class="text-base text-pretty text-muted">
            Don't have an account?
            <ULink
              to="/sign-up"
              class="text-primary font-medium hover:underline"
              >Sign up</ULink
            >
          </p>
        </div>
      </div>
    </UPageCard>
  </div>
</template>
