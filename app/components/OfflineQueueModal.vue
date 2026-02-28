<script setup lang="ts">
import { useOfflineSync } from "~/composables/useOfflineSync";

const open = defineModel<boolean>({ default: false });
const { pendingOperations } = useOfflineSync();

const getMethodColor = (method: string) => {
  switch (method.toUpperCase()) {
    case "POST":
      return "success";
    case "PATCH":
      return "warning";
    case "DELETE":
      return "error";
    default:
      return "neutral";
  }
};
</script>

<template>
  <UModal
    v-model:open="open"
    title="Operaciones Pendientes"
    description="Actualmente estás desconectado o tienes operaciones en espera de red. Las peticiones a Pomodoros se sincronizarán automáticamente con el servidor cuando internet regrese."
    :ui="{ content: 'sm:max-w-lg' }"
  >
    <template #body>
      <div class="space-y-4 pt-4">
        <div
          v-if="pendingOperations.length === 0"
          class="text-neutral-500 text-sm py-4 text-center"
        >
          No hay operaciones pendientes
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="op in pendingOperations"
            :key="op.id"
            class="flex items-center justify-between p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg"
          >
            <div>
              <p class="font-medium flex items-center gap-2">
                <UBadge
                  :color="getMethodColor(op.requestData.method)"
                  size="xs"
                  variant="subtle"
                >
                  {{ op.requestData.method }}
                </UBadge>
                Petición a Pomodoros
              </p>
              <p class="text-xs text-neutral-500 mt-1 truncate max-w-[250px]">
                {{ op.requestData.url }}
              </p>
            </div>
            <p class="text-xs text-neutral-500">
              {{
                new Date(op.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              }}
            </p>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end">
        <UButton @click="open = false" color="neutral" variant="ghost">
          Cerrar
        </UButton>
      </div>
    </template>
  </UModal>
</template>
