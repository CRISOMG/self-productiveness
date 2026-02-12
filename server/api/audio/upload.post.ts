import { serverSupabaseUser, serverSupabaseClient } from "#supabase/server";
import type { Database } from "~~/app/types/database.types";
import { getJornadaInfo } from "~~/shared/utils/jornada";

export interface AudioUploadResult {
  audio: {
    path: string;
    name: string;
    url: string;
    mimeType: string;
  };
  formatted_id: string;
}

const BUCKET_NAME = "yourfocus";

export default defineEventHandler(async (event): Promise<AudioUploadResult> => {
  const user = await serverSupabaseUser(event);

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const userId = user.sub;
  const supabase = await serverSupabaseClient<Database>(event);

  let audioMimeType: string;
  let audioPath: string;
  let audioFileName: string;

  const now = new Date();
  const { formatted_id, system_filename, dayFolder } = getJornadaInfo(now);

  // Check if we got a path or raw data
  const body = await readBody(event).catch(() => null);

  if (body?.audioPath) {
    // Case: Direct upload from client - file already in storage
    audioPath = body.audioPath;
    audioFileName = audioPath.split("/").pop() || `${system_filename}.webm`;
    audioMimeType = body.mimeType || "audio/webm";
  } else {
    // Case: Legacy Multipart upload (subject to payload limits)
    const formData = await readMultipartFormData(event);
    if (!formData) {
      throw createError({
        statusCode: 400,
        statusMessage: "No file provided",
      });
    }

    const filePart = formData.find((p) => p.name === "data" || p.filename);
    if (!filePart || !filePart.data) {
      throw createError({
        statusCode: 400,
        statusMessage: "No audio file found",
      });
    }

    audioMimeType = filePart.type || "audio/webm";
    const audioExtension = audioMimeType.split("/").pop() || "webm";
    audioFileName = `${system_filename}.${audioExtension}`;
    audioPath = `${userId}/bitacora/${dayFolder}/${audioFileName}`;

    const { error: audioUploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(audioPath, filePart.data, {
        contentType: audioMimeType,
        upsert: true,
      });

    if (audioUploadError) {
      console.error("[Upload] Audio upload error:", audioUploadError);
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to upload audio",
        data: audioUploadError.message,
      });
    }
  }

  // Get signed URL for the uploaded audio
  const { data: audioUrlData } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(audioPath, 3600); // 1 hour expiry

  return {
    audio: {
      path: audioPath,
      name: audioFileName,
      url: audioUrlData?.signedUrl || "",
      mimeType: audioMimeType,
    },
    formatted_id,
  };
});
