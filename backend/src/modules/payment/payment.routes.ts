import { Router } from "express";
import { asyncHandler } from "../../common/asyncHandler";
import {
  getOutstanding,
  getPayments,
  postConfirmPayment,
  postInitiatePayment,
} from "./payment.controller";

export const paymentRouter = Router();

paymentRouter.post("/initiate", asyncHandler(postInitiatePayment));
paymentRouter.post("/confirm", asyncHandler(postConfirmPayment));
paymentRouter.get("/bookings/:bookingId/outstanding", asyncHandler(getOutstanding));
paymentRouter.get("/bookings/:bookingId", asyncHandler(getPayments));
