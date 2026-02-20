import { serverSupabaseUser, serverSupabaseClient } from "#supabase/server";
import type { Database } from "~~/app/types/database.types";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const userId = user.sub;
  const body = await readBody<{ name: string }>(event);
  const name = body?.name || "usuario";

  const supabase = await serverSupabaseClient<Database>(event);

  // Check if a welcome message already exists for this user
  const { data: existing } = await supabase
    .from("n8n_chat_histories")
    .select("id")
    .eq("session_id", userId)
    .limit(1);

  if (existing && existing.length > 0) {
    return {
      ok: true,
      skipped: true,
      message: "Welcome message already exists",
    };
  }

  const welcomeContent = `¡Hola ${name}! 🧠 Soy tu Segundo Cerebro, tu asistente personal basado en la metodología Zettelkasten y mejora continua Kaizen.

Mi propósito es ayudarte a convertir tus ideas y reflexiones en conocimiento estructurado y acciones concretas. Así funciono:

📝 **Bitácoras de audio**: Graba notas de voz con tus ideas, reflexiones o reportes del día. Yo las proceso para extraer información valiosa.

🗂️ **Notas atómicas**: A partir de tus bitácoras, creo notas individuales y conectadas que forman tu base de conocimiento personal (Zettelkasten).

✅ **Tareas atómicas**: Genero tareas específicas y medibles para que puedas ejecutarlas en intervalos de enfoque de 25 minutos.

🔄 **Mejora continua (Kaizen)**: Cada iteración refuerza tu sistema. Reportarte, registrar, procesar, ejecutar, repasar e iterar.

Para empezar, graba tu primera bitácora de audio usando el botón del micrófono 🎙️ ¡Cuéntame sobre ti, tus intereses o en qué estás trabajando!`;

  const welcomeMessage = {
    type: "ai",
    content: welcomeContent,
    additional_kwargs: {},
    response_metadata: {
      model: "system-welcome",
    },
  };

  const autoGreetingMessage = {
    type: "human",
    content: "Hola!",
    additional_kwargs: {},
    response_metadata: {
      model: "system-welcome",
    },
  };

  const { error: error2 } = await supabase.from("n8n_chat_histories").insert({
    session_id: userId,
    message: autoGreetingMessage as any,
  });
  const { error } = await supabase.from("n8n_chat_histories").insert({
    session_id: userId,
    message: welcomeMessage as any,
  });

  if (error || error2) {
    console.error("[Welcome API] Failed to insert welcome message:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create welcome message",
    });
  }

  return { ok: true, skipped: false };
});
