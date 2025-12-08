<template>
  <UContainer class="max-w-4xl">
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
              src: profile?.avatar_url || 'user-white.png',
            }"
            size="md"
            color="neutral"
            variant="outline"
          />
        </UDropdownMenu>
      </div>
    </div>
    <USeparator />
    <div>
      <PomofocusClone :user_id="user_id" />
    </div>

    <UserProfileModal v-model="openProfileModal" />
    <TimelineModal v-model="openTimelineModal" />
    <ShortcutsModal v-model="openShortcutsModal" />
  </UContainer>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";
import TimelineModal from "~/components/timeline-modal .vue";

const { profile } = useProfileController();

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const user_id = computed(() => {
  return user.value?.sub as string;
});

const openProfileModal = ref(false);
const openTimelineModal = ref(false);
const openShortcutsModal = ref(false);

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
</script>
