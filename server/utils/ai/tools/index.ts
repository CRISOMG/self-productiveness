// server/utils/ai/tools/index.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~~/app/types/database.types";
import { thinkTool } from "./think";
import { createGoogleDriveTools } from "./google-drive";
import { createSupabaseTasksTools } from "./supabase-tasks";
import { createSupabaseStorageTools } from "./supabase-storage";
import { createSupabaseTagsTools } from "./supabase-tags";
import { createSupabaseTaskTemplatesTools } from "./supabase-task-templates";
import { createSupabaseScheduledNotificationsTools } from "./supabase-scheduled-notifications";

export interface ToolsConfig {
  userId: string;
  supabase: SupabaseClient<Database>;
  google: {
    projectId: string;
    clientEmail: string;
    privateKey: string;
  };
}

/**
 * Crea todos los tools del agente con la configuración proporcionada
 */
export function createTools(config: ToolsConfig) {
  // Google Drive tools (legacy - deprecated, use storageTools instead)
  const driveTools = createGoogleDriveTools({
    ...config.google,
    userId: config.userId,
  });

  // Supabase Tasks tools
  const taskTools = createSupabaseTasksTools(config.userId, config.supabase);

  // Supabase Storage tools (new - replaces Google Drive for file storage)
  const storageTools = createSupabaseStorageTools(
    config.userId,
    config.supabase,
  );

  // Supabase Tags tools
  const tagTools = createSupabaseTagsTools(config.userId, config.supabase);

  // Supabase Task Templates tools
  const taskTemplateTools = createSupabaseTaskTemplatesTools(
    config.userId,
    config.supabase,
  );

  // Supabase Scheduled Notifications tools
  const scheduledNotificationsTools = createSupabaseScheduledNotificationsTools(
    config.userId,
    config.supabase,
  );

  return {
    think: thinkTool,
    // Legacy Google Drive tools (for reading existing files)
    ...driveTools,
    // Supabase tools
    ...taskTools,
    ...storageTools,
    ...tagTools,
    ...taskTemplateTools,
    ...scheduledNotificationsTools,
  };
}

export type AITools = ReturnType<typeof createTools>;
