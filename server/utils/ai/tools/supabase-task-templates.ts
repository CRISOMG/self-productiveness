// server/utils/ai/tools/supabase-task-templates.ts
import { tool } from "ai";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~~/app/types/database.types";

export function createSupabaseTaskTemplatesTools(
  userId: string,
  supabase: SupabaseClient<Database>,
) {
  const listTaskTemplatesTool = tool({
    description: `Lista las plantillas (templates) de tareas disponibles para el usuario.
Usa esta herramienta cuando el usuario te pida ver las plantillas de tareas.`,
    parameters: z.object({}),
    execute: async () => {
      try {
        const { data, error } = await supabase
          .from("task_templates")
          .select(
            `
            id, title, default_description, created_at,
            task_templates_tags (
              tag_id,
              tags (id, label)
            )
          `,
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        return {
          success: true,
          count: data?.length || 0,
          templates:
            data?.map((t: any) => ({
              id: t.id,
              title: t.title,
              default_description: t.default_description,
              created_at: t.created_at,
              tags:
                t.task_templates_tags
                  ?.map((tt: any) => tt.tags)
                  .filter(Boolean) || [],
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

  const createTaskFromTemplateTool = tool({
    description: `Crea una nueva tarea utilizando una plantilla (template) existente.
Debes pasar el templateId. Esta herramienta creará la tarea copiando el título, la descripción por defecto (que puede contener checkboxes y links markdown) y las etiquetas asociadas a la plantilla.`,
    parameters: z.object({
      templateId: z
        .string()
        .uuid()
        .describe("El ID de la plantilla de tarea a instanciar"),
      customTitle: z
        .string()
        .optional()
        .describe("Si se especifica, sobreescribe el título de la plantilla"),
    }),
    execute: async ({ templateId, customTitle }) => {
      try {
        // 1. Fetch template
        const { data: template, error: templateError } = await supabase
          .from("task_templates")
          .select(
            `
            id, title, default_description,
            task_templates_tags (tag_id)
          `,
          )
          .eq("id", templateId)
          .eq("user_id", userId)
          .single();

        if (templateError)
          throw new Error("No se encontró la plantilla o no tienes acceso.");
        if (!template) throw new Error("Plantilla no encontrada.");

        const finalTitle = customTitle || template.title;
        const finalDescription = template.default_description || null;

        const tagIds =
          template.task_templates_tags?.map((tt: any) => tt.tag_id) || [];

        // 2. Create the task
        const { data: task, error: taskError } = await supabase
          .from("tasks")
          .insert({
            user_id: userId,
            title: finalTitle,
            description: finalDescription,
            done: false,
            archived: false,
            tag_id: tagIds.length > 0 ? tagIds[0] : null,
          })
          .select("id, title, description, tag_id, created_at")
          .single();

        if (taskError) throw taskError;

        // 3. Insert into tasks_tags for multi-tag support
        if (tagIds.length > 0 && task) {
          const taskTagRows = tagIds.map((tagId: number) => ({
            task: task.id,
            tag: tagId,
            user_id: userId,
          }));

          await supabase.from("tasks_tags").insert(taskTagRows);
        }

        return {
          success: true,
          message: `Tarea creada exitosamente desde plantilla: "${finalTitle}"`,
          task: task,
          assignedTagIds: tagIds,
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
    listTaskTemplates: listTaskTemplatesTool,
    createTaskFromTemplate: createTaskFromTemplateTool,
  };
}
