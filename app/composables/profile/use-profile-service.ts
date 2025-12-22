import { useProfileRepository } from "./use-profile-repository";
import type { Database } from "~/types/database.types";

export const useProfileService = () => {
  const repository = useProfileRepository();

  async function getProfile(userId: string) {
    return await repository.getOne(userId);
  }

  async function updateProfile(userId: string, data: TProfileUpdate) {
    return await repository.update(userId, data);
  }

  async function uploadAvatar(userId: string, file: File) {
    const publicUrl = await repository.uploadAvatar(userId, file);
    // Update profile with new avatar URL
    await repository.update(userId, { avatar_url: publicUrl });
    return publicUrl;
  }

  return {
    getProfile,
    updateProfile,
    uploadAvatar,
  };
};
