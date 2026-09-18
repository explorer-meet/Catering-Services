import twilio from "twilio";
import { env } from "../config/env";

export const twilioClient = env.twilioAccountSid
  ? twilio(env.twilioAccountSid, env.twilioAuthToken)
  : null;

export async function sendWhatsAppMessage(to: string, body: string) {
  if (!twilioClient) {
    console.warn("Twilio not configured; skipping WhatsApp send:", { to, body });
    return;
  }

  const toAddress = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
  return twilioClient.messages.create({
    from: env.twilioWhatsappFrom,
    to: toAddress,
    body,
  });
}
