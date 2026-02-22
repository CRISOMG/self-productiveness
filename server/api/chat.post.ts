import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  type ModelMessage,
  type UserContent,
  type UserModelMessage,
  type FilePart,
} from "ai";
import { serverSupabaseUser, serverSupabaseClient } from "#supabase/server";
import type { Database } from "~~/app/types/database.types";
import {
  createAIProvider,
  loadSystemPrompt,
} from "~~/server/utils/ai/provider";
import { decryptSecret } from "~~/server/utils/vault";

// 1. Tipos estrictos para la comunicación interna
export interface IncomingMessage {
  role: "user" | "assistant" | "system";
  content?: string;
  parts?: UserContent;
  usePro?: boolean;
}

interface SourceUrlPart {
  type: "source-url";
  sourceId: string;
  title: string;
  url: string;
  providerMetadata: any;
}

interface ChatBody {
  messages: IncomingMessage[];
}

export default defineEventHandler(async (event) => {
  // 1. Parsing and validation
  const config = useRuntimeConfig();
  const user = await serverSupabaseUser(event);

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const userId = user.sub;
  const supabase = await serverSupabaseClient<Database>(event);

  let messages: IncomingMessage[] = [];
  let body: ChatBody | null = null;

  try {
    body = await readBody(event);
    messages = (body?.messages || []) as IncomingMessage[];
  } catch (e) {
    console.error("[API] Failed to read body:", e);
    messages = [];
  }
  // 2. Detectar selección de modelo [use pro]
  const lastMessage = messages[messages.length - 1];
  let isPro = lastMessage?.usePro;

  // 3. Normalización y extracción de archivos adjuntos
  const sourceFiles: { url: string; mimeType: string; path?: string }[] = [];

  const safeMessages = messages.map((m) => {
    const originalParts = (m.parts || []) as any[];

    // Extract source-url parts
    const sourceUrlParts = originalParts.filter(
      (p) => p.type === "source-url",
    ) as SourceUrlPart[];

    sourceUrlParts.forEach((p) => {
      const mimeType =
        p.providerMetadata?.supabaseStorage?.mimeType ||
        p.providerMetadata?.googleDrive?.mimeType ||
        "application/octet-stream";
      const url =
        p.url ||
        p.providerMetadata?.supabaseStorage?.url ||
        p.providerMetadata?.googleDrive?.webViewLink;
      const path = p.providerMetadata?.supabaseStorage?.path;

      if (url) {
        sourceFiles.push({ url, mimeType, path });
      }
    });

    // Keep only standard parts for AI SDK
    const standardParts = originalParts.filter((p) => p.type !== "source-url");

    let content = m.content || "";
    if (
      !content &&
      standardParts.length > 0 &&
      standardParts[0].type === "text"
    ) {
      content = standardParts[0].text;
    }

    return {
      ...m,
      content: content,
      parts: standardParts,
    };
  });

  // Convertimos a ModelMessages
  const modelMessages = (await convertToModelMessages(
    safeMessages as any,
  )) as ModelMessage[];

  // 4. Inyección de archivos multimodales en el último mensaje del usuario
  if (sourceFiles.length > 0 && modelMessages.length > 0) {
    const lastMsg = modelMessages[modelMessages.length - 1];

    if (lastMsg?.role === "user") {
      const userMsg = lastMsg as UserModelMessage;
      const currentContent: UserContent =
        typeof userMsg.content === "string"
          ? [{ type: "text", text: userMsg.content }]
          : userMsg.content;

      // Regenerate fresh signed URLs for files with storage paths
      const fileParts: FilePart[] = await Promise.all(
        sourceFiles
          .filter((f) => !!f.url)
          .map(async (f) => {
            let fileUrl = f.url;

            // If we have the storage path, regenerate a fresh signed URL
            if (f.path) {
              const { data } = await supabase.storage
                .from("yourfocus")
                .createSignedUrl(f.path, 600); // 10 min expiry
              if (data?.signedUrl) {
                fileUrl = data.signedUrl;
              }
            }

            return {
              type: "file" as const,
              data: new URL(fileUrl),
              mediaType: f.mimeType as any,
            };
          }),
      );

      if (fileParts.length > 0) {
        userMsg.content = [...currentContent, ...fileParts];
        console.log(
          `[Chat API] Injected ${fileParts.length} multimodal file(s) into user message`,
        );
      }
    }
  }

  // 5. Cargar system prompt y crear provider
  const systemPrompt = await loadSystemPrompt();

  // 5.5 BYOK Key Resolution: User Key > Community Key > Platform Default
  let resolvedApiKey = config.googleAiApiKey as string;
  let keySource = "platform";

  try {
    // Use service role to bypass RLS for community key lookup
    const { data: userKey } = await supabase
      .from("user_secrets")
      .select("key_value, iv, tag")
      .eq("user_id", user.sub)
      .eq("name", "gemini_user")
      .eq("is_active", true)
      .maybeSingle();

    if (userKey) {
      resolvedApiKey = decryptSecret({
        encrypted: userKey.key_value,
        iv: userKey.iv,
        tag: userKey.tag,
      });
      keySource = "user_byok";
    } else {
      // Try community key
      const { data: communityKey } = await supabase
        .from("user_secrets")
        .select("key_value, iv, tag")
        .is("user_id", null)
        .eq("name", "gemini_community")
        .eq("is_active", true)
        .maybeSingle();

      if (communityKey) {
        resolvedApiKey = decryptSecret({
          encrypted: communityKey.key_value,
          iv: communityKey.iv,
          tag: communityKey.tag,
        });
        keySource = "community";
      }
    }
  } catch (e) {
    console.error(
      "[Chat API] BYOK key resolution failed, using platform key:",
      e,
    );
  }

  // 6. Crear provider con modelo dinámico
  const { model, tools, modelId } = createAIProvider(
    { userId, isPro },
    {
      google: {
        projectId: config.google.projectId,
        clientEmail: config.google.clientEmail,
        privateKey: config.google.privateKey,
      },
      supabase,
      googleAiApiKey: resolvedApiKey,
    },
  );

  console.log(
    `[Chat API] Using model: ${modelId} for user: ${userId} (key: ${keySource})`,
  );

  // 7. Persistir mensaje del usuario ANTES de procesar
  const userMessageContent =
    lastMessage?.content ||
    (lastMessage?.parts as any[])?.find((p) => p.type === "text")?.text ||
    "";

  try {
    const result = await supabase.from("n8n_chat_histories").insert({
      session_id: userId,
      message: {
        type: "human",
        content: userMessageContent,
        additional_kwargs: {},
      } as any,
    });
    console.log("[Chat API] User message persisted:", result);
  } catch (error) {
    console.error("[Chat API] Failed to persist user message:", error);
  }

  // 8. Ejecutar streamText con AI SDK nativo
  const result = streamText({
    model,
    tools,
    messages: modelMessages,
    system: systemPrompt,
    maxSteps: 40, // Límite de pasos para evitar loops infinitos
    stopWhen: stepCountIs(40), // Permite continuación después de tool calls
    maxRetries: 3,
    onFinish: async (params) => {
      // Persistir mensaje del asistente en n8n_chat_histories
      try {
        // Extraer información de tool calls si existen
        const toolCalls = params.steps?.flatMap((step) =>
          step.content
            .filter((c) => c.type === "tool-call")
            .map((c: any) => ({
              name: c.toolName,
              input: c.input,
            })),
        );

        const assistantMessage = {
          type: "ai",
          content: params.text,
          additional_kwargs: {
            tool_calls: toolCalls?.length ? toolCalls : undefined,
          },
          response_metadata: {
            model: modelId,
            usage: params.usage,
            finishReason: params.finishReason,
          },
        };

        const result = await supabase.from("n8n_chat_histories").insert({
          session_id: userId,
          message: assistantMessage as any,
        });
        console.log("[Chat API] Assistant message persisted:", result);
      } catch (error) {
        console.error("[Chat API] Failed to persist assistant message:", error);
      }
    },
  });

  return result.toUIMessageStreamResponse();
});
