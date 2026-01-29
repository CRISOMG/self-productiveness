<script setup lang="ts">
// Redirect from /editor/[id] to /note/[id]
definePageMeta({
  layout: false,
});

const route = useRoute();
const id = route.params.id as string;

// Perform redirect on server and client
await navigateTo(`/note/${id}`, { redirectCode: 301, replace: true });
</script>

<template>
  <div class="flex items-center justify-center min-h-screen">
    <div class="animate-pulse">
      <p class="text-gray-500">Redirecting...</p>
    </div>
  </div>
</template>
