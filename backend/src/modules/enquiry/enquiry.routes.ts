import { Router } from "express";
import { asyncHandler } from "../../common/asyncHandler";
import { getAllEnquiries, getEnquiryById, postContactEnquiry, postEnquiryMessage, postWizardEnquiry } from "./enquiry.controller";

export const enquiryRouter = Router();

enquiryRouter.post("/wizard", asyncHandler(postWizardEnquiry));
enquiryRouter.post("/contact", asyncHandler(postContactEnquiry));
enquiryRouter.post("/message", asyncHandler(postEnquiryMessage));
enquiryRouter.get("/:id", asyncHandler(getEnquiryById));
enquiryRouter.get("/", asyncHandler(getAllEnquiries));
