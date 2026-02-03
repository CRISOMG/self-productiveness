// server/utils/ai/tools/supabase-tags.ts
import { tool } from "ai";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~~/app/types/database.types";

/**
 * Normaliza el label de una etiqueta (trim + lowercase)
 */
function normalizeTagLabel(label: string): string {
  return label.trim().toLowerCase();
}

/**
 * Crea las herramientas de gestión de etiquetas para Supabase
 */
export function createSupabaseTagsTools(
  userId: string,
  supabase: SupabaseClient<Database>,
) {
  const getTagsTool = tool({
    description: `Lista las etiquetas disponibles para el usuario.
Incluye etiquetas personales del usuario Y etiquetas globales del sistema.
Usa esta herramienta para:
- Ver qué etiquetas existen antes de crear una tarea
- Sugerir etiquetas al usuario
- Verificar si existe una etiqueta antes de crearla`,
    inputSchema: z.object({
      limit: z.number().default(50).describe("Número máximo de etiquetas"),
    }),
    execute: async ({ limit }) => {
      try {
        const { data, error } = await supabase
          .from("tags")
          .select("id, label, type, created_at")
          .or(`user_id.eq.${userId},user_id.is.null`)
          .order("label", { ascending: true })
          .limit(limit);

        if (error) throw error;

        return {
          success: true,
          count: data?.length || 0,
          tags:
            data?.map((t) => ({
              id: t.id,
              label: t.label,
              type: t.type,
              isGlobal: t.type !== null, // Tags con type son globales
            })) || [],
        };
      } catch (error: unknown) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  });

  const createTagTool = tool({
    description: `Crea una nueva etiqueta para el usuario.
El label será normalizado (trim + lowercase).
Solo usar si el usuario pide EXPLÍCITAMENTE crear una etiqueta o si necesitas una que no existe.`,
    inputSchema: z.object({
      label: z
        .string()
        .min(1)
        .max(50)
        .describe("Nombre de la etiqueta (será normalizado)"),
    }),
    execute: async ({ label }) => {
      try {
        const normalized = normalizeTagLabel(label);

        if (!normalized) {
          return {
            success: false,
            error: "El nombre de la etiqueta no puede estar vacío",
          };
        }

        // Verificar si ya existe
        const { data: existing } = await supabase
          .from("tags")
          .select("id, label")
          .eq("user_id", userId)
          .eq("label", normalized)
          .maybeSingle();

        if (existing) {
          return {
            success: true,
            message: `La etiqueta "${normalized}" ya existe`,
            tag: existing,
            alreadyExisted: true,
          };
        }

        // Crear nueva
        const { data, error } = await supabase
          .from("tags")
          .insert({
            label: normalized,
            user_id: userId,
          })
          .select("id, label, created_at")
          .single();

        if (error) throw error;

        return {
          success: true,
          message: `Etiqueta "${normalized}" creada`,
          tag: data,
          alreadyExisted: false,
        };
      } catch (error: unknown) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  });

  const searchTagsTool = tool({
    description: `Busca etiquetas por nombre parcial.
Útil para encontrar etiquetas que coincidan con un término de búsqueda.`,
    inputSchema: z.object({
      query: z.string().min(1).describe("Término de búsqueda"),
      limit: z.number().default(10).describe("Número máximo de resultados"),
    }),
    execute: async ({ query, limit }) => {
      try {
        const { data, error } = await supabase
          .from("tags")
          .select("id, label, type")
          .or(`user_id.eq.${userId},user_id.is.null`)
          .ilike("label", `%${query}%`)
          .limit(limit);

        if (error) throw error;

        return {
          success: true,
          count: data?.length || 0,
          tags:
            data?.map((t) => ({
              id: t.id,
              label: t.label,
              isGlobal: t.type !== null,
            })) || [],
        };
      } catch (error: unknown) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  });

  return {
    getTags: getTagsTool,
    createTag: createTagTool,
    searchTags: searchTagsTool,
  };
}
