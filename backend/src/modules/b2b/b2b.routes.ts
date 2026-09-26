import { Router } from "express";
import { asyncHandler } from "../../common/asyncHandler";
import {
  getOrderById,
  getOrders,
  getSummary,
  patchStatus,
  postOrder,
  postPayment,
  putOrder,
  removeOrder,
  removePayment,
} from "./b2b.controller";

/// Sub-contracted (outgoing) and taken-on (incoming) catering orders between businesses
export const b2bRouter = Router();

b2bRouter.get("/summary", asyncHandler(getSummary));

b2bRouter.get("/", asyncHandler(getOrders));
b2bRouter.post("/", asyncHandler(postOrder));

b2bRouter.delete("/payments/:paymentId", asyncHandler(removePayment));

b2bRouter.get("/:id", asyncHandler(getOrderById));
b2bRouter.put("/:id", asyncHandler(putOrder));
b2bRouter.patch("/:id/status", asyncHandler(patchStatus));
b2bRouter.delete("/:id", asyncHandler(removeOrder));

b2bRouter.post("/:id/payments", asyncHandler(postPayment));
