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
  const contentType = getHeader(event, "content-type");
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

  // 3. Normalización y extracción de metadata de Google Drive
  const googleDriveMetadata: any[] = [];

  const safeMessages = messages.map((m) => {
    const originalParts = (m.parts || []) as any[];

    // Extract source-url parts
    const sourceUrlParts = originalParts.filter(
      (p) => p.type === "source-url",
    ) as SourceUrlPart[];

    sourceUrlParts.forEach((p) => {
      if (p.providerMetadata?.googleDrive) {
        googleDriveMetadata.push(p.providerMetadata.googleDrive);
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

  // 5. Cargar system prompt y crear provider
  const systemPrompt = await loadSystemPrompt();

  // Inyectar contexto de archivos adjuntos si existen
  let contextMessage = "";
  if (googleDriveMetadata.length > 0) {
    contextMessage = `\n\n[ARCHIVOS ADJUNTOS]\n${JSON.stringify(googleDriveMetadata, null, 2)}`;
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
      googleAiApiKey: config.googleAiApiKey,
    },
  );

  console.log(`[Chat API] Using model: ${modelId} for user: ${userId}`);

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
    system: systemPrompt + contextMessage,
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
