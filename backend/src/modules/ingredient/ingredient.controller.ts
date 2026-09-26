import { Request, Response } from "express";
import * as ingredientService from "./ingredient.service";
import * as recipeService from "./recipe.service";

export async function getIngredients(req: Request, res: Response) {
  res.status(200).json(await ingredientService.listIngredients(req.query.search as string | undefined));
}

export async function postIngredient(req: Request, res: Response) {
  res.status(201).json(await ingredientService.createIngredient(req.body));
}

export async function patchIngredient(req: Request, res: Response) {
  res.status(200).json(await ingredientService.updateIngredient(req.params.id, req.body));
}

export async function removeIngredient(req: Request, res: Response) {
  await ingredientService.deleteIngredient(req.params.id);
  res.status(204).send();
}

export async function getRecipe(req: Request, res: Response) {
  res.status(200).json(await recipeService.getRecipe(req.params.itemId));
}

export async function postRecipeLine(req: Request, res: Response) {
  res.status(201).json(await recipeService.addRecipeLine(req.params.itemId, req.body));
}

export async function putRecipe(req: Request, res: Response) {
  res.status(200).json(await recipeService.replaceRecipe(req.params.itemId, req.body));
}

export async function patchRecipeLine(req: Request, res: Response) {
  res.status(200).json(await recipeService.updateRecipeLine(req.params.lineId, req.body));
}

export async function removeRecipeLine(req: Request, res: Response) {
  res.status(200).json(await recipeService.deleteRecipeLine(req.params.lineId));
}

export async function postItemRequirement(req: Request, res: Response) {
  res
    .status(200)
    .json(await recipeService.calculateItemRequirement(req.params.itemId, Number(req.body.personCount)));
}

export async function postPlanRequirement(req: Request, res: Response) {
  res.status(200).json(await recipeService.calculatePlan(req.body));
}
