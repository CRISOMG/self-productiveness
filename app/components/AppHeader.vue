<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";

// Props para configuración futura de acceso público
const props = withDefaults(
  defineProps<{
    showTimeline?: boolean;
    showProfile?: boolean;
    showNotes?: boolean;
  }>(),
  {
    showTimeline: true,
    showProfile: true,
    showNotes: true,
  },
);

// Emits para comunicar acciones a la página padre
const emit = defineEmits<{
  (e: "openTimeline"): void;
  (e: "openProfile"): void;
  (e: "openShortcuts"): void;
  (e: "openWebhook"): void;
  (e: "openPersonalAccessToken"): void;
  (e: "openNotes"): void;
  (e: "openPushNotifications"): void;
}>();

const profileController = useProfileController();
const supabase = useSupabaseClient();

const items = ref<DropdownMenuItem[][]>([
  [
    {
      label: "Profile",
      icon: "i-lucide-user",
      onSelect: () => {
        emit("openProfile");
      },
    },

    {
      label: "Keyboard shortcuts",
      icon: "i-lucide-monitor",
      onSelect: () => {
        emit("openShortcuts");
      },
    },

    {
      label: "Personal Access Token",
      icon: "i-lucide-key",
      onSelect: () => {
        emit("openPersonalAccessToken");
      },
    },

    {
      label: "Webhook",
      icon: "i-lucide-webhook",
      onSelect: () => {
        emit("openWebhook");
      },
    },
    {
      label: "Push Notifications",
      icon: "i-lucide-bell",
      onSelect: () => {
        emit("openPushNotifications");
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

<template>
  <div class="py-4 flex items-baseline justify-between px-2">
    <NuxtLink
      to="/"
      class="flex items-baseline hover:opacity-80 transition-opacity"
    >
      <i class="mr-1 w-6 flex self-center">
        <img src="/check-focus.png" alt="focus" />
      </i>
      <p class="font-bold">Yourfocus</p>
    </NuxtLink>

    <div
      class="flex self-end gap-2"
      v-if="showTimeline || showProfile || showNotes"
    >
      <UButton
        v-if="showNotes"
        @click="emit('openNotes')"
        icon="i-lucide:file-text"
      >
        Notas
      </UButton>

      <UButton
        v-if="showTimeline"
        @click="emit('openTimeline')"
        icon="i-lucide:chart-column"
      >
        Timeline
      </UButton>

      <UDropdownMenu
        v-if="showProfile"
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
</template>
