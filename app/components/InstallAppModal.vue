<script setup lang="ts">
const open = defineModel<boolean>({ default: false });

const { $pwa } = useNuxtApp();

const confirmInstall = async () => {
  open.value = false;
  if ($pwa?.install) {
    await $pwa.install();
  }
};
</script>

<template>
  <UModal
    v-model:open="open"
    title="Instalar App"
    :ui="{ content: 'sm:max-w-md' }"
  >
    <template #body>
      <div class="space-y-4 pt-4">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          ¿Deseas instalar Yourfocus como aplicación (PWA) para acceder
          rápidamente desde tu dispositivo y mejorar tu experiencia?
        </p>

        <div
          v-if="!$pwa?.showInstallPrompt"
          class="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-600 text-sm mt-4"
        >
          ℹ️ La instalación directa no está disponible o la app ya está
          instalada. Puedes probar usando el menú del navegador para instalar o
          añadir a la pantalla de inicio.
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton color="neutral" variant="ghost" @click="open = false">
          Cancelar
        </UButton>
        <UButton
          v-if="($pwa as any)?.showInstallPrompt"
          color="primary"
          @click="confirmInstall"
          icon="i-lucide-download"
        >
          Confirmar instalación
        </UButton>
      </div>
    </template>
  </UModal>
</template>
