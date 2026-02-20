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
            <li
              v-for="(step, idx) in steps"
              :key="idx"
              v-html="renderRequirement(step)"
            />
          </ol>
        </div>

        <!-- Requirements -->
        <div class="space-y-3">
          <h4 class="text-sm font-semibold">
            {{ t("specialOffer.requirementsTitle") }}
          </h4>
          <ul class="list-disc list-inside space-y-2 text-sm text-muted">
            <li
              v-for="(req, idx) in requirements"
              :key="idx"
              v-html="renderRequirement(req)"
            />
          </ul>
        </div>

        <div></div>
        <!-- Name input -->
        <div class="space-y-2 mt-4">
          <label class="text-sm font-semibold" for="special-offer-name">
            {{ t("specialOffer.nameLabel") }}
          </label>
          <UInput
            id="special-offer-name"
            v-model="name"
            :placeholder="t('specialOffer.namePlaceholder')"
            size="lg"
          />
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
          :disabled="!acceptedTerms || !name.trim()"
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
const name = ref("");
const emit = defineEmits<{ start: [payload: { name: string }] }>();

const requirementLinks: Record<string, string> = {
  LinkedIn: "https://www.linkedin.com/in/crisomg/",
  GitHub: "https://github.com/CRISOMG/yourfocus",
  Crypto: "https://github.com/CRISOMG/yourfocus/issues/2",
};

function renderRequirement(req: string): string {
  let html = req;
  for (const [keyword, url] of Object.entries(requirementLinks)) {
    if (html.includes(keyword)) {
      html = html.replace(
        keyword,
        `<a href="${url}" target="_blank" rel="noopener noreferrer" class="underline text-peach-400 hover:text-peach-300 transition-colors">${keyword}</a>`,
      );
    }
  }
  return html;
}

const steps = computed(() => {
  const steps = t("specialOffer.steps").split(";");

  return steps.map((s: string) => s.trim());
});

const requirements = computed(() => {
  const requirements = t("specialOffer.requirements").split(";");
  return requirements.map((s: string) => s.trim());
});

async function handleStart() {
  await handleSetOfferTermsAccepted();
  isOpen.value = false;
  emit("start", { name: name.value.trim() });
}
</script>
