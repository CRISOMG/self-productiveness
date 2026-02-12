import { serverSupabaseUser, serverSupabaseClient } from "#supabase/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { readFile } from "fs/promises";
import { join } from "path";
import type { Database } from "~~/app/types/database.types";
import { getJornadaInfo, DIAS, JORNADAS } from "~~/shared/utils/jornada";

export interface TranscriptionResult {
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
  formatted_id: string;
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

export default defineEventHandler(
  async (event): Promise<TranscriptionResult> => {
    const config = useRuntimeConfig();
    const user = await serverSupabaseUser(event);

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    }

    const supabase = await serverSupabaseClient<Database>(event);

    // Requires audioPath - the audio must already be uploaded to storage
    const body = await readBody(event);

    if (!body?.audioPath) {
      throw createError({
        statusCode: 400,
        statusMessage:
          "audioPath is required. Upload the audio first via /api/audio/upload",
      });
    }

    const audioPath: string = body.audioPath;
    const audioMimeType: string = body.mimeType || "audio/webm";
    const audioFileName = audioPath.split("/").pop() || "audio.webm";

    const now = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/Caracas" }),
    );
    const { formatted_id } = getJornadaInfo(now);

    const textPath = `${audioPath}.txt`;

    // 1. Get signed URL for AI SDK
    const { data: signedUrlData, error: signedUrlError } =
      await supabase.storage.from(BUCKET_NAME).createSignedUrl(audioPath, 600); // 10 min expiry

    if (signedUrlError || !signedUrlData?.signedUrl) {
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to create signed URL for transcription",
        data: signedUrlError?.message,
      });
    }

    // 2. Transcribir con Gemini
    const google = createGoogleGenerativeAI({
      apiKey: config.googleAiApiKey,
    });

    const transcriptPrompt = await loadTranscriptPrompt();
    const fullPrompt = `[[fecha de la bitacora: ${formatted_id}]]\n\n${transcriptPrompt}`;

    const transcriptionResult = await generateText({
      model: google("gemini-3-flash-preview"),
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

    // 3. Procesar transcripción con timestamps reales
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

    // 4. Subir transcripción a Supabase Storage
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

    // 5. Obtener URLs firmadas
    const { data: audioUrlData } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(audioPath, 3600);

    const { data: textUrlData } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(textPath, 3600);

    return {
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
  },
);
