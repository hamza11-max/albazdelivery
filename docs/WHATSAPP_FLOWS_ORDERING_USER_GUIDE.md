# WhatsApp Flows ordering — user guide

This guide describes how **WhatsApp-only ordering** works in Albaz Delivery: customers order inside WhatsApp without leaving the chat; each **vendor** uses **their own** WhatsApp Business number linked to **their store**. It complements internal plan reference `whatsapp_flows_ordering_218a252c`.

**Who should read this**

- **Vendors** — connect Meta identifiers to the store and understand what customers see.
- **Platform administrators** — configure the server environment and Meta webhooks.
- **Flow builders** — shape the Flow so the final payload matches what the backend expects.

---

## 1. Concepts

| Term | Meaning |
|------|---------|
| **Vendor number** | The WhatsApp Business number customers message. It is **not** a single “Albaz central” number unless you choose to operate that way later. |
| **phone_number_id** | Meta’s ID for that number in the WhatsApp Cloud API. Albaz uses it to know **which store** an event belongs to. |
| **Flow** | A guided form inside WhatsApp (catalog, address, confirm). Built in Meta’s Flow Builder. |
| **flow_token** | A short encoded string that carries **which store** the Flow is for. Your backend or template should send it when opening the Flow so the **data endpoint** can load the right products. |

---

## 2. Vendor guide (web dashboard)

### 2.1 Prerequisites

1. A **Meta Business** account and **WhatsApp Business Platform** access for the vendor’s number (WABA).
2. From Meta Developer / WhatsApp Manager, note:
   - **Phone number ID** (`phone_number_id`).
   - Optionally **WhatsApp Business Account ID** (WABA ID).
   - A **long-lived access token** if **you** send template or Flow messages from Albaz servers on behalf of this number.

### 2.2 Link the store in Albaz

1. Sign in to the **vendor** web app.
2. Open **Settings** (Paramètres / الإعدادات).
3. Find **WhatsApp (Flows)** / **Commandes WhatsApp (Flows)**.
4. Fill in:
   - **phone_number_id (Meta)** — required for webhooks to route orders to this store. Must match the number customers use.
   - **WABA ID** — optional but useful for support.
   - **Onboarding status** — optional label (e.g. `CONNECTED`).
   - **Access token** — paste only if you use server-side messaging; it is stored server-side and is **not** shown again after save.
5. Click **Save** / **Enregistrer WhatsApp**.

### 2.3 flow_token (for technical staff or templates)

The dashboard shows a **flow_token** value. When you **send** the Flow (Cloud API or template), include this token so Albaz knows the **store**:

- It is derived from your **store ID** (do not invent it manually; copy from the dashboard or use the same encoding your deployment uses: see `lib/whatsapp/flow-token.ts` in the codebase).

### 2.4 Auto-print receipt on confirmation (vendor app)

In **Settings → Receipt settings** (Paramètres des reçus), enable **Commandes WhatsApp**. When this is **on**, confirming a pending order (**Confirmer** / ACCEPTED) that came from WhatsApp triggers the same print path as a POS receipt: **silent print to the default / thermal printer in Electron**, or **browser print dialog** on the web. The choice is stored in `localStorage` key `vendor-auto-print-whatsapp-confirm`.

### 2.5 After an order is placed

- The order appears like any other order with source **WhatsApp** (`orderSource = WHATSAPP`). A **WhatsApp** badge is shown on the order card in the orders list.
- **Confirm, prepare, assign driver** in the same vendor and driver workflows you already use.
- **Pricing** for WhatsApp orders is **recalculated on the server** from your product catalog (customers cannot override unit prices through the Flow payload).

---

## 3. Platform administrator guide (deployment & Meta)

### 3.1 Environment variables

Set these on your hosting environment (see `.env.example` and `lib/whatsapp/meta-config.ts`):

| Variable | Purpose |
|----------|---------|
| `WHATSAPP_VERIFY_TOKEN` | Same string you enter in Meta’s webhook **Verify token** field. |
| `WHATSAPP_APP_SECRET` | Meta app secret; used to verify `X-Hub-Signature-256` on webhook POST bodies. |
| `WHATSAPP_FLOW_PRIVATE_KEY` | RSA **private** key PEM (use `\n` for newlines in `.env`). The matching **public** key must be uploaded in Meta for Flow endpoint encryption. |

### 3.2 URLs to register in Meta

| Endpoint | Use |
|----------|-----|
| `https://<your-domain>/api/webhooks/whatsapp` | **Callback URL** for the WhatsApp product. Subscribe to **messages** (for Flow completion / `nfm_reply`). Use GET verification with `WHATSAPP_VERIFY_TOKEN`. |
| `https://<your-domain>/api/webhooks/whatsapp/flow` | **Flow data endpoint** URL in the Flow JSON / Flow Builder (HTTPS, valid certificate). Requires RSA key pair setup in Meta. |

### 3.3 Database migration

Apply Prisma migrations so these exist:

- Store WhatsApp fields (`whatsappPhoneNumberId`, etc.).
- `Order.orderSource` (`APP` | `WHATSAPP`).
- `WhatsAppWebhookEvent` for duplicate message handling.
- Optional `PromoCode.allowedSources` for channel-specific promos.

Run: `npx prisma migrate deploy` (or your CI equivalent).

### 3.4 Security notes

- Never expose `WHATSAPP_APP_SECRET` or `WHATSAPP_FLOW_PRIVATE_KEY` to the browser.
- Vendor **access tokens** in the database are server-only; the vendor API returns only **`hasAccessToken`**, not the secret value.

---

## 4. Customer experience (high level)

1. Customer opens chat with the **vendor’s** WhatsApp Business number (e.g. from “Order now” / **أطلب الآن**).
2. Customer completes the **Flow** (menu, address, etc.) **inside WhatsApp**.
3. Albaz receives the completion webhook, creates a **pending** order for that store, and notifies the vendor.
4. Vendor and driver follow the normal lifecycle (accept, prepare, deliver).

---

## 5. Flow designer: completion payload

When the Flow finishes, WhatsApp sends an interactive payload whose **`response_json`** must be JSON that matches the server schema (see `lib/whatsapp/flow-order-payload.ts`).

**Required shape (conceptually)**

- `items` — array of `{ "productId": "<cuid>", "quantity": <positive integer> }`, at least one line.
- `city` — string, min length 2.
- Address — either `deliveryAddress` or `delivery_address`, at least 10 characters.

**Optional**

- `customerPhone` — Algerian mobile `0[567]XXXXXXXX` if you want to override the WhatsApp `wa_id` normalization.
- `paymentMethod` — `CASH` | `CARD` | `WALLET` (default `CASH`).
- `deliveryFee` or `delivery_fee` — non-negative number; if omitted or zero, the platform may apply the default delivery fee constant.

**Product IDs** must be real `Product.id` values from **that store**’s catalog.

**Reference example (not a full Flow):** `lib/whatsapp/examples/vendor-order-flow.example.json`. Final screens must follow [Meta Flow JSON](https://developers.facebook.com/docs/whatsapp/flows/reference/flowjson) rules.

---

## 6. Dynamic catalog (optional)

If the Flow uses a **data channel** pointed at `/api/webhooks/whatsapp/flow`:

- On **`ping`**, the server answers with an **active** health payload (encrypted per Meta).
- For **data exchange**, the decrypted payload includes **`flow_token`**; Albaz decodes it to **`storeId`** and returns product rows for that store only.

If `flow_token` is missing or invalid, the Flow endpoint returns an error message in the Flow response payload instead of catalog data.

---

## 7. Troubleshooting

| Symptom | Things to check |
|---------|-------------------|
| Webhook never fires | Callback URL, SSL, verify token, correct Meta app → WABA subscription. |
| `401 Invalid signature` | `WHATSAPP_APP_SECRET` matches the app that signs the request; body must be raw for HMAC. |
| Orders not attributed to the store | `phone_number_id` in vendor settings exactly matches Meta’s ID for that number. |
| Order rejected / validation error | `response_json` fields, product IDs belong to the store, address length, Algerian phone if provided. |
| Flow endpoint decrypt errors (421) | Public/private key pair mismatch or wrong `WHATSAPP_FLOW_PRIVATE_KEY` formatting (PEM with newlines). |
| Duplicate webhooks | Same `message_id` is ignored after the first successful record in `WhatsAppWebhookEvent`. |

---

## 8. Official Meta documentation

- [WhatsApp Cloud API — get started](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)
- [WhatsApp Flows — guides](https://developers.facebook.com/docs/whatsapp/flows/guides)
- [Implementing endpoint for Flows](https://developers.facebook.com/docs/whatsapp/flows/guides/implementingyourflowendpoint)
- [Receive Flow response (webhook)](https://developers.facebook.com/docs/whatsapp/flows/guides/receiveflowresponse)

---

## 9. Internal code map (for support engineers)

| Topic | Path |
|-------|------|
| Messages webhook | `app/api/webhooks/whatsapp/route.ts` |
| Flow encryption endpoint | `app/api/webhooks/whatsapp/flow/route.ts` |
| Store WhatsApp API | `app/api/stores/[id]/whatsapp/route.ts` |
| Order creation | `lib/orders/create-order-internal.ts` |
| Shadow user + phone | `lib/whatsapp/ensure-customer.ts`, `lib/whatsapp/phone.ts` |

---

*Document version: aligns with implementation described in plan `whatsapp_flows_ordering_218a252c`.*
