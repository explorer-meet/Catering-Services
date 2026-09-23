import { Request, Response } from "express";
import twilio from "twilio";
import { handleEnquiryMessage } from "../enquiry/enquiry.service";

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

  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(result.reply);

  res.type("text/xml").status(200).send(twiml.toString());
}
