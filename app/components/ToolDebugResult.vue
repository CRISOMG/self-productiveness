<script setup lang="ts">
import { useClipboard } from "@vueuse/core";

const props = defineProps<{
  tool: string;
  input: string;
  result: string;
}>();

const { copy, copied } = useClipboard();

function formatResult() {
  try {
    const json = JSON.parse(props.result);
    return JSON.stringify(json, null, 2);
  } catch {
    return props.result;
  }
}
</script>

<template>
  <div
    class="my-4 rounded-md border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900 overflow-hidden not-prose"
  >
    <div
      class="flex items-center justify-between px-3 py-2 text-xs text-gray-500 dark:text-gray-400"
    >
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-wrench" class="size-3.5" />
        <span class="font-medium">Used Tool: {{ tool }}</span>
        <span v-if="input && input !== '{}'" class="opacity-75"
          >({{ input }})</span
        >
      </div>
      <button
        @click="copy(formatResult())"
        type="button"
        class="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        <UIcon
          :name="copied ? 'i-lucide-check' : 'i-lucide-copy'"
          class="size-3.5"
        />
        <span>{{ copied ? "Copied" : "Copy Result" }}</span>
      </button>
    </div>
  </div>
</template>
