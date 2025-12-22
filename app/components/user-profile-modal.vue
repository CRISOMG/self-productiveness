<template>
  <template v-if="isOpen">
    <UModal
      :ui="{ content: 'top-60' }"
      :overlay="false"
      v-model:open="isOpen"
      title="Profile"
    >
      <template #body>
        <div class="flex">
          <div class="flex p-4">
            <UFileUpload
              size="xl"
              v-model="fileUpload.avatar"
              @change="onFileChange"
              color="neutral"
              accept="image/*"
              :ui="{
                file: '[&_img]:object-contain',
              }"
            >
            </UFileUpload>
          </div>

          <div class="flex flex-col w-full">
            <p class="font-bold text-2xl mt-6 capitalize">
              {{ profile?.fullname }}
            </p>
            <USeparator class="mb-2" />
            <p class="font-bold">{{ user?.email }}</p>

            <div class="mt-4">
              <ULink
                to="/update-password"
                class="text-sm text-primary font-medium hover:underline flex items-center gap-1"
              >
                <UIcon name="i-lucide-lock" class="w-4 h-4" />
                Change Password
              </ULink>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex gap-1 justify-end w-full">
          <UButton @click="isOpen = false">Cancel</UButton>
          <UButton
            @click="
              handleUpdateProfile({
                fullname: profile?.fullname || '',
                settings: {
                  ...((profile?.settings as any) || {}),
                  webhook_url: webhookUrl,
                },
              })
            "
            color="success"
            >Save</UButton
          >
        </div>
      </template>
    </UModal>
  </template>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";
import { useProfileController } from "~/composables/profile/use-profile-controller";

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const user_id = computed(() => {
  return user.value?.sub as string;
});

const isOpen = defineModel<boolean>({ default: false });

async function urlToFile(url: string, filename: string) {
  const response = await fetch(url);
  const blob = await response.blob();
  const mimeType = blob.type;
  const file = new File([blob], filename, { type: mimeType });
  return file;
}
const fileUpload = reactive<{ avatar: File | undefined }>({
  avatar: undefined,
});

const webhookUrl = ref("");

const { profile, handleUpdateProfile, handleUploadAvatar } =
  useProfileController();

watch(profile, async () => {
  console.log("profile.value", profile.value, fileUpload.avatar);
  if (profile.value) {
    webhookUrl.value = (profile.value.settings as any)?.webhook_url || "";
  }
});

// To update profile
const updateData = async () => {
  await handleUpdateProfile({ fullname: "New Name" });
};

// To upload avatar
const onFileChange = async () => {
  const file = fileUpload.avatar;
  if (file) {
    const url = await handleUploadAvatar(file);
  }
};
</script>
