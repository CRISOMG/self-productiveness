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
          .select(
            `
            id, title, description, done, archived, created_at, tag_id,
            tasks_tags (
              tag,
              tags:tag (id, label)
            )
          `,
          )
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
            data?.map((t: any) => ({
              id: t.id,
              title: t.title,
              description: t.description,
              done: t.done,
              archived: t.archived,
              created_at: t.created_at,
              tags:
                t.tasks_tags?.map((tt: any) => tt.tags).filter(Boolean) || [],
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
Solo usar si el usuario pide EXPLÍCITAMENTE crear una tarea.
Puedes asignar múltiples etiquetas usando tagIds (array de IDs conocidos) o tagLabels (array de nombres, se crean si no existen).`,
    inputSchema: z.object({
      title: z.string().max(200).describe("Título de la tarea"),
      description: z.string().optional().describe("Descripción (opcional)"),
      tagIds: z
        .array(z.number())
        .optional()
        .describe("Array de IDs de etiquetas existentes"),
      tagLabels: z
        .array(z.string())
        .optional()
        .describe(
          "Array de nombres de etiquetas (se buscan o crean si no existen)",
        ),
    }),
    execute: async ({ title, description, tagIds, tagLabels }) => {
      try {
        const finalTagIds: number[] = [...(tagIds || [])];

        // Si se proporcionan tagLabels, buscar o crear las etiquetas
        if (tagLabels && tagLabels.length > 0) {
          for (const label of tagLabels) {
            const normalized = label.trim().toLowerCase();
            if (!normalized) continue;

            // Buscar primero en las etiquetas del usuario
            const { data: existingTag } = await supabase
              .from("tags")
              .select("id")
              .or(`user_id.eq.${userId},user_id.is.null`)
              .eq("label", normalized)
              .maybeSingle();

            if (existingTag) {
              if (!finalTagIds.includes(existingTag.id)) {
                finalTagIds.push(existingTag.id);
              }
            } else {
              // Crear nueva etiqueta
              const { data: newTag, error: tagError } = await supabase
                .from("tags")
                .insert({
                  label: normalized,
                  user_id: userId,
                })
                .select("id")
                .single();

              if (!tagError && newTag) {
                finalTagIds.push(newTag.id);
              }
            }
          }
        }

        // Create the task (using tag_id for backward compatibility - stores first tag)
        const { data, error } = await supabase
          .from("tasks")
          .insert({
            user_id: userId,
            title,
            description: description || null,
            done: false,
            archived: false,
            tag_id: finalTagIds.length > 0 ? finalTagIds[0] : null,
          })
          .select("id, title, description, tag_id, created_at")
          .single();

        if (error) throw error;

        // Insert into tasks_tags for multi-tag support
        if (finalTagIds.length > 0 && data) {
          const taskTagRows = finalTagIds.map((tagId) => ({
            task: data.id,
            tag: tagId,
            user_id: userId,
          }));

          await supabase.from("tasks_tags").insert(taskTagRows);
        }

        return {
          success: true,
          message: `Tarea creada: "${title}"${finalTagIds.length > 0 ? ` con ${finalTagIds.length} etiqueta(s)` : ""}`,
          task: data,
          assignedTagIds: finalTagIds,
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
    description: `Actualiza una tarea existente en Supabase.
Puedes asignar o cambiar las etiquetas usando tagIds (array de IDs) o tagLabels (array de nombres, se crean si no existen).
NOTA: Si se especifican etiquetas, se REEMPLAZAN todas las etiquetas existentes.`,
    inputSchema: z.object({
      id: z.string().uuid().describe("ID de la tarea"),
      done: z.boolean().optional().describe("Marcar como completada"),
      archived: z.boolean().optional().describe("Archivar la tarea"),
      title: z.string().optional().describe("Nuevo título"),
      description: z.string().optional().describe("Nueva descripción"),
      tagIds: z
        .array(z.number())
        .optional()
        .describe("Array de IDs de etiquetas (reemplaza las existentes)"),
      tagLabels: z
        .array(z.string())
        .optional()
        .describe(
          "Array de nombres de etiquetas (se buscan o crean si no existen)",
        ),
    }),
    execute: async ({
      id,
      done,
      archived,
      title,
      description,
      tagIds,
      tagLabels,
    }) => {
      try {
        const updates: Partial<Task> = {};
        const finalTagIds: number[] = [...(tagIds || [])];
        const hasTagChanges = tagIds !== undefined || tagLabels !== undefined;

        if (done !== undefined) updates.done = done;
        if (archived !== undefined) updates.archived = archived;
        if (title !== undefined) updates.title = title;
        if (description !== undefined) updates.description = description;

        // Handle tag labels (search or create)
        if (tagLabels && tagLabels.length > 0) {
          for (const label of tagLabels) {
            const normalized = label.trim().toLowerCase();
            if (!normalized) continue;

            // Buscar primero en las etiquetas del usuario
            const { data: existingTag } = await supabase
              .from("tags")
              .select("id")
              .or(`user_id.eq.${userId},user_id.is.null`)
              .eq("label", normalized)
              .maybeSingle();

            if (existingTag) {
              if (!finalTagIds.includes(existingTag.id)) {
                finalTagIds.push(existingTag.id);
              }
            } else {
              // Crear nueva etiqueta
              const { data: newTag, error: tagError } = await supabase
                .from("tags")
                .insert({
                  label: normalized,
                  user_id: userId,
                })
                .select("id")
                .single();

              if (!tagError && newTag) {
                finalTagIds.push(newTag.id);
              }
            }
          }
        }

        // Update tag_id for backward compatibility (first tag)
        if (hasTagChanges) {
          updates.tag_id = finalTagIds.length > 0 ? finalTagIds[0] : null;
        }

        if (Object.keys(updates).length === 0 && !hasTagChanges) {
          return {
            success: false,
            error: "No se especificaron campos para actualizar",
          };
        }

        // Update task if there are changes to the task table
        if (Object.keys(updates).length > 0) {
          const { data, error } = await supabase
            .from("tasks")
            .update(updates)
            .eq("id", id)
            .eq("user_id", userId)
            .select("id, title, done, archived, tag_id")
            .single();

          if (error) throw error;
        }

        // Sync tasks_tags if tag changes were requested
        if (hasTagChanges) {
          // Delete existing tags_tags for this task
          await supabase.from("tasks_tags").delete().eq("task", id);

          // Insert new tags
          if (finalTagIds.length > 0) {
            const taskTagRows = finalTagIds.map((tagId) => ({
              task: id,
              tag: tagId,
              user_id: userId,
            }));
            await supabase.from("tasks_tags").insert(taskTagRows);
          }
        }

        return {
          success: true,
          message: `Tarea actualizada${hasTagChanges ? ` con ${finalTagIds.length} etiqueta(s)` : ""}`,
          assignedTagIds: hasTagChanges ? finalTagIds : undefined,
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
