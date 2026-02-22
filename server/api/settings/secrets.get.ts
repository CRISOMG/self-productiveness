// server/api/settings/secrets.get.ts
// Returns status of user's configured secrets (BYOK & Community keys)
import { serverSupabaseUser, serverSupabaseClient } from "#supabase/server";
import type { Database } from "~~/app/types/database.types";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const supabase = await serverSupabaseClient<Database>(event);

  // Fetch user's own secrets
  const { data: userSecrets, error: userError } = await supabase
    .from("user_secrets")
    .select("id, name, is_active, created_at, updated_at")
    .eq("user_id", user.sub);

  if (userError) {
    throw createError({ statusCode: 500, statusMessage: userError.message });
  }

  // Fetch community secrets (user_id IS NULL)
  const { data: communitySecrets, error: communityError } = await supabase
    .from("user_secrets")
    .select("id, name, is_active, created_at, updated_at")
    .is("user_id", null);

  if (communityError) {
    throw createError({
      statusCode: 500,
      statusMessage: communityError.message,
    });
  }

  // Build a status map (never expose actual keys)
  const buildStatus = (secrets: typeof userSecrets) =>
    (secrets || []).map((s) => ({
      id: s.id,
      name: s.name,
      is_active: s.is_active,
      created_at: s.created_at,
      updated_at: s.updated_at,
    }));

  return {
    user: buildStatus(userSecrets),
    community: buildStatus(communitySecrets),
  };
});
