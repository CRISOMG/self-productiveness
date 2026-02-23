<template>
  <UModal
    v-model:open="isOpen"
    title="Manage Task Templates"
    :ui="{ content: 'sm:max-w-xl' }"
  >
    <template #body>
      <!-- Template List View -->
      <div v-if="!isEditing" class="flex flex-col gap-4">
        <div class="flex justify-end">
          <UButton
            icon="i-lucide-plus"
            size="sm"
            color="primary"
            @click="startCreate"
          >
            New Template
          </UButton>
        </div>

        <div
          v-if="!templatesController.templates.value.length"
          class="text-center py-8 text-neutral-500"
        >
          No templates found. Create one to get started!
        </div>

        <div v-else class="flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
          <div
            v-for="template in templatesController.templates.value"
            :key="template.id"
            class="p-3 border rounded-md flex flex-col gap-2"
          >
            <div class="flex justify-between items-start">
              <h4 class="font-medium">{{ template.title }}</h4>
              <div class="flex gap-1">
                <UButton
                  icon="i-lucide-pencil"
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  @click="startEdit(template)"
                />
                <UButton
                  icon="i-lucide-trash"
                  size="xs"
                  color="error"
                  variant="ghost"
                  @click="handleDelete(template.id)"
                />
              </div>
            </div>
            <p
              v-if="template.default_description"
              class="text-sm text-neutral-500 line-clamp-2"
            >
              {{ template.default_description }}
            </p>
            <div v-if="template.tags.length" class="flex gap-1 flex-wrap mt-1">
              <UBadge
                v-for="tag in template.tags"
                :key="tag.id"
                size="xs"
                variant="subtle"
              >
                {{ tag.label }}
              </UBadge>
            </div>
          </div>
        </div>
      </div>

      <!-- Edit/Create View -->
      <div v-else class="flex flex-col gap-4">
        <div class="flex justify-between items-center mb-2">
          <h4 class="font-medium">
            {{ editingTemplate.id ? "Edit Template" : "New Template" }}
          </h4>
          <UButton
            icon="i-lucide-arrow-left"
            size="xs"
            color="neutral"
            variant="ghost"
            @click="isEditing = false"
          >
            Back
          </UButton>
        </div>

        <UFormField label="Title">
          <UInput
            v-model="editingTemplate.title"
            placeholder="E.g. Daily Standup Prep"
          />
        </UFormField>

        <UFormField label="Default Description (Markdown supported)">
          <UTextarea
            v-model="editingTemplate.default_description"
            placeholder="Add default description, checklist, or links..."
            :rows="4"
          />
        </UFormField>

        <UFormField label="Default Tags">
          <USelectMenu
            v-model="selectedTags"
            :items="tagItems"
            multiple
            placeholder="Select default tags"
            searchable
            option-attribute="label"
          />
        </UFormField>

        <div class="flex justify-end gap-2 mt-4">
          <UButton color="neutral" variant="ghost" @click="isEditing = false"
            >Cancel</UButton
          >
          <UButton
            color="primary"
            :loading="templatesController.isLoading.value"
            :disabled="!editingTemplate.title"
            @click="handleSave"
          >
            Save Template
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
import { useTagController } from "~/composables/tag/use-tag-controller";

const isOpen = defineModel<boolean>("open", { default: false });

const templatesController = useTaskTemplatesController();
const tagController = useTagController();

// Local state
const isEditing = ref(false);
const editingTemplate = ref<Partial<TTaskTemplate>>({
  title: "",
  default_description: "",
  tags: [],
});
const selectedTags = ref<{ id: number; label: string }[]>([]);

const tagItems = computed(() => {
  return tagController.userTags.value.map((t) => ({
    id: t.id,
    label: t.label,
  }));
});

// Watchers
watch(isOpen, (newVal) => {
  if (newVal) {
    templatesController.loadTemplates();
    tagController.loadUserTags();
    isEditing.value = false;
  }
});

// Actions
function startCreate() {
  editingTemplate.value = { title: "", default_description: "", tags: [] };
  selectedTags.value = [];
  isEditing.value = true;
}

function startEdit(template: TTaskTemplate) {
  editingTemplate.value = { ...template };
  selectedTags.value = [...template.tags];
  isEditing.value = true;
}

async function handleSave() {
  if (!editingTemplate.value.title) return;

  const tagIds = selectedTags.value.map((t) => t.id);

  if (editingTemplate.value.id) {
    // Update
    await templatesController.handleUpdateTemplate(
      editingTemplate.value.id,
      editingTemplate.value.title,
      editingTemplate.value.default_description || "",
      tagIds,
    );
  } else {
    // Create
    await templatesController.handleCreateTemplate(
      editingTemplate.value.title,
      editingTemplate.value.default_description || "",
      tagIds,
    );
  }

  isEditing.value = false;
}

async function handleDelete(id: string) {
  if (confirm("Are you sure you want to delete this template?")) {
    await templatesController.handleDeleteTemplate(id);
  }
}
</script>
