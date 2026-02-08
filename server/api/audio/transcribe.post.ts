import { serverSupabaseUser, serverSupabaseClient } from "#supabase/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { readFile } from "fs/promises";
import { join } from "path";
import type { Database } from "~~/app/types/database.types";
import { getJornadaInfo, DIAS, JORNADAS } from "~~/shared/utils/jornada";

interface TranscriptionResult {
  audio: {
    path: string;
    name: string;
    url: string;
    mimeType: string;
  };
  text: {
    path: string;
    name: string;
    url: string;
    mimeType: string;
  };
  formatted_id: string; // e.g. "[[Bitacora vespertina media, Miércoles, 04-02-2026 17:53]]"
}

async function loadTranscriptPrompt(): Promise<string> {
  try {
    const promptPath = join(process.cwd(), "transcript_prompt.txt");
    return await readFile(promptPath, "utf-8");
  } catch {
    return "Transcribe el audio a texto con timestamps en formato MM:SS - [texto]";
  }
}

const BUCKET_NAME = "yourfocus";

export default defineEventHandler(async (event) => {
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

  let audioMimeType: string;
  let audioPath: string;
  let audioFileName: string;

  const now = new Date();
  const { formatted_id, system_filename, dayFolder } = getJornadaInfo(now);

  // Check if we got a path or raw data
  const body = await readBody(event).catch(() => null);

  if (body?.audioPath) {
    // 1. Case: Direct upload from client - file already in storage
    audioPath = body.audioPath;
    audioFileName = audioPath.split("/").pop() || `${system_filename}.webm`;
    audioMimeType = body.mimeType || "audio/webm";
    // No need to download - we'll use a signed URL directly with Gemini
  } else {
    // 2. Case: Legacy Multipart upload (subject to payload limits)
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

    // Upload to storage if it wasn't already there (backward compatibility)
    const { error: audioUploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(audioPath, filePart.data, {
        contentType: audioMimeType,
        upsert: true,
      });

    if (audioUploadError) {
      console.error("[Transcribe] Audio upload error:", audioUploadError);
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to upload audio",
        data: audioUploadError.message,
      });
    }
  }

  const textPath = `${audioPath}.txt`;

  // 5. Get signed URL for AI SDK (avoids base64 memory overhead)
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(audioPath, 600); // 10 min expiry

  if (signedUrlError || !signedUrlData?.signedUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create signed URL for transcription",
      data: signedUrlError?.message,
    });
  }

  // 6. Transcribir con Gemini
  const google = createGoogleGenerativeAI({
    apiKey: config.googleAiApiKey,
  });

  const transcriptPrompt = await loadTranscriptPrompt();
  const fullPrompt = `[[fecha de la bitacora: ${formatted_id}]]\n\n${transcriptPrompt}`;

  const transcriptionResult = await generateText({
    model: google("gemini-2.0-flash"),
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: fullPrompt },
          {
            type: "file",
            data: new URL(signedUrlData.signedUrl),
            mediaType: audioMimeType as
              | "audio/webm"
              | "audio/wav"
              | "audio/mp3"
              | "audio/mpeg",
          },
        ],
      },
    ],
  });

  const transcriptionText = transcriptionResult.text;

  // 6. Procesar transcripción con timestamps reales
  const pad = (n: number) => n.toString().padStart(2, "0");
  const processedText = transcriptionText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((line) => {
      const match = line.match(/^(\d+):(\d+)\s*-\s*(.*)/);
      if (!match) return line;

      const [, minsStr, secsStr, content] = match;
      if (!minsStr || !secsStr || !content) return line;

      const newTime = new Date(
        now.getTime() + parseInt(minsStr) * 60000 + parseInt(secsStr) * 1000,
      );

      const jornada =
        JORNADAS.find((j) => {
          const h = newTime.getHours();
          if (j.inicio < j.fin) return h >= j.inicio && h < j.fin;
          return h >= j.inicio || h < j.fin;
        }) || JORNADAS[3];

      const dayName = DIAS[newTime.getDay()];
      const timeStr = `${pad(newTime.getDate())}-${pad(newTime.getMonth() + 1)}-${newTime.getFullYear()} ${pad(newTime.getHours())}:${pad(newTime.getMinutes())}:${pad(newTime.getSeconds())}`;

      return `[Bitacora ${jornada.nombre}, ${dayName}, ${timeStr}] - ${content}`;
    })
    .join("\n\n");

  // 7. Subir transcripción a Supabase Storage
  const { error: textUploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(textPath, processedText, {
      contentType: "text/plain",
      upsert: true,
    });

  if (textUploadError) {
    console.error("[Transcribe] Text upload error:", textUploadError);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to upload transcription",
      data: textUploadError.message,
    });
  }

  // 8. Obtener URLs firmadas (privadas, temporales)
  const { data: audioUrlData } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(audioPath, 3600); // 1 hour expiry

  const { data: textUrlData } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(textPath, 3600);

  // 9. Construir resultado de respuesta
  const result: TranscriptionResult = {
    audio: {
      path: audioPath,
      name: audioFileName,
      url: audioUrlData?.signedUrl || "",
      mimeType: audioMimeType,
    },
    text: {
      path: textPath,
      name: `${audioFileName}.txt`,
      url: textUrlData?.signedUrl || "",
      mimeType: "text/plain",
    },
    formatted_id,
  };

  return [result];
});
