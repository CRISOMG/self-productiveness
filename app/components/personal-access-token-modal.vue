<template>
  <UModal v-model:open="isOpen" title="Personal Access Token">
    <template #body>
      <div class="space-y-4">
        <div class="mt-4">
          <UTable
            :data="personalAccessTokens"
            :columns="columns"
            class="flex-1"
          />
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex gap-1 justify-center w-full">
        <UButton
          @click="handleCreateToken"
          :loading="loadingNewPersonalAccessToken"
          color="success"
          >Create New Personal Access Token</UButton
        >
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Database } from "~/types/database.types";
import { useClipboard } from "@vueuse/core";

const isOpen = defineModel<boolean>({ default: false });

type TPersonalAccessTokens = {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  user_id: string;
} & Database["public"]["Tables"]["api_keys"]["Row"];

const toast = useToast();
const { copy } = useClipboard();

const personalAccessTokens = ref<TPersonalAccessTokens[]>([]);
const loadingNewPersonalAccessToken = ref(false);

function handleListApiKeys() {
  supabase
    .from("api_keys")
    .select("*")
    .then((res) => {
      personalAccessTokens.value = res.data as TPersonalAccessTokens[];
    });
}
const columns: TableColumn<TPersonalAccessTokens>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "is_active",
    header: "Active",
    cell: ({ row }) => {
      return row.getValue("is_active") ? "Yes" : "No";
    },
  },
  {
    accessorKey: "created_at",
    header: "Created At",
    cell: ({ row }) => {
      return new Date(row.getValue("created_at")).toLocaleString("en-US", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return h(
        "div",
        { class: "text-right" },
        h(
          UDropdownMenu,
          {
            content: {
              align: "end",
            },
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
            })
        )
      );
    },
  },
];

const profileController = useProfileController();

const supabase = useSupabaseClient();

onMounted(() => {
  handleListApiKeys();
});

const handleCreateToken = async () => {
  loadingNewPersonalAccessToken.value = true;
  const token = await profileController.createToken();
  loadingNewPersonalAccessToken.value = false;

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
  }
};
</script>
