<template>
  <UModal
    :ui="{ content: ' sm:max-w-lg' }"
    :overlay="true"
    v-model:open="isOpen"
    :title="t('specialOffer.title')"
    prevent-close
  >
    <template #body>
      <div class="p-4 space-y-4">
        <p class="text-sm text-muted">
          {{ t("specialOffer.description") }}
        </p>

        <!-- Steps / Requirements -->
        <div class="space-y-3">
          <h4 class="text-sm font-semibold">
            {{ t("specialOffer.stepsTitle") }}
          </h4>
          <ol class="list-decimal list-inside space-y-2 text-sm text-muted">
            <li v-for="(step, idx) in steps" :key="idx">
              {{ step }}
            </li>
          </ol>
        </div>

        <!-- Requirements -->
        <div class="space-y-3">
          <h4 class="text-sm font-semibold">
            {{ t("specialOffer.requirementsTitle") }}
          </h4>
          <ul class="list-disc list-inside space-y-2 text-sm text-muted">
            <li v-for="(req, idx) in requirements" :key="idx">
              {{ req }}
            </li>
          </ul>
        </div>

        <!-- Terms checkbox -->
        <label class="flex items-start gap-2 cursor-pointer select-none mt-4">
          <input
            v-model="acceptedTerms"
            type="checkbox"
            class="mt-0.5 accent-peach-500 w-4 h-4 rounded"
          />
          <span class="text-sm text-muted">
            {{ t("specialOffer.acceptTerms") }}
          </span>
        </label>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          color="primary"
          :disabled="!acceptedTerms"
          @click="handleStart"
        >
          {{ t("specialOffer.startButton") }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const { t } = useI18n();
const { handleSetOfferTermsAccepted } = useProfileController();
const isOpen = defineModel<boolean>({ default: false });
const acceptedTerms = ref(false);
const emit = defineEmits<{ start: [] }>();

const steps = computed(() =>
  t("specialOffer.steps")
    .split("|")
    .map((s: string) => s.trim()),
);

const requirements = computed(() =>
  t("specialOffer.requirements")
    .split("|")
    .map((s: string) => s.trim()),
);

async function handleStart() {
  await handleSetOfferTermsAccepted();
  isOpen.value = false;
  emit("start");
}
</script>
