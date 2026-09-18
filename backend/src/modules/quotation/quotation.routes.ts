import { Router } from "express";
import { asyncHandler } from "../../common/asyncHandler";
import { getQuotationById, postCreateQuotation } from "./quotation.controller";

export const quotationRouter = Router();

quotationRouter.post("/", asyncHandler(postCreateQuotation));
quotationRouter.get("/:id", asyncHandler(getQuotationById));
