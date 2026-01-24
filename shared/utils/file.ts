// Based on the user provided JSON
export interface GoogleDriveFile {
  kind: string;
  id: string;
  name: string;
  mimeType: string;
  starred: boolean;
  trashed: boolean;
  explicitlyTrashed: boolean;
  parents: string[];
  spaces: string[];
  version: string;
  webContentLink: string;
  webViewLink: string;
  iconLink: string;
  hasThumbnail: boolean;
  thumbnailVersion: string;
  viewedByMe: boolean;
  createdTime: string;
  modifiedTime: string;
  modifiedByMeTime: string;
  modifiedByMe: boolean;
  owners: Array<{
    kind: string;
    displayName: string;
    photoLink: string;
    me: boolean;
    permissionId: string;
    emailAddress: string;
  }>;
  lastModifyingUser: {
    kind: string;
    displayName: string;
    photoLink: string;
    me: boolean;
    permissionId: string;
    emailAddress: string;
  };
  shared: boolean;
  ownedByMe: boolean;
  downloadRestrictions?: {
    itemDownloadRestriction: {
      restrictedForReaders: boolean;
      restrictedForWriters: boolean;
    };
    effectiveDownloadRestrictionWithContext: {
      restrictedForReaders: boolean;
      restrictedForWriters: boolean;
    };
  };
  capabilities: {
    canAcceptOwnership: boolean;
    canAddChildren: boolean;
    canAddMyDriveParent: boolean;
    canChangeCopyRequiresWriterPermission: boolean;
    canChangeItemDownloadRestriction: boolean;
    canChangeSecurityUpdateEnabled: boolean;
    canChangeViewersCanCopyContent: boolean;
    canComment: boolean;
    canCopy: boolean;
    canDelete: boolean;
    canDisableInheritedPermissions: boolean;
    canDownload: boolean;
    canEdit: boolean;
    canEnableInheritedPermissions: boolean;
    canListChildren: boolean;
    canModifyContent: boolean;
    canModifyContentRestriction: boolean;
    canModifyEditorContentRestriction: boolean;
    canModifyOwnerContentRestriction: boolean;
    canModifyLabels: boolean;
    canMoveChildrenWithinDrive: boolean;
    canMoveItemIntoTeamDrive: boolean;
    canMoveItemOutOfDrive: boolean;
    canMoveItemWithinDrive: boolean;
    canReadLabels: boolean;
    canReadRevisions: boolean;
    canRemoveChildren: boolean;
    canRemoveContentRestriction: boolean;
    canRemoveMyDriveParent: boolean;
    canRename: boolean;
    canShare: boolean;
    canTrash: boolean;
    canUntrash: boolean;
  };
  viewersCanCopyContent: boolean;
  copyRequiresWriterPermission: boolean;
  writersCanShare: boolean;
  permissions: Array<{
    kind: string;
    id: string;
    type: string;
    emailAddress: string;
    role: string;
    displayName: string;
    deleted: boolean;
    pendingOwner: boolean;
  }>;
  permissionIds: string[];
  originalFilename: string;
  fullFileExtension: string;
  fileExtension: string;
  md5Checksum: string;
  sha1Checksum: string;
  sha256Checksum: string;
  size: string;
  quotaBytesUsed: string;
  headRevisionId: string;
  isAppAuthorized: boolean;
  linkShareMetadata?: {
    securityUpdateEligible: boolean;
    securityUpdateEnabled: boolean;
  };
  inheritedPermissionsDisabled?: boolean;
}

export interface FileWithStatus {
  file: File;
  id: string;
  previewUrl: string;
  status: "uploading" | "uploaded" | "error";
  uploadedUrl?: string;
  uploadedPathname?: string;
  error?: string;
  driveFile?: GoogleDriveFile;
}

export const FILE_UPLOAD_CONFIG = {
  maxSize: "40MB",
  types: [
    "image",
    "application/pdf",
    "text/csv",
    "audio",
    "text",
    "application/json",
    "application/javascript",
    "text/typescript",
    "text/markdown",
    "*/*",
    "*",
  ],
  acceptPattern: "*",
} as const;

export function getFileIcon(mimeType: string, fileName?: string): string {
  if (mimeType.startsWith("image/")) return "i-lucide-image";
  if (mimeType === "application/pdf") return "i-lucide-file-text";
  if (mimeType === "text/csv" || fileName?.endsWith(".csv"))
    return "i-lucide-file-spreadsheet";
  if (mimeType.startsWith("audio/")) return "i-lucide-file-audio";
  if (mimeType.startsWith("text/")) return "i-lucide-file-type-2";
  if (mimeType.startsWith("application/")) return "i-lucide-file-type-2";
  return "i-lucide-file";
}

export function removeRandomSuffix(filename: string): string {
  return filename.replace(/^(.+)-[a-zA-Z0-9]+(\.[^.]+)$/, "$1$2");
}

/**
 * Browsers on Windows often misidentify .ts files as video/mp2t or video/vnd.dlna.mpeg-tts
 * because of MPEG Transport Stream association. This function ensures we use the
 * correct MIME type for web development files.
 */
export function ensureCorrectMimeType(file: File): string {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const currentMime = file.type;

  const mimeMap: Record<string, string> = {
    ts: "text/typescript",
    tsx: "text/typescript",
    js: "application/javascript",
    jsx: "application/javascript",
    json: "application/json",
    md: "text/markdown",
    csv: "text/csv",
  };

  if (extension && mimeMap[extension]) {
    // If it's a known extension, override the suspicious or generic browser MIME
    if (
      currentMime.startsWith("video/") ||
      currentMime === "" ||
      currentMime === "application/octet-stream"
    ) {
      return mimeMap[extension];
    }
  }

  return currentMime;
}
