<template>
  <NuxtLink
    :href="href"
    :target="target || '_blank'"
    class="underline text-primary-500 hover:text-primary-600 font-medium"
  >
    <slot />
  </NuxtLink>
</template>

<script setup lang="ts">
defineProps({
  href: {
    type: String,
    default: "",
  },
  target: {
    type: String,
    default: undefined,
    required: false,
  },
});
</script>
