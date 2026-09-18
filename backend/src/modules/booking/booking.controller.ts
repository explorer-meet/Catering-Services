import { Request, Response } from "express";
import { confirmBooking, getBooking, listBookings, updateBookingStage } from "./booking.service";

export async function postConfirmBooking(req: Request, res: Response) {
  const booking = await confirmBooking(req.body);
  res.status(201).json(booking);
}

export async function patchBookingStage(req: Request, res: Response) {
  const booking = await updateBookingStage(req.params.id, req.body.stage);
  res.status(200).json(booking);
}

export async function getBookingById(req: Request, res: Response) {
  const booking = await getBooking(req.params.id);
  res.status(200).json(booking);
}

export async function getAllBookings(_req: Request, res: Response) {
  const bookings = await listBookings();
  res.status(200).json(bookings);
}
