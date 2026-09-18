import { Router } from "express";
import { asyncHandler } from "../../common/asyncHandler";
import { postCustomizeMenuPackage } from "./customization.controller";

export const customizationRouter = Router();

customizationRouter.post("/packages/:menuPackageId", asyncHandler(postCustomizeMenuPackage));
