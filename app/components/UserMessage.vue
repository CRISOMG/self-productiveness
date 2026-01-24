<script setup lang="ts">
const props = defineProps<{
  text: string;
}>();

const isExpanded = ref(false);
const isLong = computed(
  () => props.text.length > 300 || props.text.split("\n").length > 4,
);

function parseMarkdownLinks(text: string) {
  // Simple HTML escape to prevent XSS
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  // Parse [text](link) -> <a href="link" target="_blank" ...>text</a>
  return escaped.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline decoration-dashed underline-offset-4 decoration-neutral-500 hover:decoration-solid hover:text-primary transition-all">$1</a>',
  );
}
</script>

<template>
  <div class="relative group">
    <div
      class="whitespace-pre-wrap text-sm transition-all duration-200"
      :class="{
        'line-clamp-3 max-h-[4.5em] overflow-hidden': isLong && !isExpanded,
      }"
      v-html="parseMarkdownLinks(text)"
    />

    <UButton
      v-if="isLong"
      :icon="isExpanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
      size="xs"
      color="neutral"
      variant="solid"
      :aria-label="isExpanded ? 'Collapse message' : 'Expand message'"
      class="absolute -top-2.5 -right-2.5 rounded-full shadow-sm z-10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
      @click="isExpanded = !isExpanded"
    />
  </div>
</template>
