// server/api/storage/content/[id].get.ts
import { serverSupabaseUser, serverSupabaseClient } from "#supabase/server";
import type { Database } from "~~/app/types/database.types";

const BUCKET_NAME = "yourfocus";
const NOTES_FOLDER = "notas";

/**
 * Busca un archivo por nombre en el storage recursivamente
 */
async function findFileByName(
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

    // Si es archivo y coincide el nombre
    if (item.id !== null) {
      const nameWithoutExt = item.name.replace(/\.md$/i, "");
      if (nameWithoutExt === fileName || item.name === fileName) {
        return `${fullPath}/${item.name}`;
      }
    } else {
      // Es carpeta, buscar recursivamente
      const found = await findFileByName(
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

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing file ID",
    });
  }

  const supabase = await serverSupabaseClient<Database>(event);
  const notesPath = `${user.sub}/${NOTES_FOLDER}`;

  // Buscar el archivo por nombre
  const filePath = await findFileByName(
    supabase,
    notesPath,
    decodeURIComponent(id),
  );

  if (!filePath) {
    throw createError({
      statusCode: 404,
      statusMessage: `File not found: ${id}`,
    });
  }

  // Descargar contenido
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .download(filePath);

  if (error || !data) {
    throw createError({
      statusCode: 500,
      statusMessage: error?.message || "Failed to download file",
    });
  }

  const content = await data.text();

  return {
    success: true,
    id,
    name: filePath.split("/").pop() || id,
    content,
    mimeType: "text/markdown",
  };
});
