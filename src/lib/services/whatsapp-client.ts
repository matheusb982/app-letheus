/**
 * WhatsApp Cloud API client wrapper.
 * Handles sending messages, interactive buttons, and media download.
 */

const WHATSAPP_API_URL = "https://graph.facebook.com/v25.0";

/**
 * Normalize Brazilian phone numbers.
 * WhatsApp webhook sometimes sends BR numbers without the 9th digit (e.g., 554196964346).
 * The API requires the full format (e.g., 5541996964346).
 */
function normalizeBRPhone(phone: string): string {
  // BR number with 12 digits (55 + 2 DDD + 8 digits) — missing the 9th digit
  if (phone.length === 12 && phone.startsWith("55")) {
    const ddd = phone.slice(2, 4);
    const number = phone.slice(4);
    // Mobile numbers in BR start with 9 after adding the digit
    return `55${ddd}9${number}`;
  }
  return phone;
}

function getConfig() {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!accessToken || !phoneNumberId) {
    throw new Error("WHATSAPP_ACCESS_TOKEN e WHATSAPP_PHONE_NUMBER_ID são obrigatórios");
  }
  return { accessToken, phoneNumberId };
}

async function sendRequest(phoneNumberId: string, accessToken: string, body: Record<string, unknown>) {
  const response = await fetch(`${WHATSAPP_API_URL}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[WhatsApp] Erro ao enviar mensagem:", error);
    throw new Error(`WhatsApp API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Send a simple text message.
 */
export async function sendTextMessage(to: string, text: string) {
  const { accessToken, phoneNumberId } = getConfig();
  return sendRequest(phoneNumberId, accessToken, {
    messaging_product: "whatsapp",
    to: normalizeBRPhone(to),
    type: "text",
    text: { body: text.slice(0, 4096) }, // WhatsApp limit
  });
}

/**
 * Send interactive button message (max 3 buttons).
 */
export async function sendInteractiveButtons(
  to: string,
  bodyText: string,
  buttons: Array<{ id: string; title: string }>
) {
  const { accessToken, phoneNumberId } = getConfig();
  return sendRequest(phoneNumberId, accessToken, {
    messaging_product: "whatsapp",
    to: normalizeBRPhone(to),
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: bodyText.slice(0, 1024) },
      action: {
        buttons: buttons.slice(0, 3).map((btn) => ({
          type: "reply",
          reply: { id: btn.id, title: btn.title.slice(0, 20) },
        })),
      },
    },
  });
}

/**
 * Mark a message as read (sends blue checkmarks).
 */
export async function markAsRead(messageId: string) {
  const { accessToken, phoneNumberId } = getConfig();
  return sendRequest(phoneNumberId, accessToken, {
    messaging_product: "whatsapp",
    status: "read",
    message_id: messageId,
  });
}

/**
 * Verify webhook signature from Meta.
 * Returns true if the signature is valid.
 */
export async function verifyWebhookSignature(
  rawBody: string,
  signature: string
): Promise<boolean> {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) {
    console.error("[WhatsApp] WHATSAPP_APP_SECRET não configurado");
    return false;
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const expectedSignature = `sha256=${Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("")}`;

  return signature === expectedSignature;
}

/**
 * Parse incoming webhook payload and extract message data.
 */
export interface WhatsAppIncomingMessage {
  from: string; // phone number in E.164
  messageId: string;
  type: "text" | "interactive" | "image" | "unknown";
  text?: string;
  buttonReplyId?: string;
  mediaId?: string;
}

export function parseWebhookMessage(body: Record<string, unknown>): WhatsAppIncomingMessage | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entry = (body as any).entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message) return null;

    const base: WhatsAppIncomingMessage = {
      from: message.from,
      messageId: message.id,
      type: "unknown",
    };

    if (message.type === "text") {
      return { ...base, type: "text", text: message.text?.body };
    }

    if (message.type === "interactive") {
      const reply = message.interactive?.button_reply;
      return {
        ...base,
        type: "interactive",
        buttonReplyId: reply?.id,
        text: reply?.title,
      };
    }

    if (message.type === "image") {
      return { ...base, type: "image", mediaId: message.image?.id };
    }

    return base;
  } catch {
    return null;
  }
}
