<script setup lang="ts">
interface NoteFile {
  id: string;
  name: string;
  mimeType: string;
}

interface FilesResponse {
  success: boolean;
  count: number;
  files: NoteFile[];
  message?: string;
}

const isOpen = defineModel<boolean>({ default: false });

// Local search filter
const searchQuery = ref("");

const user = useSupabaseUser();

const useSupabaseStorage = true;
// user.value?.sub !== "4ddb8909-ef46-4cde-8feb-8ce0a3c72564";

// Determine which API endpoint to use based on feature flag
const apiEndpoint = computed(() =>
  useSupabaseStorage ? "/api/storage/notes" : "/api/google-drive/files",
);

// Fetch notes from the API
const { data, status, error, refresh } = await useLazyFetch<FilesResponse>(
  apiEndpoint,
  {
    key: "notes-list",
    watch: [apiEndpoint], // Refetch if endpoint changes
  },
);

// Filtered notes based on search query
const filteredNotes = computed(() => {
  if (!data.value?.files) return [];

  const query = searchQuery.value.toLowerCase().trim();
  if (!query) return data.value.files;

  return data.value.files.filter((file) =>
    file.name.toLowerCase().includes(query),
  );
});

// Get clean filename without extension for the link
function getNotePath(filename: string): string {
  // Remove .md extension if present
  const name = filename.replace(/\.md$/i, "");
  return `/note/${encodeURIComponent(name)}`;
}

// Display name without extension
function getDisplayName(filename: string): string {
  return filename.replace(/\.md$/i, "");
}

// Refresh when modal opens
watch(isOpen, (open) => {
  if (open) {
    refresh();
    searchQuery.value = "";
  }
});
</script>

<template>
  <UModal
    :ui="{ body: 'sm:p-4' }"
    :overlay="false"
    v-model:open="isOpen"
    :title="`Notas (${data?.count || 0})`"
  >
    <template #body>
      <div class="flex flex-col h-[70vh] gap-4">
        <!-- Storage provider indicator (dev only) -->
        <div
          v-if="useSupabaseStorage"
          class="text-xs text-blue-500 dark:text-blue-400 text-center"
        >
          📦 Supabase Storage
        </div>

        <!-- Search input -->
        <UInput
          v-model="searchQuery"
          icon="i-lucide-search"
          placeholder="Buscar notas..."
          class="w-full"
          :disabled="status === 'pending'"
        />

        <!-- Loading state -->
        <div
          v-if="status === 'pending'"
          class="flex-1 flex items-center justify-center"
        >
          <div class="animate-pulse space-y-3 w-full">
            <div
              class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full"
              v-for="i in 5"
              :key="i"
            />
          </div>
        </div>

        <!-- Error state -->
        <div
          v-else-if="error"
          class="flex-1 flex flex-col items-center justify-center text-center gap-2"
        >
          <UIcon name="i-lucide-alert-circle" class="w-12 h-12 text-red-400" />
          <p class="text-gray-500 dark:text-gray-400">
            Error cargando notas: {{ error.message }}
          </p>
          <UButton variant="outline" @click="refresh()">Reintentar</UButton>
        </div>

        <!-- Empty state -->
        <div
          v-else-if="filteredNotes.length === 0 && searchQuery"
          class="flex-1 flex flex-col items-center justify-center text-center gap-2"
        >
          <UIcon name="i-lucide-search-x" class="w-12 h-12 text-gray-400" />
          <p class="text-gray-500 dark:text-gray-400">
            No se encontraron notas para "{{ searchQuery }}"
          </p>
        </div>

        <div
          v-else-if="!data?.files?.length"
          class="flex-1 flex flex-col items-center justify-center text-center gap-2"
        >
          <UIcon name="i-lucide-file-x" class="w-12 h-12 text-gray-400" />
          <p class="text-gray-500 dark:text-gray-400">
            No hay notas disponibles
          </p>
        </div>

        <!-- Notes list -->
        <div v-else class="flex-1 overflow-y-auto">
          <ul class="space-y-1">
            <li v-for="note in filteredNotes" :key="note.id">
              <NuxtLink
                :to="getNotePath(note.name)"
                class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                target="_blank"
              >
                <UIcon
                  name="i-lucide-file-text"
                  class="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0"
                />
                <span class="truncate">{{ getDisplayName(note.name) }}</span>
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Counter footer -->
        <div
          class="text-xs text-gray-500 dark:text-gray-400 text-center border-t pt-2"
        >
          <template v-if="searchQuery">
            Mostrando {{ filteredNotes.length }} de {{ data?.count || 0 }} notas
          </template>
          <template v-else> {{ data?.count || 0 }} notas en total </template>
        </div>
      </div>
    </template>
  </UModal>
</template>
