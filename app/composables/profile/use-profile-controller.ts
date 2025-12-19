import { useProfileService } from "./use-profile-service";
import { useSuccessErrorToast } from "../use-success-error-toast";
import type { Database } from "~/types/database.types";

export const useProfileController = () => {
  const service = useProfileService();
  const toast = useSuccessErrorToast();
  const user = useSupabaseUser();

  // Use useState for shared state across components, similar to a store
  const profile = useState<
    Database["public"]["Tables"]["profiles"]["Row"] | null
  >("user_profile", () => null);
  const loading = useState<boolean>("profile_loading", () => false);

  async function handleGetProfile() {
    if (!user.value) return;
    loading.value = true;
    try {
      const data = await service.getProfile(user.value.sub);
      profile.value = data;
      return data;
    } catch (error: any) {
      console.error(error);
      toast.addErrorToast({
        title: "Error fetching profile",
        description: error.message,
      });
    } finally {
      loading.value = false;
    }
  }

  async function handleUpdateProfile(data: {
    username?: string;
    fullname?: string;
    avatar_url?: string;
    settings?: Record<string, any>;
  }) {
    if (!user.value) return;
    loading.value = true;
    try {
      const updatedProfile = await service.updateProfile(user.value.sub, {
        ...data,
        updated_at: new Date().toISOString(),
      });
      profile.value = updatedProfile;
      toast.addSuccessToast({
        title: "Success",
        description: "Profile updated successfully",
      });
      return updatedProfile;
    } catch (error: any) {
      console.error(error);
      toast.addErrorToast({
        title: "Error updating profile",
        description: error.message,
      });
    } finally {
      loading.value = false;
    }
  }

  async function handleUploadAvatar(file: File) {
    if (!user.value) return;
    loading.value = true;
    try {
      const avatarUrl = await service.uploadAvatar(user.value.sub, file);
      // Update local state as well since service updates DB but we might want immediate reflection if we didn't refetch
      if (profile.value) {
        profile.value.avatar_url = avatarUrl;
      }
      toast.addSuccessToast({
        title: "Success",
        description: "Avatar uploaded successfully",
      });
      return avatarUrl;
    } catch (error: any) {
      console.error(error);
      toast.addErrorToast({
        title: "Error uploading avatar",
        description: error.message,
      });
    } finally {
      loading.value = false;
    }
  }

  watch(user, () => {
    if (!loading.value) {
      handleGetProfile();
    }
  });

  type TCreateToken = {
    token: string;
    id: string;
    name: string;
    message: string;
  };

  const createToken = async (): Promise<TCreateToken | null> => {
    try {
      const { data, error } = await useFetch("/api/token/generate", {
        method: "POST",
        body: { name: "N8N Token" },
      });

      if (error.value) {
        throw error.value;
      }

      return data.value;
    } catch (e) {
      console.error("Error generando token", e);
      return null;
    }
  };
  return {
    profile,
    loading,
    handleGetProfile,
    handleUpdateProfile,
    handleUploadAvatar,
    createToken,
  };
};
