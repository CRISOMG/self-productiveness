# Pricing and AI Strategy (v3.0)

## 1. Plan Matrix & Limitations

Designed to balance **User Value** with **Financial Sovereignty**.

| Feature                  | **Starter (Free)**             | **Basic ($12/mo)**          | **Tech (BYOK) ($15/mo)**     |
| :----------------------- | :----------------------------- | :-------------------------- | :--------------------------- |
| **Target Audience**      | Trial Users                    | Knowledge Workers           | Devs / Tech Community        |
| **AI Engine**            | Gemini 3 Flash (Limited)       | **Gemini 3 Flash (Full)**   | **User Gemini API Key (G3)** |
| **Audio Input**          | 2 bitácoras/semana (Máx 2 min) | **Ilimitadas** (Máx 20 min) | Ilimitado                    |
| **Zero-Knowledge**       | N/A                            | Server-Side Encrypted       | **Zero-Knowledge (Vault)**   |
| **Interoperability**     | App Only                       | Mobile + Web Sync           | **Full API + Webhooks**      |
| **Max AI Budget (COGS)** | < $1.00                        | **< $5.40 (45%)**           | $0 (User pays Google)        |

---

## 2. Zero-Knowledge Security (UX-First)

To achieve maximum security without destroying UX (avoiding a secondary passphrase), we will implement a **Session-Derived Encryption** flow.

### Workflow:

1.  **Encryption at Client:**
    - The `GEMINI_API_KEY` is encrypted in the browser using a **Master_Key_Hash** derived from the user's **password** using **PBKDF2** (with email as salt).
    - The browser sends the **Encrypted Blob** and **IV** to the server.
2.  **Supabase Vault:**
    - The server stores this blob securely with a `user_id` reference.
3.  **Hot Decryption (Edge Execution):**
    - When a bitácora is processed, the client includes the `Master_Key_Hash` in a secure header (`X-BYOK-Secret`).
    - The server uses this hash to decrypt the API Key in RAM, calls Gemini 3, and returns the result.
    - _Soberanía:_ If the user loses their password, the hash changes. They simply re-enter their Gemini Key (recuperable from Google Studio). Simple, secure, and comfortable.

---

## 3. AI Consumption & COGS Control

### The 45% Rule

For the **Basic Plan ($12)**, the net margin must be protected.

- **Ingreso Bruto:** $12.00
- **Payment Fees (LS):** ~$1.10
- **Max AI Budget (45% of $12):** **$5.40**
- **Net Target Margin:** $12 - $1.10 - $2.00 (Avg Cost) = **$8.90 profit**.

### Measurement Infrastructure: `usage_auditor`

- **Real-time Tracking:** Every Gemini 3 request logs its token/second usage to `ai_usage_metrics`.
- **Automated Kill-Switch:**
  - **Tier 1 (80% Budget):** UI sends an encouraging notification about intensive focus sessions.
  - **Tier 2 (95% Budget):** Suggests upgrading to the **Tech Plan ($15)** to use their own key for unlimited leverage.
- **Token Optimization (G3):**
  - **Context Caching:** Mandatory for Basic plans to keep G3 costs within the 45% threshold.
  - **Audio Comprensión:** Logic to compress audio to exactly 24kbps before Gemini ingestion.

---

## 4. Community & Mission (Tech Plan)

The **Tech Plan ($15)** is more than just BYOK; it's a "Supporter" tier.

- **Code Visibility:** We will open specific modules of the project (or the full logic) for Tech Plan users to audit and contribute.
- **Community Mission:** Positioning Yourfocus as a community-driven cognitive prosthesis, where the $15 supports the core infrastructure while the user brings their own computational power.
