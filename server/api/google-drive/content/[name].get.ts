// server/api/google-drive/content/[name].get.ts
import { defineEventHandler, createError, getRouterParam } from "h3";
import { serverSupabaseUser } from "#supabase/server";
import {
  createDriveClient,
  searchFiles,
  getFileContent,
} from "../../../services/google-drive.service";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const user = await serverSupabaseUser(event);

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage:
        "Unauthorized: Debes estar logueado para descargar archivos",
    });
  }

  const name = getRouterParam(event, "name");

  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: "Nombre del archivo requerido",
    });
  }

  const drive = createDriveClient({
    clientEmail: config.google.clientEmail,
    privateKey: config.google.privateKey,
    projectId: config.google.projectId,
  });

  // Search for the file by name
  const files = await searchFiles(drive, { name });

  if (files.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: `Archivo "${name}" no encontrado`,
    });
  }

  const file = files[0];
  const content = await getFileContent(drive, file.id);

  return {
    success: true,
    file: {
      id: file.id,
      name: file.name,
    },
    content,
  };
});
