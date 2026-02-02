// server/api/storage/notes.get.ts
import { serverSupabaseUser, serverSupabaseClient } from "#supabase/server";
import type { Database } from "~~/app/types/database.types";

const BUCKET_NAME = "yourfocus";
const NOTES_FOLDER = "notas";

interface NoteFile {
  id: string;
  name: string;
  path: string;
  mimeType: string;
}

/**
 * Lista recursivamente archivos en una carpeta de Supabase Storage
 */
async function listFilesRecursively(
  supabase: ReturnType<typeof serverSupabaseClient<Database>> extends Promise<
    infer T
  >
    ? T
    : never,
  basePath: string,
  currentPath: string = "",
  maxDepth: number = 2,
  currentDepth: number = 0,
): Promise<NoteFile[]> {
  if (currentDepth > maxDepth) return [];

  const fullPath = currentPath ? `${basePath}/${currentPath}` : basePath;
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(fullPath, {
      limit: 200,
      sortBy: { column: "name", order: "asc" },
    });

  if (error || !data) return [];

  const files: NoteFile[] = [];

  for (const item of data) {
    if (item.name === ".emptyFolderPlaceholder") continue;

    const itemPath = currentPath ? `${currentPath}/${item.name}` : item.name;

    // Si es carpeta (no tiene id), listar recursivamente
    if (item.id === null) {
      const subFiles = await listFilesRecursively(
        supabase,
        basePath,
        itemPath,
        maxDepth,
        currentDepth + 1,
      );
      files.push(...subFiles);
    } else {
      // Solo archivos markdown
      if (item.name.endsWith(".md")) {
        files.push({
          id: item.id,
          name: item.name,
          path: `${fullPath}/${item.name}`,
          mimeType: item.metadata?.mimetype || "text/markdown",
        });
      }
    }
  }

  return files;
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized: Debes estar logueado para ver archivos",
    });
  }

  const supabase = await serverSupabaseClient<Database>(event);
  const notesPath = `${user.sub}/${NOTES_FOLDER}`;

  // Listar archivos recursivamente (max depth 2)
  const files = await listFilesRecursively(supabase, notesPath, "", 2);

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
