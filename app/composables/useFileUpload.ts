import {
  type FileWithStatus,
  FILE_UPLOAD_CONFIG,
  type GoogleDriveFile,
  ensureCorrectMimeType,
} from "~~/shared/utils/file";

type FileUploadResponse = {
  audio?: {
    path: string;
    name: string;
    url: string;
    mimeType: string;
    id?: string;
  };
  text?: {
    path: string;
    name: string;
    url: string;
    mimeType: string;
    id?: string;
  };
  message: string;
};

import { getAudioStoragePath } from "~~/shared/utils/jornada";

export function useFileUploadWithStatus() {
  const files = ref<FileWithStatus[]>([]);
  const config = useRuntimeConfig();
  const user = useSupabaseUser();
  const supabase = useSupabaseClient();

  async function addFiles(
    newFiles: File[],
  ): Promise<FileUploadResponse[] | undefined> {
    // Initial state: uploading
    const newFilesWithStatus: FileWithStatus[] = newFiles.map((file) => ({
      file,
      id: Date.now().toString() + Math.random().toString().slice(2),
      previewUrl: URL.createObjectURL(file),
      status: "uploading",
    }));

    files.value = [...files.value, ...newFilesWithStatus];

    // Upload each file
    for (const fileWithStatus of newFilesWithStatus) {
      try {
        const userId = user.value?.sub || "";
        const fileName = fileWithStatus.file.name;
        const contentType = ensureCorrectMimeType(fileWithStatus.file);
        const storagePath = getAudioStoragePath(userId, fileName);

        // 1. Upload directly to Supabase from Client
        const { error: uploadError } = await supabase.storage
          .from("yourfocus")
          .upload(storagePath, fileWithStatus.file, {
            contentType,
            upsert: true,
          });

        if (uploadError) throw uploadError;

        // 2. Call the API with the path instead of the file
        const response = await $fetch<FileUploadResponse[]>(
          "/api/audio/transcribe",
          {
            method: "POST",
            body: {
              audioPath: storagePath,
              mimeType: contentType,
            },
          },
        );

        const result = response && response[0] ? response[0] : null;

        if (!result) {
          throw new Error("Invalid response from server");
        }

        const text = result?.text;
        const audio = result?.audio;

        // Remove the original uploading file and add the results
        files.value = files.value.filter((f) => f.id !== fileWithStatus.id);

        if (text) {
          const textId =
            text.id ||
            "text-" + Date.now().toString() + Math.random().toString().slice(2);
          files.value.push({
            id: textId,
            file: new File([], text.name, {
              type: text.mimeType,
            }),
            status: "uploaded",
            driveFile: {
              ...(text as any),
              id: textId,
              webViewLink: text.url,
            },
            url: text.url,
            previewUrl: "", // Text files don't need a preview URL usually
          });
        }

        if (audio) {
          const audioId =
            audio.id ||
            "audio-" +
              Date.now().toString() +
              Math.random().toString().slice(2);
          files.value.push({
            id: audioId,
            file: new File([], audio.name, {
              type: audio.mimeType,
            }),
            status: "uploaded",
            driveFile: {
              ...(audio as any),
              id: audioId,
              webViewLink: audio.url,
            },
            url: audio.url,
            previewUrl: "",
          });
        }

        return response;
      } catch (error) {
        console.error("Upload failed", error);
        files.value = files.value.map((f) => {
          if (f.id === fileWithStatus.id) {
            return {
              ...f,
              status: "error",
              error: "Upload failed",
            };
          }
          return f;
        });
      }
    }
  }

  const { dropzoneRef, isDragging } = useFileUpload({
    accept: FILE_UPLOAD_CONFIG.acceptPattern,
    multiple: false,
    onUpdate: addFiles,
  });

  const isUploading = computed(() =>
    files.value.some((f) => f.status === "uploading"),
  );

  const uploadedFiles = computed(() =>
    files.value
      .filter((f) => f.status === "uploaded")
      .map((f) => ({
        type: "file" as const,
        mediaType: ensureCorrectMimeType(f.file),
        data: f.file, // Send raw File object to AI SDK match
        url: f.previewUrl,
        filename: f.file.name,
        driveFile: f.driveFile, // Pass driveFile info
      })),
  );

  function removeFile(id: string) {
    const file = files.value.find((f) => f.id === id);
    if (!file) return;

    URL.revokeObjectURL(file.previewUrl);
    files.value = files.value.filter((f) => f.id !== id);
  }

  function clearFiles() {
    if (files.value.length === 0) return;
    files.value.forEach((fileWithStatus) =>
      URL.revokeObjectURL(fileWithStatus.previewUrl),
    );
    files.value = [];
  }

  onUnmounted(() => {
    clearFiles();
  });

  return {
    dropzoneRef,
    isDragging,
    files,
    isUploading,
    uploadedFiles,
    addFiles,
    removeFile,
    clearFiles,
  };
}
