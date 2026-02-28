<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";

const user = useSupabaseUser();
const isLoggedIn = computed(() => !!user.value?.sub);

import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";

const openSpecialOfferModal = useState("openSpecialOfferModal", () => false);

const breakpoints = useBreakpoints(breakpointsTailwind);

const smAndLarger = breakpoints.greaterOrEqual("sm"); // sm and larger
const largerThanSm = breakpoints.greater("sm"); // only larger than sm
const lgAndSmaller = breakpoints.smallerOrEqual("lg"); // lg and smaller
const smallerThanLg = breakpoints.smaller("lg"); // only smaller than lg

const colorMode = useColorMode();
const isDark = computed({
  get: () => colorMode.value === "dark",
  set: (val) => {
    colorMode.preference = val ? "dark" : "light";
  },
});

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
  (e: "openCredentials"): void;
  (e: "openNotes"): void;
  (e: "openPushNotifications"): void;
}>();

const profileController = useProfileController();
const supabase = useSupabaseClient();
const { $pwa } = useNuxtApp();

const items = computed<DropdownMenuItem[][]>(() => {
  const dropdownItems: DropdownMenuItem[][] = [
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
        label: "Credentials",
        icon: "i-lucide-shield-check",
        onSelect: () => {
          emit("openCredentials");
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
  ];

  console.log($pwa);

  if ($pwa?.showInstallPrompt) {
    dropdownItems[0]?.push({
      label: "Install App",
      icon: "i-lucide-download",
      onSelect: () => {
        emit("openInstallApp");
      },
    });
  }

  return dropdownItems.concat([
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
});
</script>

<template>
  <div class="py-4 flex items-baseline justify-between px-2">
    <NuxtLink
      to="/"
      class="flex items-baseline hover:opacity-80 transition-opacity"
    >
      <i class="mr-1 w-6 flex self-center">
        <img src="/favicon.ico" alt="focus" />
      </i>
      <p class="font-bold">Yourfocus</p>
    </NuxtLink>

    <div v-if="!profileController.profile.value?.settings?.offerTermsAccepted">
      <p
        class="text-center ml-1 cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-2"
        @click="openSpecialOfferModal = true"
      >
        <UBadge
          color="success"
          variant="subtle"
          :ui="{ base: 'flex items-center gap-1.5' }"
        >
          <span class="relative flex h-2 w-2">
            <span
              class="animate-ping absolute flex h-full w-full rounded-full bg-green-400 opacity-75"
            />
            <span class="relative flex rounded-full h-2 w-2 bg-green-400" />
          </span>
          <span class="text-xs">
            <span class="whitespace-nowrap">Oferta Especial</span>
          </span>
        </UBadge>
      </p>
    </div>
    <div class="flex self-end gap-2" v-if="isLoggedIn">
      <!-- Color Mode Toggle -->
      <UButton
        :icon="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
        color="neutral"
        variant="ghost"
        @click="isDark = !isDark"
        aria-label="Toggle color mode"
      />

      <UButton
        v-if="showNotes"
        @click="emit('openNotes')"
        icon="i-lucide:file-text"
        :label="breakpoints.sm.value ? 'Notes' : ''"
        class="hidden sm:inline-flex"
      />

      <UButton
        v-if="showTimeline"
        @click="emit('openTimeline')"
        icon="i-lucide:chart-column"
        :label="breakpoints.sm.value ? 'Timeline' : ''"
        class="hidden sm:inline-flex"
      />

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
