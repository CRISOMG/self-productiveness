// server/api/google-drive/files.get.ts
import { defineEventHandler, createError } from "h3";
import { serverSupabaseUser } from "#supabase/server";
import {
  createDriveClient,
  findFolderByName,
  listFilesInFolder,
  searchFiles,
} from "../../services/google-drive.service";

const NOTES_FOLDER_NAME = "notas";

async function _getNotesFolderId(drive: any, userId: string) {
  const userRootFolderId = await findFolderByName(drive, userId);
  const query = `'${userRootFolderId}' in parents and name = '${NOTES_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const result = await searchFiles(drive, { raw_query: query });
  const userNotesFolderId = result[0].id;
  return userNotesFolderId;
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const user = await serverSupabaseUser(event);

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized: Debes estar logueado para ver archivos",
    });
  }

  const drive = createDriveClient({
    clientEmail: config.google.clientEmail,
    privateKey: config.google.privateKey,
    projectId: config.google.projectId,
  });

  // Find the "notas" folder
  const folderId = await _getNotesFolderId(drive, user.sub);

  if (!folderId) {
    return {
      success: false,
      message: `No se encontró la carpeta "${NOTES_FOLDER_NAME}"`,
      files: [],
      count: 0,
    };
  }

  // List all files recursively (max depth 2)
  const files = await listFilesInFolder(drive, folderId, 0, 2);

  return {
    success: true,
    count: files.length,
    files: files.map((f) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
    })),
  };
});
