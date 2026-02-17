<template>
  <UApp :locale="currentLocale">
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<script setup lang="ts">
import * as locales from "@nuxt/ui/locale";

const { locale } = useI18n();

const currentLocale = computed(() => (locales as any)[locale.value]);
const lang = computed(() => currentLocale.value?.code || "es");
const dir = computed(() => currentLocale.value?.dir || "ltr");

useHead({
  htmlAttrs: {
    lang,
    dir,
  },
});

const supabase = useSupabaseClient();
const authController = useAuthController();

onMounted(() => {
  // ... existing onMounted logic if needed
});
</script>
