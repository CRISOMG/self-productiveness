import {
  type FileWithStatus,
  FILE_UPLOAD_CONFIG,
  type GoogleDriveFile,
  ensureCorrectMimeType,
} from "~~/shared/utils/file";

type FileUploadResponseFromN8NGoogleDriveInboxWebhook = {
  audio: GoogleDriveFile;
  text: GoogleDriveFile;
  message: string;
};

export function useFileUploadWithStatus() {
  const files = ref<FileWithStatus[]>([]);
  const config = useRuntimeConfig();
  const user = useSupabaseUser();

  async function addFiles(
    newFiles: File[],
  ): Promise<FileUploadResponseFromN8NGoogleDriveInboxWebhook[] | undefined> {
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
      const formData = new FormData();
      const correctedMime = ensureCorrectMimeType(fileWithStatus.file);

      // Create a blob with the corrected mime type if it changed
      const uploadFile =
        correctedMime !== fileWithStatus.file.type
          ? new File([fileWithStatus.file], fileWithStatus.file.name, {
              type: correctedMime,
            })
          : fileWithStatus.file;

      formData.append("data", uploadFile);
      formData.append("user_id", user.value?.sub || "");

      try {
        const response = await $fetch<
          FileUploadResponseFromN8NGoogleDriveInboxWebhook[]
        >("/api/audio/transcribe", {
          method: "POST",
          body: formData,
        });

        const result =
          response[0] as FileUploadResponseFromN8NGoogleDriveInboxWebhook;

        const text = result?.text;
        const audio = result?.audio;

        if (text) {
          files.value = [
            {
              file: new File([], text.name, {
                type: text.mimeType,
              }),
              status: "uploaded",
              driveFile: text,
              url: text.webViewLink,
            },
          ];
        }

        if (audio) {
          files.value.push({
            file: new File([], audio.name, {
              type: audio.mimeType,
            }),
            status: "uploaded",
            driveFile: audio,
            url: audio.webViewLink,
          });
        }

        return response;
        // Update status to uploaded
        // files.value = files.value.map((f) => {
        //   if (f.id === fileWithStatus.id) {
        //     return ;
        //   }
        //   return f;
        // });
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
