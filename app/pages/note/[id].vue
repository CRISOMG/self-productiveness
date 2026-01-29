<script setup lang="ts">
import { parseMarkdown } from "@nuxtjs/mdc/runtime";

definePageMeta({
  layout: "default",
});

const route = useRoute();
const id = computed(() => route.params.id as string);

// Fetch con mejor manejo de estados
const { data, status, error } = await useFetch(
  () => `/api/google-drive/search?name=${id.value}`,
  {
    key: `note-${id.value}`,
    lazy: false,
  },
);

// Parse markdown con dependencia en data
const { data: ast, status: astStatus } = await useAsyncData(
  `markdown-${id.value}`,
  () => parseMarkdown(data.value?.content || ""),
  { watch: [data] },
);

useHead({
  title: id.value,
  meta: [
    { charset: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { name: "description", content: id.value },
  ],
  link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
});
</script>

<template>
  <div class="w-full min-h-screen p-4">
    <!-- Loading state -->
    <div
      v-if="status === 'pending'"
      class="animate-pulse space-y-4 max-w-3xl mx-auto"
    >
      <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
      <div class="h-24 bg-gray-200 dark:bg-gray-700 rounded w-full mt-6"></div>
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
    </div>

    <!-- Error state -->
    <div
      v-else-if="error"
      class="flex flex-col items-center justify-center min-h-[50vh] text-center"
    >
      <UIcon name="i-lucide-file-x" class="w-16 h-16 text-red-400 mb-4" />
      <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Error loading document
      </h2>
      <p class="text-gray-500 dark:text-gray-400 mb-4">
        {{ error.message }}
      </p>
      <UButton to="/" icon="i-lucide-home" variant="outline">
        Go back home
      </UButton>
    </div>

    <!-- Content -->
    <div v-else class="max-w-3xl mx-auto prose dark:prose-invert">
      <MDCRenderer :body="ast?.body" :data="ast?.data" />
    </div>
  </div>
</template>
