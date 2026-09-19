import { Request, Response } from "express";
import { createContactEnquiry, createEnquiryFromWizard, handleEnquiryMessage, getEnquiry, listEnquiries } from "./enquiry.service";

export async function postWizardEnquiry(req: Request, res: Response) {
  const enquiry = await createEnquiryFromWizard(req.body);
  res.status(201).json(enquiry);
}

export async function postContactEnquiry(req: Request, res: Response) {
  const enquiry = await createContactEnquiry(req.body);
  res.status(201).json(enquiry);
}

export async function postEnquiryMessage(req: Request, res: Response) {
  const { customerPhone, customerName, channel, message, enquiryId } = req.body;
  const result = await handleEnquiryMessage({
    customerPhone,
    customerName,
    channel: channel ?? "WEBSITE",
    message,
    enquiryId,
  });
  res.status(200).json(result);
}

export async function getEnquiryById(req: Request, res: Response) {
  const enquiry = await getEnquiry(req.params.id);
  res.status(200).json(enquiry);
}

export async function getAllEnquiries(_req: Request, res: Response) {
  const enquiries = await listEnquiries();
  res.status(200).json(enquiries);
}
