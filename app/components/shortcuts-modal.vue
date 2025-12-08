<template>
  <UModal v-model:open="isOpen" title="Keyboard Shortcuts">
    <template #body>
      <div class="space-y-4">
        <div v-for="(group, index) in shortcuts" :key="index">
          <h4 class="font-medium text-gray-500 dark:text-gray-400 mb-2 text-sm">
            {{ group.category }}
          </h4>
          <div class="space-y-2">
            <div
              v-for="(shortcut, sIndex) in group.items"
              :key="sIndex"
              class="flex items-center justify-between"
            >
              <span class="text-sm text-gray-700 dark:text-gray-200">{{
                shortcut.label
              }}</span>
              <div class="flex gap-1">
                <UKbd v-for="key in shortcut.keys" :key="key">{{ key }}</UKbd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const isOpen = defineModel<boolean>({ default: false });

const shortcuts = [
  {
    category: "Timer Control",
    items: [
      { label: "Start / Pause Timer", keys: ["Space"] },
      { label: "Switch to Focus", keys: ["1"] },
      { label: "Switch to Short Break", keys: ["2"] },
      { label: "Switch to Long Break", keys: ["3"] },
    ],
  },
  {
    category: "General",
    items: [{ label: "Logout", keys: ["Shift", "Meta", "Q"] }],
  },
];
</script>
