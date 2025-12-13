<template>
  <div class="flex items-center justify-center h-screen">
    <ContainerLogin />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: [
    async (to, from) => {
      const { data } = await useSupabaseClient().auth.getSession();

      if (data.session) {
        return navigateTo("/");
      }
    },
  ],
});
</script>
