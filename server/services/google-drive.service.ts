// server/services/google-drive.service.ts
import { google, drive_v3 } from "googleapis";
import { createError } from "h3";

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
}

export interface ListFilesResult {
  files: DriveFile[];
  count: number;
}

const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";

/**
 * Creates an authenticated Google Drive client
 */
export function createDriveClient(config: {
  clientEmail: string;
  privateKey: string;
  projectId: string;
}): drive_v3.Drive {
  const privateKey = config.privateKey.replace(/\\n/g, "\n");
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: config.clientEmail,
      private_key: privateKey,
      project_id: config.projectId,
    },
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  return google.drive({ version: "v3", auth });
}

/**
 * Find a folder by name in Google Drive
 */
export async function findFolderByName(
  drive: drive_v3.Drive,
  folderName: string,
): Promise<string | null> {
  try {
    const response = await drive.files.list({
      q: `name = '${folderName}' and mimeType = '${FOLDER_MIME_TYPE}' and trashed = false`,
      fields: "files(id, name)",
      pageSize: 1,
    });

    const folders = response.data.files || [];
    return folders.length > 0 ? folders[0].id! : null;
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: "Error buscando carpeta",
      data: error.message,
    });
  }
}

/**
 * Recursively list all files in a folder with pagination support
 */
export async function listFilesInFolder(
  drive: drive_v3.Drive,
  folderId: string,
  currentDepth: number = 0,
  maxDepth: number = 2,
): Promise<DriveFile[]> {
  // Stop recursion at max depth
  if (currentDepth > maxDepth) return [];

  const allFiles: DriveFile[] = [];

  try {
    let pageToken: string | null | undefined = null;

    do {
      const response: any = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: "nextPageToken, files(id, name, mimeType, webViewLink)",
        pageSize: 500,
        pageToken: pageToken || undefined,
      });

      const files = response.data.files || [];

      for (const file of files) {
        if (!file.id || !file.name) continue;

        const driveFile: DriveFile = {
          id: file.id,
          name: file.name,
          mimeType: file.mimeType || "",
          webViewLink: file.webViewLink || undefined,
        };

        // If it's a folder, recurse into it
        if (file.mimeType === FOLDER_MIME_TYPE) {
          const subFiles = await listFilesInFolder(
            drive,
            file.id,
            currentDepth + 1,
            maxDepth,
          );
          allFiles.push(...subFiles);
        } else {
          // It's a file, add to results
          allFiles.push(driveFile);
        }
      }

      pageToken = response.data.nextPageToken;
    } while (pageToken);

    return allFiles;
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: "Error listando archivos de carpeta",
      data: error.message,
    });
  }
}

/**
 * Search files by name or ID
 */
export async function searchFiles(
  drive: drive_v3.Drive,
  options: { name?: string; fileId?: string; raw_query?: string },
): Promise<DriveFile[]> {
  const searchTerms: string[] = ["trashed = false"];

  if (options.name) {
    searchTerms.push(`name contains '${options.name}'`);
  }

  if (options.fileId) {
    searchTerms.push(`id = '${options.fileId}'`);
  }

  const finalQuery = options.raw_query || searchTerms.join(" and ");

  try {
    const response = await drive.files.list({
      q: finalQuery,
      fields: "files(id, name, mimeType, webViewLink)",
    });

    const files = response.data.files || [];
    return files
      .filter((f) => f.id && f.name)
      .map((f) => ({
        id: f.id!,
        name: f.name!,
        mimeType: f.mimeType || "",
        webViewLink: f.webViewLink || undefined,
      }));
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: "Error buscando archivos",
      data: error.message,
    });
  }
}

/**
 * Download file content by ID
 */
export async function getFileContent(
  drive: drive_v3.Drive,
  fileId: string,
): Promise<string> {
  try {
    const response = await drive.files.get(
      {
        fileId: fileId,
        alt: "media",
      },
      {
        responseType: "stream",
      },
    );

    return new Promise((resolve, reject) => {
      let data = "";
      (response.data as any)
        .on("data", (chunk: any) => (data += chunk))
        .on("end", () => resolve(data))
        .on("error", (err: any) => reject(err));
    });
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: "Error al descargar archivo",
      data: error.message,
    });
  }
}
