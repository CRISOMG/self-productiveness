// server/utils/ai/tools/google-drive.ts
import { tool } from "ai";
import { z } from "zod";
import {
  createDriveClient,
  searchFiles,
  getFileContent,
  findFolderByName,
  type DriveFile,
} from "~~/server/services/google-drive.service";

/**
 * Crea las herramientas de Google Drive con el contexto del usuario
 */
export function createGoogleDriveTools(config: {
  projectId: string;
  clientEmail: string;
  privateKey: string;
  userId: string;
}) {
  const drive = createDriveClient({
    projectId: config.projectId,
    clientEmail: config.clientEmail,
    privateKey: config.privateKey,
  });

  const searchDriveTool = tool({
    description: `Busca archivos y carpetas en Google Drive del usuario.
Ejemplos de queries:
- "name contains 'contrato' and trashed = false"
- "mimeType = 'application/vnd.google-apps.folder' and trashed = false"

IMPORTANTE: Siempre incluye 'trashed = false'`,
    inputSchema: z.object({
      query: z.string().describe("Query string de Google Drive"),
    }),
    execute: async ({ query }) => {
      try {
        const files = await searchFiles(drive, { raw_query: query });
        return {
          success: true,
          count: files.length,
          files: files.slice(0, 10),
        };
      } catch (error: unknown) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  });

  const downloadDriveFileTool = tool({
    description: `Lee el contenido de un archivo de Google Drive por su ID.`,
    inputSchema: z.object({
      fileId: z.string().describe("ID del archivo en Google Drive"),
    }),
    execute: async ({ fileId }) => {
      try {
        const content = await getFileContent(drive, fileId);
        return {
          success: true,
          content: content.slice(0, 10000),
        };
      } catch (error: unknown) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  });

  const uploadDriveFileTool = tool({
    description: `Sube un archivo de texto a Google Drive.`,
    inputSchema: z.object({
      fileName: z.string().describe("Nombre del archivo (incluir extensión)"),
      content: z.string().describe("Contenido del archivo"),
      folderId: z.string().describe("ID de la carpeta destino"),
    }),
    execute: async ({ fileName, content, folderId }) => {
      try {
        const response = await drive.files.create({
          requestBody: {
            name: fileName,
            parents: [folderId],
            mimeType: "text/plain",
          },
          media: {
            mimeType: "text/plain",
            body: content,
          },
          fields: "id,name,webViewLink,mimeType",
        });

        return {
          success: true,
          file: {
            id: response.data.id || "",
            name: response.data.name || "",
            webViewLink: response.data.webViewLink || "",
          },
        };
      } catch (error: unknown) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  });

  const updateDriveFileTool = tool({
    description: `Actualiza el contenido de un archivo existente en Google Drive.`,
    inputSchema: z.object({
      fileId: z.string().describe("ID del archivo a actualizar"),
      content: z.string().describe("Nuevo contenido del archivo"),
    }),
    execute: async ({ fileId, content }) => {
      try {
        const response = await drive.files.update({
          fileId,
          media: {
            mimeType: "text/plain",
            body: content,
          },
          fields: "id,name,webViewLink,mimeType",
        });

        return {
          success: true,
          file: {
            id: response.data.id || "",
            name: response.data.name || "",
            webViewLink: response.data.webViewLink || "",
          },
        };
      } catch (error: unknown) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  });

  const getUserFoldersTool = tool({
    description: `Obtiene los IDs de las carpetas del usuario (raíz, bitácora, notas, inbox).
SIEMPRE usa esta herramienta primero antes de buscar o crear archivos.`,
    inputSchema: z.object({}),
    execute: async () => {
      try {
        const userFolderId = await findFolderByName(drive, config.userId);

        if (!userFolderId) {
          return {
            success: false,
            error: "No se encontró la carpeta del usuario",
          };
        }

        const subfolders = await searchFiles(drive, {
          raw_query: `'${userFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        });

        const folders: Record<string, string> = { root: userFolderId };

        subfolders.forEach((f: DriveFile) => {
          const name = f.name.toLowerCase();
          if (name === "bitacora") folders.bitacora = f.id;
          if (name === "notas") folders.notas = f.id;
          if (name === "inbox") folders.inbox = f.id;
        });

        return { success: true, folders };
      } catch (error: unknown) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  });

  return {
    searchDrive: searchDriveTool,
    downloadDriveFile: downloadDriveFileTool,
    uploadDriveFile: uploadDriveFileTool,
    updateDriveFile: updateDriveFileTool,
    getUserFolders: getUserFoldersTool,
  };
}
