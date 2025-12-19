<template>
  <UModal v-model:open="isOpen" title="Webhook Config">
    <template #body>
      <div class="space-y-4">
        <div class="mt-4">
          <UFormField
            label="Webhook URL"
            help="URL to notify when a pomodoro finishes"
          >
            <UInput
              v-model="webhookUrl"
              placeholder="https://your-webhook.com"
              icon="i-lucide-webhook"
              class="w-full"
            />
          </UFormField>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex gap-1 justify-end w-full">
        <UButton @click="isOpen = false">Cancel</UButton>
        <UButton @click="handleSubmit" color="success">Save</UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const isOpen = defineModel<boolean>({ default: false });

const webhookUrl = ref("");

const { profile, handleUpdateProfile, handleUploadAvatar } =
  useProfileController();

watch(profile, async () => {
  if (profile.value) {
    webhookUrl.value = (profile.value.settings as any)?.webhook_url || "";
  }
});

const handleSubmit = () => {
  handleUpdateProfile({
    settings: {
      ...((profile.value?.settings as any) || {}),
      webhook_url: webhookUrl.value,
    },
  });
};
</script>
