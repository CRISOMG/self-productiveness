// server/utils/ai/tools/supabase-scheduled-notifications.ts
import { tool } from "ai";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~~/app/types/database.types";

export function createSupabaseScheduledNotificationsTools(
  userId: string,
  supabase: SupabaseClient<Database>,
) {
  const getScheduledNotificationsTool = tool({
    description: `Lista las notificaciones programadas o recurrentes del usuario.
Usa esta herramienta cuando el usuario pregunte por sus alarmas, recordatorios activos o notificaciones programadas.`,
    inputSchema: z.object({
      limit: z
        .number()
        .default(50)
        .describe("Número máximo de notificaciones a recuperar"),
    }),
    execute: async ({ limit }) => {
      try {
        const { data, error } = await supabase
          .from("scheduled_notifications")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (error) throw error;

        return {
          success: true,
          count: data?.length || 0,
          notifications: data || [],
        };
      } catch (error: unknown) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  });

  const createScheduledNotificationTool = tool({
    description: `Crea una nueva notificación programada o recurrente.
Usa esto cuando el usuario te pida explícitamente que le "recuerdes" algo, pongas una "alarma" o programes una "notificación".
El formato de tiempo debe ser extraído de lo que dice el usuario. Dependiendo de la frecuencia (once, daily, weekly, monthly), calcula y pasa los parámetros correctos.`,
    inputSchema: z.object({
      title: z.string().describe("Título corto o asunto del recordatorio"),
      body: z
        .string()
        .optional()
        .describe("Mensaje largo o descripción del recordatorio"),
      frequency: z
        .enum(["once", "daily", "weekly", "monthly"])
        .describe("Frecuencia de la notificación"),
      time: z.string().describe("Hora del día en formato HH:MM (24 horas)"),
      days: z
        .array(z.enum(["MO", "TU", "WE", "TH", "FR", "SA", "SU"]))
        .optional()
        .describe(
          "Si la frecuencia es 'weekly', un array con los días de la semana",
        ),
    }),
    execute: async ({ title, body, frequency, time, days }) => {
      try {
        let rrule: string | undefined = undefined;
        const [hours, minutes] = time.split(":").map(Number);

        // Convert to Venezuela timezone internally for logic (America/Caracas is UTC-4)
        // Note: AI runs on the server (usually UTC). We need to shift it based on the user's local timezone.
        // For simplicity, we use the server's current date as the base but apply the hours requested by the AI.
        const now = new Date();
        const serverOffsetMs = now.getTimezoneOffset() * 60000;
        const venezuelaOffsetMs = -4 * 60 * 60000; // Assuming UTC-4

        // This is a rough estimation since the user runs on a specific timezone, we should honor the time passed directly
        let computedScheduledAt = new Date(
          now.getTime() + serverOffsetMs + venezuelaOffsetMs,
        );
        computedScheduledAt.setUTCHours(hours + 4, minutes, 0, 0); // Convert local hour back to UTC (+4 hours to UTC for America/Caracas)

        // Evaluate frequency
        if (frequency === "once") {
          // Si ya pasó la hora hoy UTC-4, es para mañana
          if (computedScheduledAt < now) {
            computedScheduledAt.setDate(computedScheduledAt.getDate() + 1);
          }
        } else if (frequency === "daily") {
          rrule = `FREQ=DAILY;BYHOUR=\${hours};BYMINUTE=\${minutes};BYSECOND=0`;
          if (computedScheduledAt < now) {
            computedScheduledAt.setDate(computedScheduledAt.getDate() + 1);
          }
        } else if (frequency === "weekly") {
          if (!days || days.length === 0) {
            return {
              success: false,
              error:
                "Se requieren los días de la semana (days) para la frecuencia 'weekly'",
            };
          }
          rrule = `FREQ=WEEKLY;BYDAY=\${days.join(",")};BYHOUR=\${hours};BYMINUTE=\${minutes};BYSECOND=0`;
          // Find next valid day
          const dayMap: Record<string, number> = {
            SU: 0,
            MO: 1,
            TU: 2,
            WE: 3,
            TH: 4,
            FR: 5,
            SA: 6,
          };
          let found = false;
          for (let i = 0; i < 7; i++) {
            const testDate = new Date(computedScheduledAt);
            testDate.setDate(computedScheduledAt.getDate() + i);
            const dayNum = testDate.getUTCDay(); // Actually we must check Local day if possible, assuming UTC day matches local day loosely for this MVP
            const dayStr = Object.keys(dayMap).find(
              (k) => dayMap[k] === dayNum,
            );

            if (dayStr && days.includes(dayStr as any)) {
              if (i === 0 && testDate < now) continue;
              computedScheduledAt = testDate;
              found = true;
              break;
            }
          }
          if (!found)
            computedScheduledAt.setDate(computedScheduledAt.getDate() + 1);
        } else if (frequency === "monthly") {
          rrule = `FREQ=MONTHLY;BYMONTHDAY=1;BYHOUR=\${hours};BYMINUTE=\${minutes};BYSECOND=0`;
          computedScheduledAt.setDate(1);
          if (computedScheduledAt < now) {
            computedScheduledAt.setMonth(computedScheduledAt.getMonth() + 1);
          }
        }

        const { data, error } = await supabase
          .from("scheduled_notifications")
          .insert({
            user_id: userId,
            rrule: rrule,
            payload_override: { title, body: body || "" },
            scheduled_at: computedScheduledAt.toISOString(),
            timezone: "America/Caracas", // Hardcoded safely as standard for this app context currently
            status: "active",
          })
          .select()
          .single();

        if (error) throw error;

        return {
          success: true,
          message: "Recordatorio programado con éxito",
          notification: data,
        };
      } catch (error: unknown) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  });

  const deleteScheduledNotificationTool = tool({
    description: `Elimina una notificación programada.
Usa esta herramienta cuando el usuario pida cancelar, eliminar o borrar un recordatorio. Necesitas el ID de la notificación (probablemente tendrás que llamar primero a getScheduledNotifications para obtener su ID si no lo tienes).`,
    inputSchema: z.object({
      id: z
        .string()
        .uuid()
        .describe("El ID (UUID) de la notificación programada a eliminar"),
    }),
    execute: async ({ id }) => {
      try {
        const { error } = await supabase
          .from("scheduled_notifications")
          .delete()
          .eq("id", id)
          .eq("user_id", userId);

        if (error) throw error;

        return {
          success: true,
          message: "Notificación eliminada exitosamente",
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
    getScheduledNotifications: getScheduledNotificationsTool,
    createScheduledNotification: createScheduledNotificationTool,
    deleteScheduledNotification: deleteScheduledNotificationTool,
  };
}
