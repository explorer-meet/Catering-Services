import { Router } from "express";
import { asyncHandler } from "../../common/asyncHandler";
import {
  getAllPricing,
  getCategories,
  getCategoryById,
  getItemsForCategory,
  getPricingForCategory,
  patchCategory,
  patchItem,
  postCategory,
  postItemForCategory,
  putPricingForCategory,
  removeCategory,
  removeItem,
} from "./category.controller";

/// Admin routes for managing menu categories, their items, and per-category pricing tiers
export const categoryRouter = Router();

categoryRouter.get("/pricing", asyncHandler(getAllPricing));

categoryRouter.get("/", asyncHandler(getCategories));
categoryRouter.post("/", asyncHandler(postCategory));
categoryRouter.get("/:id", asyncHandler(getCategoryById));
categoryRouter.patch("/:id", asyncHandler(patchCategory));
categoryRouter.delete("/:id", asyncHandler(removeCategory));

categoryRouter.get("/:id/items", asyncHandler(getItemsForCategory));
categoryRouter.post("/:id/items", asyncHandler(postItemForCategory));
categoryRouter.patch("/items/:itemId", asyncHandler(patchItem));
categoryRouter.delete("/items/:itemId", asyncHandler(removeItem));

categoryRouter.get("/:id/pricing", asyncHandler(getPricingForCategory));
categoryRouter.put("/:id/pricing", asyncHandler(putPricingForCategory));
