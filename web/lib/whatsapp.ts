import { createHmac, timingSafeEqual } from "crypto";

interface OutboundTextMessage {
  to: string;
  body: string;
}

const WA_API_BASE = "https://graph.facebook.com";

export function verifyWhatsAppWebhook(mode?: string | null, token?: string | null) {
  return mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN;
}

export function verifyWebhookSignature(rawBody: string, signatureHeader?: string | null) {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret || !signatureHeader?.startsWith("sha256=")) {
    return true;
  }

  const incoming = Buffer.from(signatureHeader.replace("sha256=", ""), "hex");
  const expected = Buffer.from(createHmac("sha256", appSecret).update(rawBody).digest("hex"), "hex");
  if (incoming.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(incoming, expected);
}

export async function sendWhatsAppMessage(input: OutboundTextMessage) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION ?? "v21.0";

  if (!token || !phoneNumberId) {
    return { skipped: true as const, reason: "WHATSAPP credentials not configured." };
  }

  const response = await fetch(`${WA_API_BASE}/${apiVersion}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `******
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: input.to,
      type: "text",
      text: {
        preview_url: false,
        body: input.body,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`WhatsApp outbound error (${response.status})`);
  }

  return response.json();
}

export function extractWebhookEvents(payload: unknown) {
  const body = payload as {
    entry?: Array<{
      changes?: Array<{
        value?: {
          messages?: Array<{ id: string; from: string; type: string; text?: { body?: string } }>;
          statuses?: Array<{ id: string; status: string; recipient_id?: string }>;
        };
      }>;
    }>;
  };

  const events: Array<
    | { type: "message"; messageId: string; from: string; text: string }
    | { type: "status"; messageId: string; status: string; to?: string }
  > = [];

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const message of change.value?.messages ?? []) {
        if (message.type === "text") {
          events.push({
            type: "message",
            messageId: message.id,
            from: message.from,
            text: message.text?.body?.trim() ?? "",
          });
        }
      }

      for (const status of change.value?.statuses ?? []) {
        events.push({
          type: "status",
          messageId: status.id,
          status: status.status,
          to: status.recipient_id,
        });
      }
    }
  }

  return events;
}
