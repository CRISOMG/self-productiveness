// server/api/chats/[id].get.ts
import type { UIMessage } from "ai";

// Definimos la estructura exacta que viene de n8n/LangChain según tu ejemplo
interface N8NMessageLangChain {
  type: "human" | "ai" | "system" | string;
  content: string;
  tool_calls?: any[];
  additional_kwargs?: Record<string, any>;
  response_metadata?: Record<string, any>;
  invalid_tool_calls?: any[];
  // Soporte para variaciones de LangChain donde el contenido está dentro de 'data'
  data?: {
    content: string;
    [key: string]: any;
  };
}

interface N8NChatHistoryRow {
  id: number;
  session_id: string;
  message: string | N8NMessageLangChain; // Puede venir como string JSON o ya parseado
}

export default defineEventHandler(async (event) => {
  // 1. Obtener sesión del usuario (seguridad)

  // const session = await requireUserSession(event);

  // @ts-ignore-next-line  --  Hardcodeamos el userId para pruebas
  const userId = "8130067397";

  // 2. Consultar Postgres (el objeto 'sql' se auto-importa desde server/utils/n8n-db.ts)
  const rows = await sql<N8NChatHistoryRow[]>`
    SELECT * FROM (
      SELECT id, session_id, message
      FROM n8n_chat_histories
      WHERE session_id = ${userId}
      ORDER BY id DESC
      LIMIT 20
    ) AS subquery
    ORDER BY id ASC
  `;

  // 3. Mapear mensajes de LangChain (n8n) a Vercel AI SDK
  const messages: UIMessage[] = rows.map((row) => {
    // Si la DB devuelve un string (como en tu ejemplo), lo parseamos
    const msg: N8NMessageLangChain =
      typeof row.message === "string" ? JSON.parse(row.message) : row.message;

    // Determinamos el rol compatible con Vercel AI SDK
    let role: UIMessage["role"] = "system";
    if (msg.type === "human") role = "user";
    else if (msg.type === "ai") role = "assistant";

    // Extraemos el contenido dinámicamente según la variante de LangChain
    const textContent = msg.content || msg.data?.content || "";

    return {
      id: row.id.toString(),
      role,
      content: textContent,
      // 'parts' es vital para la compatibilidad con el frontend del template
      parts: [{ type: "text", text: textContent }],
      createdAt: new Date(), // n8n_chat_histories no tiene timestamp por defecto
    };
  });

  // 4. Retornar el objeto Chat completo que espera el template
  return {
    id: userId, // En tu sistema, el ID del chat es el ID del usuario
    title: "Your Focus Assistant",
    userId: userId,
    createdAt: new Date(),
    path: `/chat/${userId}`,
    messages,
  };
});
