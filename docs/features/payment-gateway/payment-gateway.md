# Payment Gateway Integration: CoinGate (Phase 1)

## 1. Overview

As part of the **Financial Sovereignty** strategy for Yourfocus v3.0, CoinGate has been selected as the primary payment gateway for Phase 1. This allows for a frictionless "Cripto-Native" checkout flow, ideal for global users and specifically beneficial for high-friction environments like Venezuela.

## 2. Architecture

The integration follows a standard redirect-based checkout flow:

- **Frontend (Nuxt 3)**: User chooses a plan -> Calls `/api/payments/coingate/create-order`.
- **Backend (Nitro/Server API)**: Creates an order via CoinGate REST API -> Returns `payment_url`.
- **CoinGate**: Handles the payment process (BTC, USDT, Lightning, etc.).
- **Webhooks (Supabase Edge Function)**: Receives status updates (`paid`, `canceled`, `expired`) and updates the database.

## 3. Data Schema (Supabase)

### `subscriptions` table

| Column               | Type        | Description                                  |
| -------------------- | ----------- | -------------------------------------------- |
| `user_id`            | `uuid`      | Reference to `auth.users`                    |
| `plan`               | `text`      | `starter`, `pro`, `builder`                  |
| `status`             | `text`      | `active`, `trialing`, `past_due`, `canceled` |
| `current_period_end` | `timestamp` | Expiration date                              |

### `payment_orders` table (Audit Log)

| Column        | Type      | Description                          |
| ------------- | --------- | ------------------------------------ |
| `id`          | `uuid`    | Internal ID                          |
| `coingate_id` | `integer` | ID from CoinGate                     |
| `user_id`     | `uuid`    | Reference to `auth.users`            |
| `status`      | `text`    | `new`, `paid`, `canceled`, `expired` |
| `amount`      | `numeric` | Amount in USD                        |
| `currency`    | `text`    | `USD`                                |

## 4. Technical Flow

### Step 1: Create Order (`POST /api/payments/coingate/create-order`)

The frontend sends the `plan_id`. The server calculates the price and calls CoinGate.

**Request to CoinGate API:**

```http
POST https://api.coingate.com/v2/orders
Authorization: Token YOUR_API_TOKEN
Content-Type: application/x-www-form-urlencoded

order_id=INTERNAL_ORDER_ID
price_amount=12.0
price_currency=USD
receive_currency=USDT
callback_url=https://your-api.com/webhooks/coingate
success_url=https://yourfocus.app/payment/success
cancel_url=https://yourfocus.app/payment/cancel
```

### Step 2: Checkout Redirect

The server responds with the `payment_url`. The frontend redirects the user:

```js
window.location.href = response.payment_url;
```

### Step 3: Webhook Notification

CoinGate sends a `POST` request to the `callback_url` when the status changes.

**Verification Logic (Security):**

- CoinGate sends a `Coingate-Signature` header.
- This is an HMAC SHA256 hex hash of the request body using the `API_KEY` (v2) or `APP_SECRET` (v1) as the secret.
- **Recommended**: For maximum security, the webhook handler should call `GET /v2/orders/:id` to verify the status directly from CoinGate before updating the database.

## 5. Security & Environment Variables

- `COINGATE_API_TOKEN`: Secret token for API calls (Private).
- `COINGATE_WEBHOOK_SECRET`: (Optional) If using HMAC verification.
- `COINGATE_ENVIRONMENT`: `sandbox` (https://api-sandbox.coingate.com) or `live` (https://api.coingate.com).

## 6. Implementation Milestones

1. [ ] Create Supabase tables for `subscriptions` and `payment_orders`.
2. [ ] Setup CoinGate Sandbox account and API Keys.
3. [ ] Create Nitro endpoint `/api/payments/coingate/create-order`.
4. [ ] Implement Webhook handler in Supabase Edge Functions.
5. [ ] Connect UI (Pricing Modal) to the checkout flow.
