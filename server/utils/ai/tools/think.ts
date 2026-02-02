// server/utils/ai/tools/think.ts
import { tool } from "ai";
import { z } from "zod";

/**
 * Tool de razonamiento - permite al agente "pensar en voz alta"
 * sin modificar ninguna base de datos. Útil para planificación
 * y toma de decisiones complejas.
 */
export const thinkTool = tool({
  description: `Usa esta herramienta para reflexionar sobre información compleja antes de responder.
No modifica ninguna base de datos, solo registra tu pensamiento.
Úsala cuando necesites:
- Planificar una respuesta compleja
- Decidir qué herramienta usar
- Analizar el contexto antes de actuar
- Razonar sobre si crear una tarea o nota`,
  inputSchema: z.object({
    thought: z
      .string()
      .describe("Tu proceso de pensamiento o razonamiento interno"),
  }),
  execute: async ({ thought }) => {
    return {
      success: true,
      thought,
      timestamp: new Date().toISOString(),
    };
  },
});
