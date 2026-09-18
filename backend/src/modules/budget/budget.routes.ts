import { Router } from "express";
import { asyncHandler } from "../../common/asyncHandler";
import { postCalculateBudget } from "./budget.controller";

export const budgetRouter = Router();

budgetRouter.post("/calculate", asyncHandler(postCalculateBudget));
