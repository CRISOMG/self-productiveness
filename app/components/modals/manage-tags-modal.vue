<template>
  <UModal v-model:open="isOpen" title="Manage Tags">
    <template #body>
      <div class="flex flex-col gap-2">
        <template v-if="multiple">
          <div>
            <div class="flex items-center justify-between p-1">
              <p class="text-lg">Tags</p>
              <div>
                <UPopover>
                  <UButton
                    icon="i-lucide-menu"
                    color="neutral"
                    variant="outline"
                  />

                  <template #content>
                    <div class="p-2">
                      <UCheckbox
                        v-model="keepTags"
                        label="Keep tags"
                        alt="Keep tags between pomodoros"
                      />
                    </div>
                  </template>
                </UPopover>
              </div>
            </div>
            <USeparator />
            <PomodoroTagSelector
              v-if="pomodoroController.currPomodoro?.tags"
              class="mt-4"
              v-model:tags="pomodoroController.currPomodoro.tags"
              @add="pomodoroController.handleAddTag"
              @remove="pomodoroController.handleRemoveTag"
            />
          </div>
        </template>
        <template v-else>
          <USelectMenu
            class="w-full"
            v-model="selectedItem"
            :items="tagItems"
            placeholder="Select Tag"
            searchable
          />
        </template>
      </div>
    </template>
    <!-- <template #footer>
      <div class="flex gap-1 justify-center w-full">
        <UButton @click="" :loading="false" color="success">n/a</UButton>
      </div>
    </template> -->
  </UModal>
</template>

<script setup lang="ts">
const pomodoroController = usePomodoroController();

const isOpen = defineModel<boolean>({ default: false });
type TItem = {
  id: number | null;
  label: string;
};
const selectedItem = defineModel<TItem>("selected-item", {
  default: {
    id: null,
    label: "",
  },
});

const prop = defineProps({
  multiple: {
    type: Boolean,
    default: false,
  },
});

const keepTags = useKeepSelectedTags();

const tagController = useTagController();

const tagItems = computed(() => {
  return [
    {
      id: null,
      label: "None",
    },
    ...tagController.userTags.value.map((t) => ({
      id: t.id,
      label: t.label,
    })),
  ];
});

onMounted(() => {});
</script>
