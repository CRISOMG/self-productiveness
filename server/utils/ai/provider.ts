// server/utils/ai/provider.ts
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~~/app/types/database.types";
import { createTools } from "./tools";
import type { AIConfig } from "./types";
import { readFile } from "fs/promises";
import { join } from "path";

const MODELS = {
  flash: "gemini-3-flash-preview",
  pro: "gemini-3-pro-preview", // Pro can be changed when available
} as const;

let systemPromptCache: string | null = null;

/**
 * Carga el system prompt desde el archivo
 */
export async function loadSystemPrompt(): Promise<string> {
  if (systemPromptCache) {
    return systemPromptCache;
  }

  try {
    const promptPath = join(
      process.cwd(),
      "n8n",
      "prompts",
      "system_prompt.md",
    );
    systemPromptCache = await readFile(promptPath, "utf-8");
    return systemPromptCache;
  } catch (error) {
    console.error("Error loading system prompt:", error);
    return "Eres un asistente de IA útil.";
  }
}

interface ProviderConfig {
  google: {
    projectId: string;
    clientEmail: string;
    privateKey: string;
  };
  supabase: SupabaseClient<Database>;
  googleAiApiKey: string;
}

/**
 * Crea el provider de AI SDK con el modelo y tools configurados
 */
export function createAIProvider(
  config: AIConfig,
  providerConfig: ProviderConfig,
) {
  const google = createGoogleGenerativeAI({
    apiKey: providerConfig.googleAiApiKey,
  });

  const modelId = config.isPro ? MODELS.pro : MODELS.flash;
  const model = google(modelId);

  const tools = createTools({
    userId: config.userId,
    google: providerConfig.google,
    supabase: providerConfig.supabase,
  });

  return { model, tools, modelId };
}

export { MODELS };
