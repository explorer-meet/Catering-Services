import { Router } from "express";
import { asyncHandler } from "../../common/asyncHandler";
import {
  getAllBookings,
  getBookingById,
  patchBookingStage,
  postConfirmBooking,
} from "./booking.controller";

export const bookingRouter = Router();

bookingRouter.post("/confirm", asyncHandler(postConfirmBooking));
bookingRouter.patch("/:id/stage", asyncHandler(patchBookingStage));
bookingRouter.get("/:id", asyncHandler(getBookingById));
bookingRouter.get("/", asyncHandler(getAllBookings));
