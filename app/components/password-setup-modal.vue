<template>
  <UModal
    :ui="{ content: 'top-60' }"
    :overlay="false"
    v-model:open="isOpen"
    title="Set a Password"
  >
    <template #body>
      <div class="p-4">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          It looks like you are signed in with a social account but haven't set
          a password yet. Setting a password ensures you can always access your
          account with your email.
        </p>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="ghost" @click="isOpen = false"
          >Not Now</UButton
        >
        <UButton color="primary" @click="navigateToUpdate"
          >Set Password</UButton
        >
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const isOpen = defineModel<boolean>({ default: false });

function navigateToUpdate() {
  isOpen.value = false;
  navigateTo("/update-password");
}
</script>
