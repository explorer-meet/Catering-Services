import { Router } from "express";
import { asyncHandler } from "../../common/asyncHandler";
import {
  getPackageById,
  getPackagesForEnquiry,
  postEstimatePrice,
  postGeneratePackages,
  postSelectPackage,
} from "./menu.controller";

export const menuRouter = Router();

menuRouter.post("/estimate", asyncHandler(postEstimatePrice));
menuRouter.post("/enquiries/:enquiryId/generate", asyncHandler(postGeneratePackages));
menuRouter.get("/enquiries/:enquiryId", asyncHandler(getPackagesForEnquiry));
menuRouter.get("/packages/:id", asyncHandler(getPackageById));
menuRouter.post("/packages/:id/select", asyncHandler(postSelectPackage));
