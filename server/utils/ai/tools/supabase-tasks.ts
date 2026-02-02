// server/utils/ai/tools/supabase-tasks.ts
import { tool } from "ai";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~~/app/types/database.types";

type Task = Database["public"]["Tables"]["tasks"]["Row"];

/**
 * Crea las herramientas de gestión de tareas para Supabase
 */
export function createSupabaseTasksTools(
  userId: string,
  supabase: SupabaseClient<Database>,
) {
  const getTasksTool = tool({
    description: `Lista las tareas del usuario desde Supabase.
Usa esta herramienta para:
- Ver tareas pendientes
- Verificar si una tarea ya existe antes de crear una nueva
- Resumir la carga de trabajo actual`,
    inputSchema: z.object({
      filter: z
        .enum(["all", "pending", "done", "archived"])
        .default("pending")
        .describe("Filtro de tareas"),
      limit: z.number().default(100).describe("Número máximo de tareas"),
    }),
    execute: async ({ filter, limit }) => {
      try {
        let query = supabase
          .from("tasks")
          .select("id, title, description, done, archived, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(limit);

        switch (filter) {
          case "pending":
            query = query.eq("done", false).eq("archived", false);
            break;
          case "done":
            query = query.eq("done", true);
            break;
          case "archived":
            query = query.eq("archived", true);
            break;
        }

        const { data, error } = await query;

        if (error) throw error;

        return {
          success: true,
          count: data?.length || 0,
          tasks:
            data?.map((t) => ({
              id: t.id,
              title: t.title,
              description: t.description,
              done: t.done,
              archived: t.archived,
              created_at: t.created_at,
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

  const createTaskTool = tool({
    description: `Crea una nueva tarea en Supabase.
Solo usar si el usuario pide EXPLÍCITAMENTE crear una tarea.`,
    inputSchema: z.object({
      title: z.string().max(200).describe("Título de la tarea"),
      description: z.string().optional().describe("Descripción (opcional)"),
    }),
    execute: async ({ title, description }) => {
      try {
        const { data, error } = await supabase
          .from("tasks")
          .insert({
            user_id: userId,
            title,
            description: description || null,
            done: false,
            archived: false,
          })
          .select("id, title, description, created_at")
          .single();

        if (error) throw error;

        return {
          success: true,
          message: `Tarea creada: "${title}"`,
          task: data,
        };
      } catch (error: unknown) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  });

  const updateTaskTool = tool({
    description: `Actualiza una tarea existente en Supabase.`,
    inputSchema: z.object({
      id: z.string().uuid().describe("ID de la tarea"),
      done: z.boolean().optional().describe("Marcar como completada"),
      archived: z.boolean().optional().describe("Archivar la tarea"),
      title: z.string().optional().describe("Nuevo título"),
      description: z.string().optional().describe("Nueva descripción"),
    }),
    execute: async ({ id, done, archived, title, description }) => {
      try {
        const updates: Partial<Task> = {};

        if (done !== undefined) updates.done = done;
        if (archived !== undefined) updates.archived = archived;
        if (title !== undefined) updates.title = title;
        if (description !== undefined) updates.description = description;

        if (Object.keys(updates).length === 0) {
          return {
            success: false,
            error: "No se especificaron campos para actualizar",
          };
        }

        const { data, error } = await supabase
          .from("tasks")
          .update(updates)
          .eq("id", id)
          .eq("user_id", userId)
          .select("id, title, done, archived")
          .single();

        if (error) throw error;

        return {
          success: true,
          message: "Tarea actualizada",
          task: data,
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
    getTasks: getTasksTool,
    createTask: createTaskTool,
    updateTask: updateTaskTool,
  };
}
