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
  };
  text?: {
    path: string;
    name: string;
    url: string;
    mimeType: string;
  };
  formatted_id: string;
};

import { getAudioStoragePath } from "~~/shared/utils/jornada";

export function useFileUploadWithStatus() {
  const files = ref<FileWithStatus[]>([]);
  const config = useRuntimeConfig();
  const user = useSupabaseUser();
  const supabase = useSupabaseClient();

  async function addFiles(
    newFiles: File[],
    options?: { skipTranscription?: boolean },
  ): Promise<FileUploadResponse[] | undefined> {
    const skipTranscription = options?.skipTranscription ?? false;

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

        // 2. Register the upload via the API
        const uploadResult = await $fetch<FileUploadResponse>(
          "/api/audio/upload",
          {
            method: "POST",
            body: {
              audioPath: storagePath,
              mimeType: contentType,
            },
          },
        );

        if (!uploadResult?.audio) {
          throw new Error("Invalid response from upload");
        }

        // 3. Optionally transcribe
        let result: FileUploadResponse = uploadResult;

        if (!skipTranscription) {
          try {
            const transcribeResult = await $fetch<FileUploadResponse>(
              "/api/audio/transcribe",
              {
                method: "POST",
                body: {
                  audioPath: storagePath,
                  mimeType: contentType,
                },
              },
            );

            if (transcribeResult) {
              result = transcribeResult;
            }
          } catch (transcribeError) {
            console.warn(
              "Transcription failed, continuing with upload only:",
              transcribeError,
            );
          }
        }

        const text = result?.text;
        const audio = result?.audio;

        // Remove the original uploading file and add the results
        files.value = files.value.filter((f) => f.id !== fileWithStatus.id);

        if (text) {
          const textId = "text-" + Date.now().toString();
          files.value.push({
            id: textId,
            file: new File([], text.name, { type: text.mimeType }),
            status: "uploaded",
            driveFile: { ...text, id: textId, webViewLink: text.url } as any,
            url: text.url,
            previewUrl: "",
          });
        }

        if (audio) {
          const audioId = "audio-" + Date.now().toString();
          files.value.push({
            id: audioId,
            file: new File([], audio.name, { type: audio.mimeType }),
            status: "uploaded",
            driveFile: { ...audio, id: audioId, webViewLink: audio.url } as any,
            url: audio.url,
            previewUrl: "",
          });
        }

        return [result];
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
