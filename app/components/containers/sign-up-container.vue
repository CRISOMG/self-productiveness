<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent, AuthFormField } from "@nuxt/ui";

const authController = useAuthController();

const toast = useToast();

const fields: AuthFormField[] = [
  {
    name: "username",
    type: "text",
    label: "Username",
    placeholder: "Enter your username",
    required: true,
  },
  {
    name: "fullname",
    type: "text",
    label: "Full name",
    placeholder: "Enter your full name",
    required: true,
  },
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
  {
    name: "confirmPassword",
    label: "Confirm Password",
    type: "password",
    placeholder: "Confirm your password",
    required: true,
  },
  //   {
  //     name: "remember",
  //     label: "Remember me",
  //     type: "checkbox",
  //   },
];

const providers = [
  //   {
  //     label: "Google",
  //     icon: "i-simple-icons-google",
  //     onClick: () => {
  //       toast.add({ title: "Google", description: "Login with Google" });
  //     },
  //   },
  //   {
  //     label: "GitHub",
  //     icon: "i-simple-icons-github",
  //     onClick: () => {
  //       toast.add({ title: "GitHub", description: "Login with GitHub" });
  //     },
  //   },
];

const schema = z
  .object({
    username: z.string("Username is Required"),
    fullname: z.string("Full name is Required"),
    email: z.email("Invalid email"),
    password: z
      .string("Password is required")
      .min(8, "Must be at least 8 characters"),
    confirmPassword: z.string("Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type Schema = z.output<typeof schema>;

function onSubmit(payload: FormSubmitEvent<Schema>) {
  console.log("Submitted", payload);
  authController.handleSignUp(payload.data);
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4">
    <UPageCard class="w-full max-w-md">
      <UAuthForm
        :schema="schema"
        title="Sign Up"
        description="Enter your credentials to sign up."
        icon="i-lucide-user"
        :fields="fields"
        :providers="providers"
        @submit="onSubmit"
      />
      <div>
        <p>
          Do you have an account?
          <ULink as="button" to="/login">Login</ULink>
        </p>
      </div>
    </UPageCard>
  </div>
</template>
