// server/api/google-drive/search.get.ts
import { defineEventHandler, getQuery, createError } from "h3";
import { serverSupabaseUser } from "#supabase/server";
import {
  createDriveClient,
  searchFiles,
  getFileContent,
} from "../../services/google-drive.service";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const user = await serverSupabaseUser(event);

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized: Debes estar logueado para buscar archivos",
    });
  }

  const query = getQuery(event);
  const targetName = query.name as string;
  const targetFileId = query.fileId as string;

  const drive = createDriveClient({
    clientEmail: config.google.clientEmail,
    privateKey: config.google.privateKey,
    projectId: config.google.projectId,
  });

  // Search for files using the service
  const files = await searchFiles(drive, {
    name: targetName,
    fileId: targetFileId,
  });

  if (files.length === 0) {
    return {
      success: false,
      content: "No se encontraron archivos",
    };
  }

  const file = files[0];
  const content = await getFileContent(drive, file.id);

  return {
    success: true,
    count: files.length,
    files: files,
    content: content,
  };
});
