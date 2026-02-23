<template>
  <UModal
    v-model:open="isOpen"
    title="Create Task from Template"
    :ui="{ content: 'sm:max-w-md' }"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <UFormField label="Select Template">
          <USelectMenu
            v-model="selectedTemplate"
            :items="templatesSelectables"
            value-key="value"
            placeholder="Choose a template..."
            searchable
            option-attribute="title"
          >
          </USelectMenu>
        </UFormField>

        <UFormField v-if="selectedTemplate" label="Title Override (Optional)">
          <UInput
            v-model="overrideTitle"
            :placeholder="selectedTemplate.title"
          />
          <p class="text-xs text-neutral-500 mt-1">
            Leave blank to use the template's title.
          </p>
        </UFormField>

        <div
          v-if="selectedTemplate"
          class="text-sm text-neutral-600 bg-neutral-50 dark:bg-neutral-900 p-3 rounded-md border"
        >
          <p class="font-medium mb-1">Preview:</p>
          <div class="line-clamp-3 mb-2">
            {{ selectedTemplate.default_description || "No description" }}
          </div>
          <div class="flex gap-1 flex-wrap">
            <UBadge
              v-for="tag in selectedTemplate.tags"
              :key="tag.id"
              size="xs"
              variant="subtle"
            >
              {{ tag.label }}
            </UBadge>
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-4">
          <UButton color="neutral" variant="ghost" @click="isOpen = false"
            >Cancel</UButton
          >
          <UButton
            color="primary"
            :disabled="!selectedTemplate || taskController.isLoading.value"
            :loading="taskController.isLoading.value"
            @click="handleCreate"
          >
            Create Task
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import {
  useTaskTemplatesController,
  type TTaskTemplate,
} from "~/composables/task/use-task-templates";
import { useTaskController } from "~/composables/task/use-task-controller";

const emit = defineEmits<{
  (e: "task-created"): void;
}>();

const isOpen = defineModel<boolean>("open", { default: false });

const templatesController = useTaskTemplatesController();
const taskController = useTaskController();

const selectedTemplate = ref<TTaskTemplate | undefined>(undefined);
const overrideTitle = ref("");

const templatesSelectables = computed(() => {
  return templatesController.templates.value.map((template) => {
    return {
      id: template.id,
      label: template.title,
      value: template,
    };
  });
});

// Watchers
watch(isOpen, (newVal) => {
  if (newVal) {
    templatesController.loadTemplates();
    selectedTemplate.value = undefined;
    overrideTitle.value = "";
  }
});

// Actions
async function handleCreate() {
  if (!selectedTemplate.value) return;

  const title = overrideTitle.value.trim() || selectedTemplate.value.title;
  const description = selectedTemplate.value.default_description || "";
  const firstTagId =
    selectedTemplate.value.tags && selectedTemplate.value.tags.length > 0
      ? selectedTemplate.value.tags[0]?.id
      : undefined;

  // Utilize the existing handleCreateTask. Note: The multi-tag support on frontend `createTask` might not be fully implemented yet,
  // but we pass the first tag for now (which is consistent with existing handleCreateTask logic).
  // Modifying the `tasks_tags` table directly could be handled in a backend refactor, but for now we follow the existing signature.
  await taskController.handleCreateTask(title, description, firstTagId);

  // If the template had multiple tags, we'd ideally sync tasks_tags here.
  // For simplicity and matching current handleCreateTask signature, we assign the primary tag.

  isOpen.value = false;
  emit("task-created");
}
</script>
