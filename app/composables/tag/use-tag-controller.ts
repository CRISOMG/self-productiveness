import { useTagService } from "./use-tag-service";
import type { Tag } from "~/types/Pomodoro";

export const useSelectedTags = (initial: any[] = []) => {
  return useState<any[]>("selected_tags", () => initial);
};

export const useKeepSelectedTags = () => {
  return useState<boolean>("keep_tags", () => false);
};

export type TUserTags = Tag["Row"][];
export const useTagController = () => {
  const { createTag, searchTags, getUserTags } = useTagService();
  const { profile } = useProfileController();

  // State for UI
  const searchResults = ref<TUserTags>([]);
  const userTags = useState<TUserTags>("user_tags", () => []);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function handleSearch(query: string) {
    if (!profile.value) return;
    isLoading.value = true;
    try {
      const results = await searchTags(query, profile.value.id);
      searchResults.value = (results || []) as TUserTags;
    } catch (e: any) {
      error.value = e.message;
    } finally {
      isLoading.value = false;
    }
  }

  async function handleCreateTag(
    label: string
  ): Promise<Tag["Row"] | undefined> {
    if (!profile.value) return;
    isLoading.value = true;
    try {
      const newTag = await createTag(label, profile.value.id);
      // Refresh user tags
      await loadUserTags();
      return newTag as Tag["Row"];
    } catch (e: any) {
      error.value = e.message;
    } finally {
      isLoading.value = false;
    }
  }

  async function loadUserTags() {
    if (!profile.value) return;
    isLoading.value = true;
    try {
      const tags = await getUserTags(profile.value.id);
      userTags.value = (tags || []) as TUserTags;
    } catch (e: any) {
      error.value = e.message;
    } finally {
      isLoading.value = false;
    }
  }

  watch(
    () => profile.value,
    () => {
      if (!profile.value) return;
      loadUserTags();
    },
    { immediate: true }
  );

  return {
    searchResults,
    userTags,
    isLoading,
    error,
    handleSearch,
    handleCreateTag,
    loadUserTags,
  };
};
