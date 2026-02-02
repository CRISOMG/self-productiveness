// server/utils/ai/tools/supabase-storage.ts
import { tool } from "ai";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~~/app/types/database.types";

const BUCKET_NAME = "yourfocus";

/**
 * Estructura de carpetas:
 * {user_id}/
 * ├── bitacora/YYYY_MM_DD/     (audio + transcripciones)
 * ├── notas/                   (zettelkasten)
 * │   ├── 00 inbox/
 * │   ├── 10 referencias/
 * │   └── 20 artefactos/
 * └── inbox/                   (archivos del chat)
 */

interface StorageFile {
  name: string;
  path: string;
  size: number | null;
  mimeType: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

/**
 * Crea las herramientas de Supabase Storage con el contexto del usuario
 */
export function createSupabaseStorageTools(
  userId: string,
  supabase: SupabaseClient<Database>,
) {
  /**
   * Lista archivos en una carpeta del usuario
   */
  const listStorageFilesTool = tool({
    description: `Lista archivos en una carpeta de Supabase Storage del usuario.
Carpetas disponibles:
- "bitacora" - Transcripciones de audio por día
- "notas" - Notas en formato zettelkasten
- "notas/00 inbox" - Notas sin procesar
- "notas/10 referencias" - Material de referencia
- "notas/20 artefactos" - Artefactos sintetizados
- "inbox" - Archivos del chat para procesar

Puedes especificar subcarpetas, ej: "bitacora/2026_02_01"`,
    inputSchema: z.object({
      folder: z
        .string()
        .describe("Carpeta a listar (ej: 'bitacora', 'notas/00 inbox')"),
      limit: z
        .number()
        .optional()
        .default(50)
        .describe("Máximo de archivos a retornar"),
    }),
    execute: async ({ folder, limit }) => {
      try {
        const path = `${userId}/${folder}`;
        const { data, error } = await supabase.storage
          .from(BUCKET_NAME)
          .list(path, {
            limit: limit || 50,
            sortBy: { column: "created_at", order: "desc" },
          });

        if (error) {
          return { success: false, error: error.message };
        }

        const files: StorageFile[] = (data || [])
          .filter((f) => f.name !== ".emptyFolderPlaceholder")
          .map((f) => ({
            name: f.name,
            path: `${path}/${f.name}`,
            size: f.metadata?.size || null,
            mimeType: f.metadata?.mimetype || null,
            createdAt: f.created_at || null,
            updatedAt: f.updated_at || null,
          }));

        return {
          success: true,
          folder: path,
          count: files.length,
          files,
        };
      } catch (error: unknown) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  });

  /**
   * Lee el contenido de un archivo de texto
   */
  const readStorageFileTool = tool({
    description: `Lee el contenido de un archivo de texto de Supabase Storage.
Solo funciona para archivos de texto (txt, md, json).
Para archivos binarios (audio, imágenes), usa getStorageFileUrl.`,
    inputSchema: z.object({
      path: z
        .string()
        .describe(
          "Path completo del archivo (ej: '{user_id}/bitacora/2026_02_01/10.30.webm.txt')",
        ),
    }),
    execute: async ({ path }) => {
      try {
        // Asegurar que el path tenga el userId correcto
        const safePath = path.startsWith(userId) ? path : `${userId}/${path}`;

        const { data, error } = await supabase.storage
          .from(BUCKET_NAME)
          .download(safePath);

        if (error) {
          return { success: false, error: error.message };
        }

        const content = await data.text();

        return {
          success: true,
          path: safePath,
          content: content.slice(0, 15000), // Limitar a 15k chars
          truncated: content.length > 15000,
        };
      } catch (error: unknown) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  });

  /**
   * Obtiene URL firmada para acceder a un archivo
   */
  const getStorageFileUrlTool = tool({
    description: `Obtiene una URL firmada temporal para acceder a un archivo.
Útil para archivos binarios como audio o imágenes.
La URL expira en 1 hora.`,
    inputSchema: z.object({
      path: z.string().describe("Path completo del archivo"),
      expiresIn: z
        .number()
        .optional()
        .default(3600)
        .describe("Segundos hasta expiración (default: 3600)"),
    }),
    execute: async ({ path, expiresIn }) => {
      try {
        const safePath = path.startsWith(userId) ? path : `${userId}/${path}`;

        const { data, error } = await supabase.storage
          .from(BUCKET_NAME)
          .createSignedUrl(safePath, expiresIn || 3600);

        if (error) {
          return { success: false, error: error.message };
        }

        return {
          success: true,
          path: safePath,
          url: data.signedUrl,
          expiresIn: expiresIn || 3600,
        };
      } catch (error: unknown) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  });

  /**
   * Sube o actualiza un archivo de texto
   */
  const uploadStorageFileTool = tool({
    description: `Sube o actualiza un archivo de texto en Supabase Storage.
Carpetas destino típicas:
- "notas/00 inbox" - Notas nuevas sin procesar
- "notas/10 referencias" - Material de referencia
- "notas/20 artefactos" - Síntesis y artefactos

El archivo se sobrescribe si ya existe.`,
    inputSchema: z.object({
      folder: z
        .string()
        .describe("Carpeta destino (ej: 'notas/20 artefactos')"),
      fileName: z
        .string()
        .describe("Nombre del archivo (incluir extensión, ej: 'resumen.md')"),
      content: z.string().describe("Contenido del archivo"),
      contentType: z
        .string()
        .optional()
        .default("text/plain")
        .describe("MIME type (default: text/plain)"),
    }),
    execute: async ({ folder, fileName, content, contentType }) => {
      try {
        const path = `${userId}/${folder}/${fileName}`;

        const { error } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(path, content, {
            contentType: contentType || "text/plain",
            upsert: true,
          });

        if (error) {
          return { success: false, error: error.message };
        }

        // Obtener URL firmada del archivo creado
        const { data: urlData } = await supabase.storage
          .from(BUCKET_NAME)
          .createSignedUrl(path, 3600);

        return {
          success: true,
          path,
          url: urlData?.signedUrl || null,
          message: `Archivo guardado en ${path}`,
        };
      } catch (error: unknown) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  });

  /**
   * Elimina un archivo
   */
  const deleteStorageFileTool = tool({
    description: `Elimina un archivo de Supabase Storage.
¡CUIDADO! Esta acción es irreversible.`,
    inputSchema: z.object({
      path: z.string().describe("Path completo del archivo a eliminar"),
    }),
    execute: async ({ path }) => {
      try {
        const safePath = path.startsWith(userId) ? path : `${userId}/${path}`;

        const { error } = await supabase.storage
          .from(BUCKET_NAME)
          .remove([safePath]);

        if (error) {
          return { success: false, error: error.message };
        }

        return {
          success: true,
          message: `Archivo eliminado: ${safePath}`,
        };
      } catch (error: unknown) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  });

  /**
   * Busca archivos por nombre o patrón
   */
  const searchStorageFilesTool = tool({
    description: `Busca archivos en todas las carpetas del usuario por nombre.
Busca en bitacora, notas e inbox.`,
    inputSchema: z.object({
      searchTerm: z.string().describe("Término de búsqueda (nombre parcial)"),
      folders: z
        .array(z.string())
        .optional()
        .default(["bitacora", "notas", "inbox"])
        .describe("Carpetas donde buscar"),
    }),
    execute: async ({ searchTerm, folders }) => {
      try {
        const allFiles: StorageFile[] = [];
        const searchLower = searchTerm.toLowerCase();

        for (const folder of folders || ["bitacora", "notas", "inbox"]) {
          const listFolder = async (path: string): Promise<void> => {
            const { data } = await supabase.storage
              .from(BUCKET_NAME)
              .list(path, { limit: 100 });

            if (data) {
              for (const item of data) {
                if (item.name === ".emptyFolderPlaceholder") continue;

                const itemPath = `${path}/${item.name}`;

                // Si es carpeta, listar recursivamente
                if (item.id === null) {
                  await listFolder(itemPath);
                } else if (item.name.toLowerCase().includes(searchLower)) {
                  allFiles.push({
                    name: item.name,
                    path: itemPath,
                    size: item.metadata?.size || null,
                    mimeType: item.metadata?.mimetype || null,
                    createdAt: item.created_at || null,
                    updatedAt: item.updated_at || null,
                  });
                }
              }
            }
          };

          await listFolder(`${userId}/${folder}`);
        }

        return {
          success: true,
          searchTerm,
          count: allFiles.length,
          files: allFiles.slice(0, 30), // Limitar resultados
        };
      } catch (error: unknown) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  });

  /**
   * Obtiene estructura de carpetas del usuario
   */
  const getUserStorageFoldersTool = tool({
    description: `Obtiene la estructura de carpetas del usuario en Supabase Storage.
SIEMPRE usa esta herramienta primero antes de listar o crear archivos.`,
    inputSchema: z.object({}),
    execute: async () => {
      try {
        const folders = {
          root: `${userId}`,
          bitacora: `${userId}/bitacora`,
          notas: `${userId}/notas`,
          notasInbox: `${userId}/notas/00 inbox`,
          notasReferencias: `${userId}/notas/10 referencias`,
          notasArtefactos: `${userId}/notas/20 artefactos`,
          inbox: `${userId}/inbox`,
        };

        // Verificar qué carpetas existen
        const existingFolders: Record<string, boolean> = {};

        for (const [key, path] of Object.entries(folders)) {
          const { data } = await supabase.storage
            .from(BUCKET_NAME)
            .list(path, { limit: 1 });
          existingFolders[key] = data !== null;
        }

        return {
          success: true,
          userId,
          bucket: BUCKET_NAME,
          folders,
          existing: existingFolders,
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
    listStorageFiles: listStorageFilesTool,
    readStorageFile: readStorageFileTool,
    getStorageFileUrl: getStorageFileUrlTool,
    uploadStorageFile: uploadStorageFileTool,
    deleteStorageFile: deleteStorageFileTool,
    searchStorageFiles: searchStorageFilesTool,
    getUserStorageFolders: getUserStorageFoldersTool,
  };
}
