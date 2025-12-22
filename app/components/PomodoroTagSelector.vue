<template>
  <div class="w-full max-w-sm self-center mt-2 flex flex-col justify-center">
    <div class="w-full max-w-sm mb-4 gap-1 flex flex-wrap">
      <UBadge
        v-for="tag in selected"
        :key="tag.id"
        :label="tag.label"
        variant="outline"
      >
        <template #trailing>
          <UButton
            icon="i-lucide-x"
            size="xs"
            variant="ghost"
            @click="onRemoveTag(tag)"
          />
        </template>
      </UBadge>
    </div>
    <UInputMenu
      :ui="{
        base: 'w-full max-w-sm',
        tagsItem: 'hidden',
      }"
      multiple
      v-model="selected"
      :items="items"
      placeholder="Add tag..."
      :loading="tagController.isLoading.value"
      loading-icon="i-lucide-loader"
      create-item
      @create="onCreate"
      @remove-tag="onRemoveTag"
      @update:search-term="search"
    >
    </UInputMenu>
  </div>
</template>

<script setup lang="ts">
import type { InputMenuItem } from "@nuxt/ui";
import { useTagController } from "~/composables/tag/use-tag-controller";
import type { Tag } from "~/types/Pomodoro";

const tags = defineModel<Tag[]>("tags", {
  type: Array as () => Tag[],
  default: () => [],
});

const emit = defineEmits<{
  (e: "add", tagId: number): void;
  (e: "remove", tagId: number): void;
}>();

const tagController = useTagController();

onMounted(() => {
  tagController.loadUserTags();
});

// Proxy to manage validation and transformation between UI items and Tag Rows used by parent
const selected = computed({
  get: () => {
    return (tags.value || []).map((t) => ({
      id: t.id, // For 'by' comparison
      label: t.label, // For display
      tag_data: t, // Consistent structure
    }));
  },
  set: (newVal: any[]) => {
    // We only detect additions/removals based on IDs for the emit events.
    // However, since UInputMenu with 'multiple' updates the whole array,
    // we need to diff against current props to see what changed.

    const oldIds = (tags.value || []).map((t) => t.id);
    const newItems = newVal || [];
    const newIds = newItems.map((t) => t.id);

    // 1. Find added items
    const added = newItems.filter((t) => !oldIds.includes(t.id));
    added.forEach((t) => {
      // If it's a "Create" item, it might not have a real ID yet or handled via @create event?
      // The 'create-item' prop on UInputMenu handles creation separately via @create event usually?
      // Let's check docs: create-item prop enables a "Create query" option if no results.
      // When clicked, it emits @create with the query string. It does NOT add to model automatically.
      // So 'added' here are only existing tags selected from the list.
      if (!t.isCreate) {
        emit("add", t.id);
      }
    });

    // 2. Find removed items
    const removed = (tags.value || []).filter((t) => !newIds.includes(t.id));
    removed.forEach((t) => emit("remove", t.id));
  },
});

const selectedTags = useSelectedTags(selected.value);

// The items list for the menu
const items = computed(() => {
  return tagController.userTags.value.map((tag) => ({
    id: tag.id,
    label: tag.label,
    tag_data: tag, // Store complete tag data in a property that doesn't conflict with InputMenuItem 'type'
  }));
});

async function search(q: string) {
  if (!q) return items.value;

  await tagController.handleSearch(q);

  return tagController.searchResults.value.map((tag) => ({
    id: tag.id,
    label: tag.label,
    tag_data: tag,
  }));
}

async function onCreate(label: string) {
  // 1. Create the tag
  const newTag = await tagController.handleCreateTag(label);

  // 2. Add it to selection
  if (newTag) {
    emit("add", newTag.id);
  }
}

function onRemoveTag(item: any) {
  // item is the object from the tags array (one of the selected items)
  // UInputMenu emits @remove-tag with the item being removed
  emit("remove", item.id);
}
</script>
