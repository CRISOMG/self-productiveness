<template>
  <UModal v-model:open="isOpen" title="Interval Settings">
    <template #body>
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Focus (min)</label>
          <UInput
            v-model.number="form.focus"
            type="number"
            :min="1"
            :max="120"
            placeholder="25"
            size="sm"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Short Break (min)</label>
          <UInput
            v-model.number="form.short_break"
            type="number"
            :min="1"
            :max="60"
            placeholder="5"
            size="sm"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Long Break (min)</label>
          <UInput
            v-model.number="form.long_break"
            type="number"
            :min="1"
            :max="60"
            placeholder="15"
            size="sm"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Long Break Interval</label>
          <UInput
            v-model.number="form.long_break_interval"
            type="number"
            :min="1"
            :max="10"
            placeholder="4"
            size="sm"
          />
          <span class="text-xs text-muted"
            >Number of focus sessions before a long break</span
          >
        </div>

        <USeparator />

        <div class="flex items-center justify-between">
          <label class="text-sm font-medium">Autoplay</label>
          <USwitch v-model="form.autoplay" />
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex gap-2 justify-end w-full">
        <UButton color="neutral" variant="outline" @click="isOpen = false">
          Cancel
        </UButton>
        <UButton color="primary" :loading="loading" @click="handleSave">
          Save
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import {
  DEFAULT_TIME_INTERVAL_CONFIGS,
  type TimeIntervalConfigs,
} from "~/utils/pomodoro-domain";

const { profile, handleSetTimeIntervalConfigs, loading } =
  useProfileController();

const isOpen = defineModel<boolean>("open", { default: false });

const form = reactive<TimeIntervalConfigs>({
  ...DEFAULT_TIME_INTERVAL_CONFIGS,
});

// Sync form with profile settings when modal opens
watch(isOpen, (open) => {
  if (open) {
    const saved = (profile.value?.settings as any)?.time_interval_configs;
    Object.assign(form, { ...DEFAULT_TIME_INTERVAL_CONFIGS, ...saved });
  }
});

async function handleSave() {
  await handleSetTimeIntervalConfigs({ ...form });
  isOpen.value = false;
}
</script>
