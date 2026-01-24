import {
  streamText,
  convertToModelMessages,
  type ModelMessage,
  type UserContent,
  type UserModelMessage,
  type FilePart,
} from "ai";

// 1. Tipos estrictos para la comunicación interna
// Definimos lo que esperamos del Frontend de forma compatible con el SDK
export interface IncomingMessage {
  role: "user" | "assistant" | "system";
  content?: string;
  parts?: UserContent;
}
/**
 * 
 parts {
  type: "source-url",
  sourceId: "1m61Clq0dYXwGPqfskMjlLGnUPHTdG02d",
  title: "chat.md",
  url: "https://drive.google.com/file/d/1m61Clq0dYXwGPqfskMjlLGnUPHTdG02d/view?usp=drivesdk",
  providerMetadata: {
    googleDrive: {
      fileId: "1m61Clq0dYXwGPqfskMjlLGnUPHTdG02d",
      webViewLink: "https://drive.google.com/file/d/1m61Clq0dYXwGPqfskMjlLGnUPHTdG02d/view?usp=drivesdk",
      mimeType: "text/plain",
    },
  },
}
 */
export default defineEventHandler(async (event) => {
  // 1. Parsing and validation
  const { id } = getRouterParams(event);
  const contentType = getHeader(event, "content-type");

  let messages: IncomingMessage[] = [];
  let files: FilePart[] = [];

  if (contentType?.includes("multipart/form-data")) {
    const formData = await readMultipartFormData(event);
    if (formData) {
      const messagesPart = formData.find((p) => p.name === "messages");
      if (messagesPart) {
        messages = JSON.parse(
          messagesPart.data.toString(),
        ) as IncomingMessage[];
      }

      const fileParts = formData.filter((p) => p.name === "file");
      files = fileParts.map((p) => ({
        type: "file",
        mimeType: p.type || "application/octet-stream",
        mediaType: p.type || "application/octet-stream", // Assuming mediaType is the same as mimeType if not specified
        data: p.data,
        filename: p.filename || undefined,
      }));
    }
  } else if (contentType?.includes("application/json")) {
    const body = await readBody(event);
    messages = (body?.messages || []) as IncomingMessage[];
  } else {
    try {
      const body = await readBody(event);
      messages = (body?.messages || []) as IncomingMessage[];
    } catch (e) {
      console.error("[API] Failed to read body:", e);
      messages = [];
    }
  }

  // 2. Normalización y Conversión
  // Aseguramos que cada mensaje tenga 'content' como string para cumplir con UIMessage
  interface SourceUrlPart {
    type: "source-url";
    sourceId: string;
    title: string;
    url: string;
    providerMetadata: any;
  }

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

    // If message content was purely source-url, we ensure it has at least empty text
    // otherwise SDK might complain about empty content
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

  // Convertimos a ModelMessages (esto ya devuelve CoreMessage[])
  const modelMessages = (await convertToModelMessages(
    safeMessages as any, // Cast to any to avoid strict type mismatch with custom parts filtering outcome
  )) as ModelMessage[];

  // 3. Inyección de Archivos (Post-Conversión para evitar filtrado)
  if (files.length > 0 && modelMessages.length > 0) {
    const lastMessage = modelMessages[modelMessages.length - 1];

    if (lastMessage.role === "user") {
      const userMsg = lastMessage as UserModelMessage;

      // Convertimos el contenido a array de partes si era un string plano
      const currentContent: UserContent =
        typeof userMsg.content === "string"
          ? [{ type: "text", text: userMsg.content }]
          : userMsg.content;

      // Inyectamos los archivos. El tipo FilePart es nativo del AI SDK en UserContent.
      userMsg.content = [...currentContent, ...files];
    }
  }

  // Inject Google Drive Metadata as System Message
  if (googleDriveMetadata.length > 0) {
    const metadataString = JSON.stringify({
      context: "attached_files",
      files: googleDriveMetadata,
    });

    // We insert it at the beginning or end?
    // Usually system messages go first or alongside user message.
    // Since n8n provider extracts system messages from the whole prompt, position doesn't strictly matter for extraction,
    // but logically it fits as a preamble.
    modelMessages.unshift({
      role: "system",
      content: metadataString,
    });
  }

  // 4. Perfil de usuario y ejecución
  const userId = "8130067397";

  const result = await streamText({
    model: n8n({ userId }),
    messages: modelMessages,
  });

  return result.toUIMessageStreamResponse();
});
