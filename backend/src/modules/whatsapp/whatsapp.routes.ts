import { Router } from "express";
import { asyncHandler } from "../../common/asyncHandler";
import { postWhatsAppWebhook } from "./whatsapp.controller";

export const whatsappRouter = Router();

whatsappRouter.post("/webhook", asyncHandler(postWhatsAppWebhook));
