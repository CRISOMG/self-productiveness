<template>
  <div class="w-full overflow-y-scroll custom-scrollbar p-0 sm:p-0">
    <DragDropOverlay :show="isDragging" />
    <div
      ref="dropzoneRef"
      class="flex-1 flex flex-col gap-4 sm:gap-6 min-h-full"
    >
      <UChatMessages
        should-auto-scroll
        should-scroll-to-bottom
        :messages="chat.messages"
        :status="chat.status"
        :assistant="
          chat.status !== 'streaming'
            ? {
                actions: [
                  {
                    label: 'Copy',
                    icon: copied ? 'i-lucide-copy-check' : 'i-lucide-copy',
                    onClick: copy,
                  },
                ],
              }
            : { actions: [] }
        "
        :spacing-offset="160"
        :ui="{
          root: 'flex-1 flex min-h-full',
        }"
      >
        <template #content="{ message }">
          <template
            v-for="(part, index) in message.parts"
            :key="`${message.id}-${part.type}-${index}${'state' in part ? `-${part.state}` : ''}`"
          >
            <Reasoning
              v-if="part.type === 'reasoning'"
              :text="part.text"
              :is-streaming="part.state !== 'done'"
            />
            <!-- Only render markdown for assistant messages to prevent XSS from user input -->
            <template
              v-else-if="part.type === 'text' && message.role === 'assistant'"
            >
              <template
                v-for="(component, compIndex) in parseMessageComponents(
                  part.text,
                )"
                :key="compIndex"
              >
                <ToolDebugResult
                  v-if="component.type === 'log'"
                  v-bind="component.log"
                />

                <MDCCached
                  v-if="component.type === 'text'"
                  :value="component.content"
                  :cache-key="`${message.id}-${index}-${compIndex}`"
                  :components="components"
                  :parser-options="{ highlight: false }"
                  class="*:first:mt-0 *:last:mb-0"
                />
              </template>
            </template>
            <div
              v-else-if="part.type === 'file' || part.type === 'source-url'"
              class="flex flex-row gap-2 no-wrap"
            >
              <FileAvatar
                :name="part?.filename || part?.title || 'File'"
                :type="
                  part?.mediaType ||
                  part?.providerMetadata?.supabaseStorage?.mimeType ||
                  part?.providerMetadata?.googleDrive?.mimeType ||
                  'application/octet-stream'
                "
                :url="
                  part?.url ||
                  part?.providerMetadata?.supabaseStorage?.url ||
                  part?.providerMetadata?.googleDrive?.webViewLink ||
                  ''
                "
              />
            </div>
            <!-- User messages are rendered as plain text (safely escaped by Vue) -->
            <UserMessage
              v-else-if="part.type === 'text' && message.role === 'user'"
              :text="part.text"
            />
            <!-- <ToolWeather
                  v-else-if="part.type === 'tool-weather'"
                  :invocation="part as WeatherUIToolInvocation"
                />
                <ToolChart
                  v-else-if="part.type === 'tool-chart'"
                  :invocation="part as ChartUIToolInvocation"
                /> -->
          </template>
        </template>
      </UChatMessages>

      <UChatPrompt
        v-model="input"
        :error="chat.error"
        :disabled="isUploading"
        variant="subtle"
        class="sticky bottom-0 [view-transition-name:chat-prompt] rounded-b-none z-10"
        :ui="{ base: 'px-1.5' }"
        @submit="handleSubmit"
      >
        <template v-if="files.length > 0" #header>
          <div class="flex flex-wrap gap-2">
            <FileAvatar
              v-for="fileWithStatus in files"
              :key="fileWithStatus.id"
              :name="fileWithStatus.file.name"
              :type="fileWithStatus.file.type"
              :preview-url="fileWithStatus.previewUrl"
              :url="fileWithStatus.url"
              :status="fileWithStatus.status"
              :error="fileWithStatus.error"
              removable
              @remove="removeFile(fileWithStatus.id)"
            />
          </div>
        </template>

        <template #footer>
          <div class="flex items-center gap-1">
            <FileUploadButton @files-selected="handleFilesSelected" />
            <AudioRecorderButton @uploaded="handleAudioUploaded" />
          </div>
          <div class="flex items-center gap-1">
            <UButton
              size="xs"
              class="w-16 flex justify-center"
              :variant="isPro ? 'solid' : 'outline'"
              :color="isPro ? 'success' : 'neutral'"
              @click="isPro = !isPro"
            >
              {{ isPro ? "Pro" : "Flash" }}
            </UButton>

            <UChatPromptSubmit
              :status="chat.status"
              :disabled="isUploading"
              color="neutral"
              size="sm"
              @stop="chat.stop()"
              @reload="chat.regenerate()"
            />
          </div>
        </template>
      </UChatPrompt>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DefineComponent } from "vue";
import { Chat } from "@ai-sdk/vue";
import { DefaultChatTransport } from "ai";
import type {
  CreateUIMessage,
  FilePart,
  SourceUrlUIPart,
  UIDataTypes,
  UIMessage,
  UIMessagePart,
  UITools,
} from "ai";
import { useClipboard } from "@vueuse/core";
import { getTextFromMessage } from "@nuxt/ui/utils/ai";
import ProseStreamPre from "~/components/prose/PreStream.vue";
import { useFileUploadWithStatus } from "~/composables/useFileUpload";
const components = {
  pre: ProseStreamPre as unknown as DefineComponent,
};

// Utility to parse mixed content (text + tool logs)
type MessageComponent =
  | { type: "text"; content: string; log?: never }
  | { type: "log"; log: any; content?: never };
import { parseMessageComponents } from "~~/shared/utils/messageParser";

const route = useRoute();

const router = useRouter();
const toast = useToast();
const clipboard = useClipboard();

function getFileName(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split("/").pop() || "file";
    return decodeURIComponent(filename);
  } catch {
    return "file";
  }
}
const {
  dropzoneRef,
  isDragging,
  files,
  isUploading,
  uploadedFiles,
  addFiles,
  removeFile,
  clearFiles,
} = useFileUploadWithStatus();

const { data, refresh } = await useFetch(`/api/chat`);

const input = ref("");
const isPro = ref(false);

const chat = new Chat({
  id: "me",
  messages: data?.value?.messages || [],
  transport: new DefaultChatTransport({
    api: `/api/chat`,
    // body: {},
    fetch: async (api, options = {}) => {
      const body = JSON.parse(options?.body as string);
      return fetch(api, options);

      // const hasFiles = files.value.length > 0;

      // if (!hasFiles) {
      //   return fetch(api, options);
      // }

      // const formData = new FormData();
      // formData.append("messages", JSON.stringify([lastMessage]));

      // files.value.forEach((f) => {
      //   formData.append("file", f.file, f.file.name);
      // });

      // // Clonamos headers y eliminamos el Content-Type para que fetch lo genere con el boundary
      // const headers = { ...options?.headers } as Record<string, string>;
      // delete headers["content-type"];
      // delete headers["Content-Type"];

      // return fetch(api, {
      //   method: "POST",
      //   headers,
      //   body: formData,
      // });
    },
  }),
  onData: (dataPart) => {
    if (dataPart.type === "data-chat-title") {
      refreshNuxtData("chats");
    }
  },
  onError(error) {
    console.log(error);

    const { message } =
      typeof error.message === "string" && error.message[0] === "{"
        ? JSON.parse(error.message)
        : error;
    toast.add({
      description: message,
      icon: "i-lucide-alert-circle",
      color: "error",
      duration: 0,
    });
  },
  onFinish: () => {
    clearFiles();
    refresh();
  },
});

type N8NUITools = UITools;
type N8NUIDataTypes = UIDataTypes;
async function handleSubmit(e: Event) {
  e.preventDefault();
  if (input.value.trim() && !isUploading.value) {
    const parts: UIMessagePart<N8NUIDataTypes, N8NUITools>[] = [];

    if (input.value.trim()) {
      parts.push({ type: "text", text: input.value });
    }

    if (uploadedFiles.value.length > 0) {
      uploadedFiles.value.forEach((f) => {
        parts.push({
          type: "source-url",
          sourceId: f.driveFile?.id,
          title: f.filename,
          url: f.driveFile?.webViewLink,
          providerMetadata: {
            supabaseStorage: {
              path: f.driveFile?.path,
              url: f.driveFile?.webViewLink,
              mimeType: f.driveFile?.mimeType,
            },
          },
        } as SourceUrlUIPart);
      });
    }

    // UIMessagePart<DATA_PARTS, TOOLS>
    chat.sendMessage({
      role: "user",
      parts,
      usePro: isPro.value,
    });
    input.value = "";
    // No limpiamos los archivos aquí inmediatamente porque el transporte fetch
    // los necesita leer de forma reactiva antes de enviarlos.
    // Los limpiaremos cuando empiece el streaming o al terminar.
  }
}

async function handleFilesSelected(selectedFiles: File[]) {
  const response = await addFiles(selectedFiles, { skipTranscription: true });

  if (response && response[0]) {
    const result = response[0];
    // Set the formatted bitacora ID as the text input
    if (result.formatted_id) {
      input.value = result.formatted_id;
      isPro.value = true;
    }
    // File parts are already added to the files array by useFileUpload
    // They will be sent as source-url parts in handleSubmit
  }
}

interface TranscriptionResponse {
  audio?: { path: string; name: string; url: string; mimeType: string };
  text?: { path: string; name: string; url: string; mimeType: string };
  formatted_id?: string;
}

function handleAudioUploaded(response: TranscriptionResponse) {
  // Set the formatted bitacora ID as the text input
  if (response.formatted_id) {
    input.value = response.formatted_id;
    isPro.value = true;
  }

  // Add audio and text as files to be sent as source-url parts
  if (response.audio) {
    const audioId = "audio-" + Date.now();
    files.value.push({
      id: audioId,
      file: new File([], response.audio.name, {
        type: response.audio.mimeType,
      }),
      status: "uploaded",
      driveFile: {
        ...response.audio,
        id: audioId,
        webViewLink: response.audio.url,
      } as any,
      url: response.audio.url,
      previewUrl: "",
    });
  }

  if (response.text) {
    const textId = "text-" + Date.now();
    files.value.push({
      id: textId,
      file: new File([], response.text.name, { type: response.text.mimeType }),
      status: "uploaded",
      driveFile: {
        ...response.text,
        id: textId,
        webViewLink: response.text.url,
      } as any,
      url: response.text.url,
      previewUrl: "",
    });
  }
}

const copied = ref(false);

function copy(e: MouseEvent, message: UIMessage) {
  clipboard.copy(getTextFromMessage(message));

  copied.value = true;

  setTimeout(() => {
    copied.value = false;
  }, 2000);
}

onMounted(() => {
  const queryMessage = route.query.q as string;
  if (queryMessage) {
    chat.sendMessage({ text: queryMessage });
    // Limpiamos la query para evitar re-envíos al recargar
    router.replace({ query: {} });
  } else if (data.value?.messages.length === 1) {
    chat.regenerate();
  }
});
</script>
