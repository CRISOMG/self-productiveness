import { useProfileService } from "./use-profile-service";
import { useSuccessErrorToast } from "../use-success-error-toast";
import type { Database, Tables } from "~/types/database.types";
import type { TimeIntervalConfigs } from "~/utils/pomodoro-domain";

export const useProfileController = () => {
  const service = useProfileService();
  const toast = useSuccessErrorToast();
  const user = useSupabaseUser();

  // Use useState for shared state across components, similar to a store
  const profile = useState<TProfile | null>("user_profile", () => null);
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

  async function handleUpdateProfile(data: TProfileUpdate) {
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

  async function handleSetKeepTagsSetting(value: boolean) {
    if (!profile.value) return;
    try {
      const updatedProfile = await service.updateProfile(profile.value.id, {
        ...profile.value,
        settings: {
          ...((profile.value.settings as Record<string, any>) || {}),
          keep_tags: value,
        },
      });
      profile.value = updatedProfile;
      return updatedProfile;
    } catch (error: any) {
      console.error(error);
      toast.addErrorToast({
        title: "Error updating keep tags setting",
        description: error.message,
      });
    }
  }

  async function handleSetTagFilterMode(mode: "single" | "multiple") {
    if (!profile.value) return;
    try {
      const updatedProfile = await service.updateProfile(profile.value.id, {
        ...profile.value,
        settings: {
          ...((profile.value.settings as Record<string, any>) || {}),
          tag_filter_mode: mode,
        },
      });
      profile.value = updatedProfile;
      return updatedProfile;
    } catch (error: any) {
      console.error(error);
      toast.addErrorToast({
        title: "Error updating tag filter mode",
        description: error.message,
      });
    }
  }

  async function handleSetActiveStage(stage: string) {
    if (!profile.value) return;
    try {
      const updatedProfile = await service.updateProfile(profile.value.id, {
        ...profile.value,
        settings: {
          ...((profile.value.settings as Record<string, any>) || {}),
          active_stage: stage,
        },
      });
      profile.value = updatedProfile;
      return updatedProfile;
    } catch (error: any) {
      console.error(error);
      toast.addErrorToast({
        title: "Error updating active stage",
        description: error.message,
      });
    }
  }

  async function handleSetTimeIntervalConfigs(configs: TimeIntervalConfigs) {
    if (!profile.value) return;
    try {
      const updatedProfile = await service.updateProfile(profile.value.id, {
        ...profile.value,
        settings: {
          ...((profile.value.settings as Record<string, any>) || {}),
          time_interval_configs: configs,
        },
      });
      profile.value = updatedProfile;
      return updatedProfile;
    } catch (error: any) {
      console.error(error);
      toast.addErrorToast({
        title: "Error updating time interval configs",
        description: error.message,
      });
    }
  }

  async function handleSetOfferTermsAccepted() {
    if (!profile.value) return;
    try {
      const updatedProfile = await service.updateProfile(profile.value.id, {
        ...profile.value,
        settings: {
          ...((profile.value.settings as Record<string, any>) || {}),
          offerTermsAccepted: true,
        },
      });
      profile.value = updatedProfile;
      return updatedProfile;
    } catch (error: any) {
      console.error(error);
      toast.addErrorToast({
        title: "Error updating offer terms acceptance",
        description: error.message,
      });
    }
  }

  // Hi! from cristian caraballo <3
  async function handleSetProfileSettingsKey(key: string, value: any) {
    if (!profile.value) throw new Error("Profile not found");
    try {
      const newValue =
        typeof value === "object"
          ? {
              [key]: {
                ...((profile.value.settings[key] as Record<string, any>) || {}),
                ...value,
              },
            }
          : {
              [key]: value,
            };

      const updatedProfile = await service.updateProfile(profile.value.id, {
        ...profile.value,
        settings: {
          ...((profile.value.settings as Record<string, any>) || {}),
          ...newValue,
        },
      });
      profile.value = updatedProfile;
      return updatedProfile;
    } catch (error: any) {
      console.error(error);
      toast.addErrorToast({
        title: "Error updating profile settings",
        description: error.message,
      });
    }
  }

  return {
    profile,
    loading,
    handleGetProfile,
    handleUpdateProfile,
    handleUploadAvatar,
    createToken,
    handleSetKeepTagsSetting,
    handleSetTagFilterMode,
    handleSetActiveStage,
    handleSetTimeIntervalConfigs,
    handleSetOfferTermsAccepted,
    handleSetProfileSettingsKey,
  };
};
