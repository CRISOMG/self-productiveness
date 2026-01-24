import { type LanguageModel } from "ai";
import {
  type LanguageModelV2,
  type LanguageModelV2CallOptions,
  type LanguageModelV2StreamPart,
} from "@ai-sdk/provider";

interface N8NEvent {
  type: "begin" | "item" | "end";
  content?: string;
  metadata?: any;
}

/**
 * Custom File Part definition for our provider logic
 */
interface ExtendedFilePart {
  type: "file";
  data: Uint8Array | Buffer;
  mimeType?: string;
  mediaType?: string;
  filename?: string;
}

export class N8NLanguageModel implements LanguageModelV2 {
  readonly specificationVersion = "v2";
  readonly provider = "n8n-custom";
  readonly modelId: string;

  constructor(
    modelId: string,
    private options: {
      webhookUrl: string;
      authHeader: string;
      userId?: string;
    },
  ) {
    this.modelId = modelId;
  }

  get supportedUrls() {
    return {};
  }

  async doGenerate(options: LanguageModelV2CallOptions): Promise<any> {
    throw new Error(
      "Non-streaming generation not supported by this n8n provider",
    );
  }

  async doStream(options: LanguageModelV2CallOptions): Promise<{
    stream: ReadableStream<LanguageModelV2StreamPart>;
    rawCall: any;
  }> {
    const { prompt } = options;

    let chatInput = "";
    let systemMessage = "";
    const formData = new FormData();

    if (Array.isArray(prompt)) {
      // Handle User Messages
      const lastUserMessage = prompt.filter((p) => p.role === "user").pop();
      if (lastUserMessage) {
        if (Array.isArray(lastUserMessage.content)) {
          // Extract text content
          chatInput = lastUserMessage.content
            .filter(
              (c): c is { type: "text"; text: string } => c.type === "text",
            )
            .map((c) => c.text || "")
            .join("\n");

          // Extract file content
          const fileParts = lastUserMessage.content.filter(
            (c) => c.type === "file",
          ) as ExtendedFilePart[];

          for (const filePart of fileParts) {
            const fileData = filePart.data;
            const mediaType =
              filePart.mimeType ||
              filePart.mediaType ||
              "application/octet-stream";
            const filename = filePart.filename || "file";

            if (fileData) {
              let blob: Blob;
              // Normalizamos Buffer/Uint8Array de forma segura para el constructor de Blob
              if (fileData instanceof Uint8Array || Buffer.isBuffer(fileData)) {
                blob = new Blob([new Uint8Array(fileData)], {
                  type: mediaType,
                });
              }

              if (typeof fileData === "string") {
                const buffer = Buffer.from(fileData, "base64");
                blob = new Blob([new Uint8Array(buffer)], { type: mediaType });
              }

              // @ts-ignore-next-line
              if (!blob) {
                continue;
              }

              formData.append("file", blob, filename);
            }
          }
        } else if (typeof lastUserMessage.content === "string") {
          chatInput = lastUserMessage.content;
        }
      }

      // Handle System Messages
      const systemMessages = prompt.filter((p) => p.role === "system");
      if (systemMessages.length > 0) {
        systemMessage = systemMessages
          .map((msg) => {
            if (typeof msg.content === "string") {
              return msg.content;
            }
            // If system message has parts (unlikely but possible in V2)
            if (Array.isArray(msg.content as any)) {
              return (msg.content as any)
                .filter((c: any) => c.type === "text")
                .map((c: any) => c.text)
                .join("\n");
            }
            return "";
          })
          .join("\n\n");
      }
    }

    if (!chatInput && !systemMessage) {
      // It's possible to have only system message? Likely not in this context, but let's be safe.
      // The original code threw "No user message found".
      // We'll keep the check loosely but maybe only warn if chatInput is empty?
      // For now, let's keep the user requirement.
    }

    formData.append("chatInput", chatInput);
    if (systemMessage) {
      formData.append("system_message", systemMessage);
    }

    console.log("[N8N] Preparing multipart request:");
    for (const [key, value] of formData.entries()) {
      if (value instanceof Blob) {
        // En Node.js con undici, Blob/File puede que tenga la propiedad name dependiendo de la versión
        const name = "name" in value ? (value as any).name : "blob";
        console.log(
          `  - ${key}: [File] ${name} (${value.type}, ${value.size} bytes)`,
        );
      } else {
        console.log(
          `  - ${key}: ${typeof value === "string" ? value.substring(0, 50) + "..." : "non-string"}`,
        );
      }
    }

    const response = await fetch(this.options.webhookUrl, {
      method: "POST",
      headers: {
        Authorization: this.options.authHeader,
        "x-user-id": this.options.userId || "anonymous",
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(
        `n8n Webhook Error: ${response.status} ${response.statusText}`,
      );
    }

    const stream = new ReadableStream<LanguageModelV2StreamPart>({
      async start(controller) {
        console.log("[N8N] Stream started");
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let hasFinished = false;
        let hasStarted = false;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            console.log("[N8N] Chunk:", chunk);
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            /**
             [12:27:28 PM] [N8N] Chunk: {"type":"error","metadata":{"nodeId":"dbd68695-9053-479f-ad67-4fd2f9d0ff86","nodeName":"Edit Fields2","runIndex":0,"itemIndex":0}}
             */
            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const event: N8NEvent = JSON.parse(line);
                if (event.type === "item" && event.content) {
                  if (!hasStarted) {
                    controller.enqueue({
                      type: "text-start",
                      id: "0",
                      providerMetadata: {},
                    });
                    hasStarted = true;
                  }
                  controller.enqueue({
                    type: "text-delta",
                    id: "0",
                    delta: event.content,
                  });
                } else if (event.type === "end") {
                  // Don't close stream on 'end' event as n8n might send more logs
                  // Just mark irrelevant logic if needed, but here we do nothing
                  // and wait for the actual stream to close
                }
              } catch (e) {
                // Handle raw text lines (debug logs, etc)
                if (!hasStarted) {
                  controller.enqueue({
                    type: "text-start",
                    id: "0",
                    providerMetadata: {},
                  });
                  hasStarted = true;
                }
                controller.enqueue({
                  type: "text-delta",
                  id: "0",
                  delta: line + "\n",
                });
              }
            }
          }

          if (buffer) {
            try {
              const event: N8NEvent = JSON.parse(buffer);
              if (event.type === "item" && event.content) {
                if (!hasStarted) {
                  controller.enqueue({
                    type: "text-start",
                    id: "0",
                    providerMetadata: {},
                  });
                  hasStarted = true;
                }
                controller.enqueue({
                  type: "text-delta",
                  id: "0",
                  delta: event.content,
                });
              }
            } catch (e) {
              if (!hasStarted) {
                controller.enqueue({
                  type: "text-start",
                  id: "0",
                  providerMetadata: {},
                });
                hasStarted = true;
              }
              controller.enqueue({
                type: "text-delta",
                id: "0",
                delta: buffer,
              });
            }
          }

          // Always finish cleanly when the stream really ends
          if (hasStarted) controller.enqueue({ type: "text-end", id: "0" });
          controller.enqueue({
            type: "finish",
            finishReason: "stop",
            usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
          });
        } catch (err) {
          controller.error(err);
        } finally {
          reader.releaseLock();
          controller.close();
        }
      },
    });

    return { stream, rawCall: { rawPrompt: prompt, rawSettings: {} } };
  }
}

export const n8n = (config: { userId?: string }) => {
  const runtimeConfig = useRuntimeConfig();
  return new N8NLanguageModel("n8n-agent", {
    webhookUrl: runtimeConfig.n8nWebhookUrl as string,
    authHeader: runtimeConfig.n8nAuthHeader as string,
    userId: config.userId,
  }) as unknown as LanguageModel;
};
