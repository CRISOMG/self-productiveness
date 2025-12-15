import { useTagRepository } from "./use-tag-repository";
import { normalizeTagLabel, isValidTagLabel } from "./use-tag-domain";

export const useTagService = () => {
  const repository = useTagRepository();

  async function createTag(label: string, userId: string) {
    const normalized = normalizeTagLabel(label);
    if (!isValidTagLabel(normalized)) {
      throw new Error("Invalid tag label");
    }

    return await repository.insert({
      label: normalized,
      user_id: userId,
      // type is optional/null for custom tags
    });
  }

  async function searchTags(query: string, userId: string) {
    if (!query) return [];
    return await repository.search(query, userId);
  }

  async function getUserTags(userId: string) {
    return await repository.listByUserId(userId);
  }

  return {
    createTag,
    searchTags,
    getUserTags,
  };
};
