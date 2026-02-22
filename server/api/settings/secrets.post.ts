// server/api/settings/secrets.post.ts
// Save or update an encrypted API key for the authenticated user
import { serverSupabaseUser, serverSupabaseClient } from "#supabase/server";
import type { Database } from "~~/app/types/database.types";
import { encryptSecret } from "~~/server/utils/vault";

interface SecretBody {
  name: string; // e.g. 'gemini_user'
  key: string; // plaintext API key (received over HTTPS)
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const body = await readBody<SecretBody>(event);

  if (!body?.name || !body?.key) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing 'name' and 'key' fields",
    });
  }

  // Encrypt the key server-side
  const { encrypted, iv, tag } = encryptSecret(body.key);

  const supabase = await serverSupabaseClient<Database>(event);

  // Upsert: update if exists, insert if not
  // First try to find existing
  const { data: existing } = await supabase
    .from("user_secrets")
    .select("id")
    .eq("user_id", user.sub)
    .eq("name", body.name)
    .maybeSingle();

  if (existing) {
    // Update existing secret
    const { error } = await supabase
      .from("user_secrets")
      .update({
        key_value: encrypted,
        iv,
        tag,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) {
      throw createError({ statusCode: 500, statusMessage: error.message });
    }

    return { status: "updated", name: body.name };
  } else {
    // Insert new secret
    const { error } = await supabase.from("user_secrets").insert({
      user_id: user.sub,
      name: body.name,
      key_value: encrypted,
      iv,
      tag,
      is_active: true,
    });

    if (error) {
      throw createError({ statusCode: 500, statusMessage: error.message });
    }

    return { status: "created", name: body.name };
  }
});
