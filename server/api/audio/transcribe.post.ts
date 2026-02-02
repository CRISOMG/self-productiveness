// server/api/audio/transcribe.post.ts
import { serverSupabaseUser, serverSupabaseClient } from "#supabase/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { readFile } from "fs/promises";
import { join } from "path";
import type { Database } from "~~/app/types/database.types";

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
  message: string;
}

// Configuración de jornadas
const JORNADAS = [
  { nombre: "matutina", inicio: 5, fin: 12, cortes: [7, 10] as const },
  { nombre: "meridiana", inicio: 12, fin: 15, cortes: [13, 14] as const },
  { nombre: "vespertina", inicio: 15, fin: 20, cortes: [17, 18] as const },
  { nombre: "nocturna", inicio: 20, fin: 5, cortes: [23, 2] as const },
] as const;

// Nombres de días en español
const DIAS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

function getJornadaInfo(date: Date): {
  formatted_id: string;
  system_filename: string;
  dayFolder: string;
} {
  const hour = date.getHours();

  // Encontrar jornada (nocturna si no se encuentra otra)
  const jornada =
    JORNADAS.find((j) => {
      if (j.inicio < j.fin) {
        return hour >= j.inicio && hour < j.fin;
      } else {
        // Jornada nocturna que cruza medianoche
        return hour >= j.inicio || hour < j.fin;
      }
    }) || JORNADAS[3];

  // Determinar momento
  const [c1, c2] = jornada.cortes;
  let momento: string;

  if (jornada.inicio < jornada.fin) {
    momento =
      hour >= jornada.inicio && hour < c1
        ? "temprana"
        : hour >= c1 && hour < c2
          ? "media"
          : "tardía";
  } else {
    // Jornada nocturna
    momento = hour >= jornada.inicio || hour < c1 ? "temprana" : "media";
  }

  const diaSemana = DIAS[date.getDay()];

  const pad = (n: number) => n.toString().padStart(2, "0");
  const dateStr = `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;

  const formatted_id = `[Bitacora ${jornada.nombre} ${momento}, ${diaSemana}, ${dateStr}]`;
  const system_filename = `${date.getFullYear()}_${pad(date.getMonth() + 1)}_${pad(date.getDate())}.${pad(date.getHours())}.${pad(date.getMinutes())}`;
  const dayFolder = `${date.getFullYear()}_${pad(date.getMonth() + 1)}_${pad(date.getDate())}`;

  return { formatted_id, system_filename, dayFolder };
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

  // 1. Leer archivo de audio del FormData
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

  // 2. Generar metadata de jornada
  const now = new Date();
  const { formatted_id, system_filename, dayFolder } = getJornadaInfo(now);

  const audioExtension =
    filePart.type?.split("/").pop() ||
    filePart.filename?.split(".").pop() ||
    "webm";
  const audioFileName = `${system_filename}.${audioExtension}`;

  // 3. Definir rutas en Supabase Storage
  // Estructura: {user_id}/bitacora/{YYYY_MM_DD}/{archivo}
  const audioPath = `${userId}/bitacora/${dayFolder}/${audioFileName}`;
  const textPath = `${userId}/bitacora/${dayFolder}/${audioFileName}.txt`;

  // 4. Subir archivo de audio a Supabase Storage
  const { error: audioUploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(audioPath, filePart.data, {
      contentType: filePart.type || "audio/webm",
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

  // 5. Transcribir con Gemini
  const google = createGoogleGenerativeAI({
    apiKey: config.googleAiApiKey,
  });

  const transcriptPrompt = await loadTranscriptPrompt();
  const fullPrompt = `[[fecha de la bitacora: ${formatted_id}]]\n\n${transcriptPrompt}`;

  // Convert buffer to base64 for AI SDK
  const audioBase64 = filePart.data.toString("base64");

  const transcriptionResult = await generateText({
    model: google("gemini-2.0-flash"),
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: fullPrompt },
          {
            type: "file",
            data: audioBase64,
            mediaType: (filePart.type || "audio/webm") as
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

  // 9. Construir mensaje de respuesta
  const message = `[${formatted_id}]\n\n[audio](${audioUrlData?.signedUrl || audioPath})\n\n[transcripcion](${textUrlData?.signedUrl || textPath})`;

  const result: TranscriptionResult = {
    audio: {
      path: audioPath,
      name: audioFileName,
      url: audioUrlData?.signedUrl || "",
      mimeType: filePart.type || "audio/webm",
    },
    text: {
      path: textPath,
      name: `${audioFileName}.txt`,
      url: textUrlData?.signedUrl || "",
      mimeType: "text/plain",
    },
    message,
  };

  return [result];
});
