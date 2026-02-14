<template>
  <UModal
    :ui="{ body: 'sm:p-0' }"
    :overlay="false"
    v-model:open="isOpen"
    title="Timeline"
  >
    <template #body>
      <div class="flex h-[85vh] p-0">
        <TimeGrid />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const isOpen = defineModel<boolean>({ default: false });
</script>
