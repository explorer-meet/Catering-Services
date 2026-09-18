import { Request, Response } from "express";
import {
  confirmPayment,
  getOutstandingAmount,
  initiatePayment,
  listPaymentsForBooking,
} from "./payment.service";

export async function postInitiatePayment(req: Request, res: Response) {
  const payment = await initiatePayment(req.body);
  res.status(201).json(payment);
}

export async function postConfirmPayment(req: Request, res: Response) {
  const payment = await confirmPayment(req.body);
  res.status(200).json(payment);
}

export async function getOutstanding(req: Request, res: Response) {
  const outstanding = await getOutstandingAmount(req.params.bookingId);
  res.status(200).json(outstanding);
}

export async function getPayments(req: Request, res: Response) {
  const payments = await listPaymentsForBooking(req.params.bookingId);
  res.status(200).json(payments);
}
