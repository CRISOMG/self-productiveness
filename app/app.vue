<template>
  <UApp>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient();
const authController = useAuthController();

onMounted(() => {
  // Solo se carga en desarrollo y en el cliente
  if (process.dev && process.client) {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/eruda";
    document.body.appendChild(script);
    script.onload = () => {
      eruda.init();
      console.log("🚀 Eruda listo. Revisa la pestaña Network para el Login.");
    };
  }
});
</script>
