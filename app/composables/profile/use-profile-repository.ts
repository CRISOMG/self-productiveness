import type { Database, Tables, TablesUpdate } from "~/types/database.types";

export interface TProfile extends Tables<"profiles"> {
  settings: Record<string, any>;
}

export interface TProfileUpdate extends TablesUpdate<"profiles"> {
  settings?: Record<string, any>;
}
export const useProfileRepository = () => {
  const supabase = useSupabaseClient<Database>();

  async function getOne(id: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as TProfile;
  }

  async function update(id: string, profile: TProfileUpdate) {
    const { data, error } = await supabase
      .from("profiles")
      .update(profile)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as TProfile;
  }

  async function uploadAvatar(userId: string, file: File) {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${"avatar"}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    return data.publicUrl as string;
  }

  return {
    getOne,
    update,
    uploadAvatar,
  };
};
