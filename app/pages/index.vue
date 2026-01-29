<template>
  <!-- body -->
  <div class="flex justify-center h-full p-0 w-full min-w-full">
    <div class="">
      <YourfocusTimer :user_id="user_id" />
      <TaskContainer class="mt-4" />
    </div>

    <UDrawer
      v-model:open="openChatDrawer"
      :overlay="false"
      direction="right"
      :dismissible="false"
      :modal="false"
      :handle="false"
      :ui="{
        content: 'w-full max-w-full sm:max-w-[35vw] ',
        container: 'p-0 m-0',
      }"
    >
      <div class="fixed bottom-4 right-4 h-fit">
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-brain"
          class="rounded-4xl"
          :ui="{
            leadingIcon: 'w-12 h-12',
          }"
        />
      </div>

      <template #body>
        <div class="flex flex-col w-full">
          <div class="h-8 w-fit ml-auto">
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              @click="openChatDrawer = false"
              class="ml-auto"
            />
          </div>
          <div class="flex h-[calc(100vh-2rem)] relative bottom-0 select-text">
            <ChatContainer />
          </div>
        </div>
      </template>
    </UDrawer>
  </div>

  <PasswordSetupModal v-model="openPasswordSetupModal" />
</template>

<script setup lang="ts">
definePageMeta({
  layout: "default",
});

const profileController = useProfileController();
const openChatDrawer = ref(false);

useHead({
  bodyAttrs: {
    class: computed(() =>
      openChatDrawer.value ? "overflow-hidden sm:overflow-auto" : "",
    ),
  },
});

const user = useSupabaseUser();
const user_id = computed(() => {
  return user.value?.sub || "";
});

const openPasswordSetupModal = ref(false);

watch(profileController.profile, () => {
  if (!profileController.profile.value?.has_password) {
    openPasswordSetupModal.value = true;
  }
});
</script>
