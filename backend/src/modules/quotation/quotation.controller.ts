import { Request, Response } from "express";
import { createQuotation, getQuotation } from "./quotation.service";

export async function postCreateQuotation(req: Request, res: Response) {
  const quotation = await createQuotation(req.body);
  res.status(201).json(quotation);
}

export async function getQuotationById(req: Request, res: Response) {
  const quotation = await getQuotation(req.params.id);
  res.status(200).json(quotation);
}
