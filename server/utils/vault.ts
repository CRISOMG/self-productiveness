// server/utils/vault.ts
// Opaque encryption for API keys using AES-256-GCM with server-side secret
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
} from "crypto";

interface EncryptedPayload {
  encrypted: string; // hex-encoded ciphertext
  iv: string; // hex-encoded IV
  tag: string; // hex-encoded auth tag
}

/**
 * Derives a 32-byte key from the JWT secret using SHA-256
 */
function deriveKey(): Buffer {
  const config = useRuntimeConfig();
  const secret = config.supabaseJwtSecret as string;
  if (!secret) {
    throw new Error(
      "[Vault] SUPABASE_JWT_SECRET is not configured in runtimeConfig",
    );
  }
  return createHash("sha256").update(secret).digest();
}

/**
 * Encrypts a plaintext string using AES-256-GCM
 */
export function encryptSecret(plaintext: string): EncryptedPayload {
  const key = deriveKey();
  const iv = randomBytes(12); // 96-bit IV for GCM
  const cipher = createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
  };
}

/**
 * Decrypts an AES-256-GCM encrypted payload back to plaintext
 */
export function decryptSecret(payload: EncryptedPayload): string {
  const key = deriveKey();
  const iv = Buffer.from(payload.iv, "hex");
  const tag = Buffer.from(payload.tag, "hex");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(payload.encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
