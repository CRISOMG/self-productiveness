# Technical Specification: Zero-Knowledge Security Vault (ZK-Vault)

## 1. Overview

As part of the **Financial Sovereignty** mission, Yourfocus implements a Zero-Knowledge architecture for users providing their own Gemini 3 API Keys (**Tech Plan / BYOK**). This ensures that the platform never has access to the user's sensitive credentials in plaintext, nor can the administrators or database providers decrypt them without the user's active session.

## 2. Key Derivation Function (KDF)

The security of the vault relies on a master key that exists only in the user's memory (as their password) and the browser's volatile memory (as a hash).

### Method: PBKDF2 (Password-Based Key Derivation Function 2)

- **Source:** User's login password.
- **Salt:** User's email address (normalised to lowercase).
- **Iterations:** 100,000 (standard performance/security balance for Web Crypto API).
- **Hash Function:** SHA-256.
- **Output Name:** `Master_Key_Hash`.

### Workflow:

1. During Login/Signup, the frontend captures the password.
2. The `Master_Key_Hash` is generated using **Web Crypto API**.
3. The result is stored in `sessionStorage` (volatily) or `localStorage` (for comfort if the user chooses "Remember Me").

## 3. Client-Side Encryption (AES-GCM)

When a user adds or updates their Gemini 3 API Key:

1. **Encryption:** The browser uses the `Master_Key_Hash` to encrypt the `GEMINI_API_KEY` using **AES-256-GCM**.
2. **Payload:**
   - `encrypted_blob`: The encrypted ciphertext.
   - `iv`: Initialization Vector (unique per encryption).
3. **Storage:** The payload is sent to Supabase and stored in a private schema (Vault).

## 4. Hot-Decryption Proxy

To maintain a high-quality **Developer Experience (DX)** while using the Vercel AI SDK, the decryption happens just-in-time in the secure server context.

### The `X-BYOK-Secret` Header

Every request to `/api/chat` from a Tech Plan user includes:

```http
X-BYOK-Secret: [Master_Key_Hash]
```

### Server-Side Implementation (Provider Logic):

The `createAIProvider` function in `server/utils/ai/provider.ts` handles the logic:

1. **Detection:** Checks if the user is on the **Tech Plan**.
2. **Vault Retrieval:** Fetches the `encrypted_blob` and `iv` from the database.
3. **Ephemeral Decryption:** Uses the `X-BYOK-Secret` to decrypt the blob in RAM.
4. **Injection:** Configures the Gemini 3 client with the decrypted key.
5. **Memory Clean:** The plaintext key is never logged and is discarded once the request finishes.

## 5. Security Edge Cases

### Password Change / Reset

- **Recovery Flow:** If the user resets their password, the `Master_Key_Hash` changes. The old encrypted key becomes undecryptable.
- **User UX:** Since the Gemini Key is recoverable from Google AI Studio, the system will prompt: _"For your security, please re-link your Gemini Key to match your new password."_

### Multi-Device Support

- Since the derivation is deterministic (Password + Email), the `Master_Key_Hash` will be identical across Desktop, Mobile, and PWA, ensuring seamless sync without sharing keys.

## 6. Database Schema (Supabase)

### `user_vault_secrets`

| Column          | Type        | Description               |
| :-------------- | :---------- | :------------------------ |
| `user_id`       | `uuid` (PK) | Reference to `auth.users` |
| `encrypted_key` | `text`      | AES-GCM ciphertext        |
| `iv`            | `text`      | Init Vector (Base64)      |
| `created_at`    | `timestamp` | Audit date                |
| `updated_at`    | `timestamp` | For re-sync detection     |
