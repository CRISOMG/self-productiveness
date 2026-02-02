// server/api/notes/content/[id].get.ts
// Unified endpoint that internally decides between Google Drive and Supabase Storage
import { serverSupabaseUser, serverSupabaseClient } from "#supabase/server";
import type { Database } from "~~/app/types/database.types";
import {
  createDriveClient,
  findFolderByName,
  searchFiles,
  getFileContent,
} from "~~/server/services/google-drive.service";

const BUCKET_NAME = "yourfocus";
const NOTES_FOLDER = "notas";
const LEGACY_USER_ID = "4ddb8909-ef46-4cde-8feb-8ce0a3c72564";

/**
 * Busca un archivo por nombre en Supabase Storage recursivamente
 */
async function findFileInStorage(
  supabase: Awaited<ReturnType<typeof serverSupabaseClient<Database>>>,
  basePath: string,
  fileName: string,
  currentPath: string = "",
  maxDepth: number = 3,
  currentDepth: number = 0,
): Promise<string | null> {
  if (currentDepth > maxDepth) return null;

  const fullPath = currentPath ? `${basePath}/${currentPath}` : basePath;
  const { data } = await supabase.storage.from(BUCKET_NAME).list(fullPath, {
    limit: 200,
  });

  if (!data) return null;

  for (const item of data) {
    if (item.name === ".emptyFolderPlaceholder") continue;

    const itemPath = currentPath ? `${currentPath}/${item.name}` : item.name;

    if (item.id !== null) {
      const nameWithoutExt = item.name.replace(/\.md$/i, "");
      if (nameWithoutExt === fileName || item.name === fileName) {
        return `${fullPath}/${item.name}`;
      }
    } else {
      const found = await findFileInStorage(
        supabase,
        basePath,
        fileName,
        itemPath,
        maxDepth,
        currentDepth + 1,
      );
      if (found) return found;
    }
  }

  return null;
}

/**
 * Obtiene contenido desde Supabase Storage
 */
async function getContentFromStorage(
  supabase: Awaited<ReturnType<typeof serverSupabaseClient<Database>>>,
  userId: string,
  fileName: string,
) {
  const notesPath = `${userId}/${NOTES_FOLDER}`;
  const filePath = await findFileInStorage(supabase, notesPath, fileName);

  if (!filePath) {
    throw createError({
      statusCode: 404,
      statusMessage: `File not found: ${fileName}`,
    });
  }

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .download(filePath);

  if (error || !data) {
    throw createError({
      statusCode: 500,
      statusMessage: error?.message || "Failed to download",
    });
  }

  return await data.text();
}

/**
 * Obtiene contenido desde Google Drive
 */
async function getContentFromDrive(userId: string, fileName: string) {
  const config = useRuntimeConfig();

  const drive = createDriveClient({
    clientEmail: config.google.clientEmail,
    privateKey: config.google.privateKey,
    projectId: config.google.projectId,
  });

  // Find user's notas folder
  const userRootFolderId = await findFolderByName(drive, userId);
  if (!userRootFolderId) {
    throw createError({
      statusCode: 404,
      statusMessage: "User folder not found",
    });
  }

  // Find notas folder
  const notasFolderResult = await searchFiles(drive, {
    raw_query: `'${userRootFolderId}' in parents and name = 'notas' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
  });

  if (!notasFolderResult.length) {
    throw createError({
      statusCode: 404,
      statusMessage: "Notas folder not found",
    });
  }

  // Search for the file
  const fileQuery = `name = '${fileName}.md' and trashed = false`;
  const files = await searchFiles(drive, { raw_query: fileQuery });

  if (!files.length) {
    throw createError({
      statusCode: 404,
      statusMessage: `File not found: ${fileName}`,
    });
  }

  return await getFileContent(drive, files[0].id);
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing file ID" });
  }

  const fileName = decodeURIComponent(id);
  const useGoogleDrive = user.sub === LEGACY_USER_ID;

  let content: string;

  if (useGoogleDrive) {
    content = await getContentFromDrive(user.sub, fileName);
  } else {
    const supabase = await serverSupabaseClient<Database>(event);
    content = await getContentFromStorage(supabase, user.sub, fileName);
  }

  return {
    success: true,
    id,
    name: fileName,
    content,
    mimeType: "text/markdown",
  };
});
