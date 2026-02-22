<template>
  <UModal
    v-model:open="isOpen"
    title="Credentials"
    :ui="{ content: 'sm:max-w-xl' }"
  >
    <template #body>
      <UTabs :items="tabs" class="w-full">
        <template #content="{ item }">
          <!-- Access Tokens Tab -->
          <div v-if="item.value === 'pat'" class="space-y-4 pt-4">
            <UTable
              :data="personalAccessTokens"
              :columns="patColumns"
              class="flex-1"
            />
            <div class="flex justify-center">
              <UButton
                @click="handleCreateToken"
                :loading="loadingNewPAT"
                color="success"
                icon="i-lucide-plus"
              >
                Create New Token
              </UButton>
            </div>
          </div>

          <!-- AI Providers Tab -->
          <div v-if="item.value === 'ai'" class="space-y-6 pt-4">
            <!-- Personal Key -->
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-user" class="text-lg" />
                <h4 class="font-semibold">Personal Key (BYOK)</h4>
              </div>
              <p class="text-sm text-[var(--ui-text-dimmed)]">
                Bring your own Gemini API Key from
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  class="underline"
                  >Google AI Studio</a
                >.
              </p>

              <div v-if="userKeyStatus" class="flex items-center gap-2">
                <UBadge color="success" variant="subtle">Configured</UBadge>
                <span class="text-xs text-[var(--ui-text-dimmed)]"
                  >Updated {{ formatDate(userKeyStatus.updated_at) }}</span
                >
                <UButton
                  icon="i-lucide-trash-2"
                  color="error"
                  variant="ghost"
                  size="xs"
                  @click="handleDeleteSecret(userKeyStatus.id)"
                />
              </div>

              <form @submit.prevent="handleSaveUserKey" class="flex gap-2">
                <UInput
                  v-model="userKeyInput"
                  :placeholder="
                    userKeyStatus ? '••••••••••••••••' : 'AIzaSy...'
                  "
                  type="password"
                  class="flex-1"
                  icon="i-lucide-key"
                />
                <UButton
                  type="submit"
                  :loading="savingUserKey"
                  :disabled="!userKeyInput"
                  color="primary"
                >
                  {{ userKeyStatus ? "Update" : "Save" }}
                </UButton>
              </form>
            </div>

            <USeparator />

            <!-- Community Key -->
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-users" class="text-lg" />
                <h4 class="font-semibold">Community Key</h4>
              </div>
              <p class="text-sm text-[var(--ui-text-dimmed)]">
                Shared key assigned by Yourfocus based on eligibility.
              </p>
              <div v-if="communityKeyStatus">
                <UBadge
                  :color="communityKeyStatus.is_active ? 'success' : 'neutral'"
                  variant="subtle"
                >
                  {{ communityKeyStatus.is_active ? "Active" : "Inactive" }}
                </UBadge>
              </div>
              <div v-else>
                <UBadge color="warning" variant="subtle">Not assigned</UBadge>
              </div>
            </div>

            <USeparator />

            <!-- Consumption (Future) -->
            <div class="space-y-3 opacity-60">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-bar-chart-3" class="text-lg" />
                <h4 class="font-semibold">Usage & Consumption</h4>
                <UBadge color="info" variant="subtle" size="xs"
                  >Coming Soon</UBadge
                >
              </div>
              <p class="text-sm text-[var(--ui-text-dimmed)]">
                Monthly token usage tracking will be available here.
              </p>
            </div>
          </div>
        </template>
      </UTabs>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Database } from "~/types/database.types";
import { useClipboard } from "@vueuse/core";

const isOpen = defineModel<boolean>({ default: false });

// --- Tabs ---
const tabs = [
  { label: "Access Tokens", value: "pat", icon: "i-lucide-key" },
  { label: "AI Providers", value: "ai", icon: "i-lucide-brain" },
];

// --- PAT Section (migrated from personal-access-token-modal) ---
type TPersonalAccessTokens = {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  user_id: string;
} & Database["public"]["Tables"]["api_keys"]["Row"];

const toast = useToast();
const { copy } = useClipboard();
const supabase = useSupabaseClient();
const profileController = useProfileController();

const personalAccessTokens = ref<TPersonalAccessTokens[]>([]);
const loadingNewPAT = ref(false);

function handleListApiKeys() {
  supabase
    .from("api_keys")
    .select("*")
    .then((res) => {
      personalAccessTokens.value = res.data as TPersonalAccessTokens[];
    });
}

const patColumns: TableColumn<TPersonalAccessTokens>[] = [
  { accessorKey: "name", header: "Name" },
  {
    accessorKey: "is_active",
    header: "Active",
    cell: ({ row }) => (row.getValue("is_active") ? "Yes" : "No"),
  },
  {
    accessorKey: "created_at",
    header: "Created At",
    cell: ({ row }) =>
      new Date(row.getValue("created_at")).toLocaleString("en-US", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
  },
  {
    id: "actions",
    cell: ({ row }) =>
      h(
        "div",
        { class: "text-right" },
        h(
          UDropdownMenu,
          {
            content: { align: "end" },
            items: [
              {
                label: "Disable Token",
                onSelect() {
                  supabase
                    .from("api_keys")
                    .update({ is_active: false })
                    .eq("id", row.original.id)
                    .then(() => {
                      toast.add({
                        title: "Token disabled!",
                        color: "success",
                        icon: "i-lucide-circle-check",
                      });
                      handleListApiKeys();
                    });
                },
              },
            ],
            "aria-label": "Actions dropdown",
          },
          () =>
            h(UButton, {
              icon: "i-lucide-ellipsis-vertical",
              color: "neutral",
              variant: "ghost",
              class: "ml-auto",
              "aria-label": "Actions dropdown",
            }),
        ),
      ),
  },
];

const handleCreateToken = async () => {
  loadingNewPAT.value = true;
  const token = await profileController.createToken();
  loadingNewPAT.value = false;

  if (token) {
    toast.add({
      title: "Token created!",
      color: "success",
      icon: "i-lucide-circle-check",
    });
    copy(token.token);
    toast.add({
      title: "Token copied to clipboard!",
      color: "success",
      icon: "i-lucide-circle-check",
    });
    handleListApiKeys();
  }
};

// --- AI Providers Section ---
interface SecretStatus {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const userKeyInput = ref("");
const savingUserKey = ref(false);
const userKeyStatus = ref<SecretStatus | null>(null);
const communityKeyStatus = ref<SecretStatus | null>(null);

async function fetchSecretStatuses() {
  try {
    const data = await $fetch("/api/settings/secrets");
    userKeyStatus.value =
      data.user?.find((s: SecretStatus) => s.name === "gemini_user") || null;
    communityKeyStatus.value =
      data.community?.find(
        (s: SecretStatus) => s.name === "gemini_community",
      ) || null;
  } catch (e) {
    console.error("[Credentials] Failed to fetch secrets:", e);
  }
}

async function handleSaveUserKey() {
  if (!userKeyInput.value) return;
  savingUserKey.value = true;

  try {
    await $fetch("/api/settings/secrets", {
      method: "POST",
      body: { name: "gemini_user", key: userKeyInput.value },
    });
    toast.add({
      title: "API Key saved!",
      color: "success",
      icon: "i-lucide-circle-check",
    });
    userKeyInput.value = "";
    await fetchSecretStatuses();
  } catch (e: any) {
    toast.add({
      title: "Failed to save key",
      description: e.message,
      color: "error",
    });
  } finally {
    savingUserKey.value = false;
  }
}

async function handleDeleteSecret(id: string) {
  try {
    await supabase.from("user_secrets").delete().eq("id", id);
    toast.add({
      title: "Key removed!",
      color: "success",
      icon: "i-lucide-circle-check",
    });
    await fetchSecretStatuses();
  } catch (e: any) {
    toast.add({ title: "Failed to remove key", color: "error" });
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

onMounted(() => {
  handleListApiKeys();
  fetchSecretStatuses();
});
</script>
