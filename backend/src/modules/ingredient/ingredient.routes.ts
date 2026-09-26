import { Router } from "express";
import { asyncHandler } from "../../common/asyncHandler";
import {
  getIngredients,
  getRecipe,
  patchIngredient,
  patchRecipeLine,
  postIngredient,
  postItemRequirement,
  postPlanRequirement,
  postRecipeLine,
  putRecipe,
  removeIngredient,
  removeRecipeLine,
} from "./ingredient.controller";

/// Master list of raw materials the owner purchases
export const ingredientRouter = Router();

ingredientRouter.get("/", asyncHandler(getIngredients));
ingredientRouter.post("/", asyncHandler(postIngredient));
ingredientRouter.patch("/:id", asyncHandler(patchIngredient));
ingredientRouter.delete("/:id", asyncHandler(removeIngredient));

/// Per-item recipes and the scaled requirement calculator
export const recipeRouter = Router();

recipeRouter.post("/plan", asyncHandler(postPlanRequirement));

recipeRouter.get("/items/:itemId", asyncHandler(getRecipe));
recipeRouter.put("/items/:itemId", asyncHandler(putRecipe));
recipeRouter.post("/items/:itemId/lines", asyncHandler(postRecipeLine));
recipeRouter.post("/items/:itemId/requirement", asyncHandler(postItemRequirement));

recipeRouter.patch("/lines/:lineId", asyncHandler(patchRecipeLine));
recipeRouter.delete("/lines/:lineId", asyncHandler(removeRecipeLine));
