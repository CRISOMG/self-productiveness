<template>
  <div
    class="flex flex-col p-2 sm:p-3 border rounded-md shadow-sm bg-background"
    :class="[{ 'opacity-50': task.done }, compact ? 'text-sm' : '']"
  >
    <!-- Header: Checkbox + Title + Actions -->
    <div class="flex items-start gap-2">
      <UCheckbox
        :model-value="task.done ?? false"
        @update:model-value="emit('toggleDone', task)"
        :ui="{
          base: compact
            ? 'w-5 h-5 rounded-full'
            : 'w-[1.5rem] h-[1.5rem] rounded-full',
        }"
      />
      <div class="flex-1 min-w-0">
        <p
          class="font-medium wrap-break-word"
          :class="[
            { 'line-through opacity-50': task.done },
            compact ? 'text-sm' : '',
          ]"
        >
          {{ task.title }}
        </p>
      </div>
    </div>

    <!-- Description -->
    <p
      v-if="task.description && !compact"
      class="text-sm text-muted mt-1 cursor-pointer overflow-hidden transition-all"
      :style="{
        maxHeight: expandedDescriptions[task.id] ? 'none' : '60px',
      }"
      @click="emit('toggleDescription', task.id)"
    >
      {{ task.description }}
    </p>
    <div class="flex items-center justify-between">
      <div>
        <!-- Archive -->
        <UTooltip :text="task.archived ? 'Unarchive' : 'Archive'">
          <UButton
            icon="i-lucide-archive"
            size="xs"
            :variant="task.archived ? 'solid' : 'ghost'"
            :color="task.archived ? 'warning' : 'neutral'"
            @click="reveal()"
          />
        </UTooltip>
        <UModal v-model:open="isRevealed" @update:open="cancel()">
          <template #content>
            <div class="p-4">
              <h1 class="text-lg font-medium w-fit">
                Are you sure you want to
                {{ task.archived ? "unarchive" : "archive" }} this task?
              </h1>
              <div class="flex justify-end gap-2 mt-4">
                <UButton
                  label="Cancel"
                  color="neutral"
                  variant="subtle"
                  @click="cancel()"
                />
                <UButton
                  label="Confirm"
                  color="neutral"
                  variant="solid"
                  @click="confirm()"
                />
              </div>
            </div>
          </template>
        </UModal>
      </div>

      <!-- Stage Selector -->
      <USelectMenu
        v-if="stages?.length"
        :model-value="task.stage || 'backlog'"
        :items="stageItems"
        size="xs"
        class="w-24"
        @update:model-value="
          (val: any) => emit('stageChange', task.id, val?.value || val)
        "
      >
        <UButton
          :icon="currentStageIcon"
          size="xs"
          variant="ghost"
          color="neutral"
        />
      </USelectMenu>
    </div>

    <!-- Footer: Actions + Tags -->
    <div class="flex items-center justify-between mt-2 gap-2">
      <div class="flex gap-1">
        <!-- Tag manage -->
        <UTooltip text="Manage Tag">
          <UButton
            :disabled="task.done!"
            icon="i-lucide-tag"
            size="xs"
            variant="ghost"
            color="neutral"
            @click="emit('manageTag', task)"
          />
        </UTooltip>
      </div>

      <!-- Tags display -->
      <div v-if="task.tags?.length" class="flex items-center gap-1 flex-wrap">
        <template
          v-for="tag in expandedTagsState[task.id]
            ? task.tags
            : task.tags.slice(0, compact ? 1 : 3)"
          :key="tag.id"
        >
          <UBadge size="sm" variant="soft">{{ tag.label }}</UBadge>
        </template>
        <UButton
          v-if="task.tags.length > (compact ? 1 : 3)"
          size="xs"
          variant="link"
          color="neutral"
          @click="emit('toggleTags', task.id)"
        >
          +{{ task.tags.length - (compact ? 1 : 3) }}
        </UButton>
      </div>
      <div v-else-if="task.tag" class="flex items-center gap-1">
        <UBadge size="sm" variant="soft">{{ task.tag.label }}</UBadge>
      </div>
      <!-- Pomodoro assign -->
      <UTooltip
        :text="task.keep ? 'Unassign from Pomodoro' : 'Assign to Pomodoro'"
      >
        <UButton
          :disabled="task.done!"
          icon="i-lucide-timer"
          size="xs"
          :variant="task.keep ? 'solid' : 'ghost'"
          :color="task.keep ? 'success' : 'neutral'"
          @click="emit('assignPomodoro', task.id)"
        />
      </UTooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useConfirmDialog } from "#imports";
import type { TTask } from "~/composables/task/use-task-controller";
import type { Database } from "~/types/database.types";

const { isRevealed, reveal, confirm, cancel, onReveal, onConfirm, onCancel } =
  useConfirmDialog();

onConfirm(() => {
  emit("archive", props.task.id);
});

type TaskStage = Database["public"]["Enums"]["task_stage"];

const props = defineProps<{
  task: TTask;
  expandedDescriptions: Record<string, boolean>;
  expandedTagsState: Record<string, boolean>;
  stages?: { value: TaskStage; label: string; icon: string }[];
  compact?: boolean;
}>();

const emit = defineEmits<{
  toggleDone: [task: TTask];
  toggleDescription: [taskId: string];
  toggleTags: [taskId: string];
  archive: [taskId: string];
  assignPomodoro: [taskId: string];
  manageTag: [task: TTask];
  stageChange: [taskId: string, newStage: TaskStage];
}>();

const stageItems = computed(
  () =>
    props.stages?.map((s) => ({
      label: s.label,
      value: s.value,
    })) || [],
);

const currentStageIcon = computed(() => {
  const stage = props.stages?.find((s) => s.value === props.task.stage);
  return stage?.icon || "i-lucide-inbox";
});
</script>
