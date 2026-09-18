import { Request, Response } from "express";
import { handleEnquiryMessage } from "../enquiry/enquiry.service";
import { sendWhatsAppMessage } from "../../common/whatsappClient";

/// Twilio WhatsApp webhook: https://www.twilio.com/docs/whatsapp/api
export async function postWhatsAppWebhook(req: Request, res: Response) {
  const from: string = req.body.From ?? ""; // e.g. "whatsapp:+919999999999"
  const body: string = req.body.Body ?? "";
  const profileName: string = req.body.ProfileName ?? "WhatsApp User";

  const phone = from.replace("whatsapp:", "");

  const result = await handleEnquiryMessage({
    customerPhone: phone,
    customerName: profileName,
    channel: "WHATSAPP",
    message: body,
  });

  await sendWhatsAppMessage(phone, result.reply);

  // Acknowledge webhook receipt (Twilio expects a 200 with empty/TwiML body)
  res.status(200).send("<Response></Response>");
}
