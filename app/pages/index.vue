<template>
  <UContainer class="">
    <div class="py-4 flex items-baseline justify-between">
      <div class="flex items-baseline">
        <i class="mr-1 w-6 flex self-center"
          ><img src="/check-focus.png" alt="focus"
        /></i>
        <p class="font-bold">Yourfocus</p>
      </div>

      <div class="flex self-end gap-2">
        <UButton @click="openTimelineModal = true" icon="i-lucide:chart-column"
          >Timeline</UButton
        >
        <!-- <UButton icon="i-lucide:settings">Settings</UButton> -->

        <UDropdownMenu
          :content="{ align: 'end' }"
          :items="items"
          :ui="{
            content: 'w-48',
          }"
        >
          <UButton
            :avatar="{
              src:
                profileController.profile.value?.avatar_url || 'user-white.png',
            }"
            size="md"
            color="neutral"
            variant="outline"
          />
        </UDropdownMenu>
      </div>
    </div>
    <USeparator />

    <!-- body -->
    <div class="flex-1 flex justify-center">
      <div class="">
        <YourfocusTimer :user_id="user_id" />
      </div>

      <UDrawer
        v-model:open="openChatDrawer"
        :overlay="false"
        direction="right"
        :dismissible="false"
        :modal="false"
        :handle="false"
        :ui="{
          container: 'p-0 m-0  ',
        }"
      >
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-brain"
          class="absolute bottom-4 right-4 rounded-4xl"
          :ui="{
            leadingIcon: 'w-12 h-12',
          }"
        />

        <template #body>
          <div class="flex">
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-chevron-right"
              @click="openChatDrawer = false"
              class="h-screen"
            />
            <div class="flex h-screen relative bottom-0 select-text">
              <ChatContainer />
            </div>
          </div>
        </template>
      </UDrawer>
    </div>

    <template v-if="openProfileModal">
      <UserProfileModal v-model="openProfileModal" />
    </template>
    <template v-if="openTimelineModal">
      <TimelineModal v-model="openTimelineModal" />
    </template>
    <ShortcutsModal v-model="openShortcutsModal" />
    <PasswordSetupModal v-model="openPasswordSetupModal" />
    <WebhookModal v-model="openWebhookModal" />
    <PersonalAccessTokenModal v-model="openPersonalAccessTokenModal" />
  </UContainer>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";
import TimelineModal from "~/components/timeline-modal .vue";

const profileController = useProfileController();

const openChatDrawer = ref(false);
const supabase = useSupabaseClient();
const user = useSupabaseUser();
const user_id = computed(() => {
  return user.value?.sub || "";
});

const openProfileModal = ref(false);
const openTimelineModal = ref(false);
const openShortcutsModal = ref(false);
const openPasswordSetupModal = ref(false);
const openWebhookModal = ref(false);
const openPersonalAccessTokenModal = ref(false);

const items = ref<DropdownMenuItem[][]>([
  [
    {
      label: "Profile",
      icon: "i-lucide-user",
      onSelect: () => {
        openProfileModal.value = true;
      },
    },

    {
      label: "Keyboard shortcuts",
      icon: "i-lucide-monitor",
      onSelect: () => {
        openShortcutsModal.value = true;
      },
    },

    {
      label: "Personal Access Token",
      icon: "i-lucide-key",
      onSelect: () => {
        openPersonalAccessTokenModal.value = true;
      },
    },

    {
      label: "Webhook",
      icon: "i-lucide-webhook",
      onSelect: () => {
        openWebhookModal.value = true;
      },
    },
  ],

  [
    {
      label: "Logout",
      icon: "i-lucide-log-out",
      kbds: ["shift", "meta", "q"],
      onSelect() {
        supabase.auth.signOut().then(() => {
          navigateTo("/login");
        });
      },
    },
  ],
]);

watch(profileController.profile, () => {
  if (!profileController.profile.value?.has_password) {
    openPasswordSetupModal.value = true;
  }
});
</script>
