import { Request, Response } from "express";
import * as categoryService from "./category.service";
import * as itemService from "./item.service";
import * as pricingService from "./pricing.service";

export async function getCategories(_req: Request, res: Response) {
  res.status(200).json(await categoryService.listCategories());
}

export async function getCategoryById(req: Request, res: Response) {
  res.status(200).json(await categoryService.getCategory(req.params.id));
}

export async function postCategory(req: Request, res: Response) {
  res.status(201).json(await categoryService.createCategory(req.body));
}

export async function patchCategory(req: Request, res: Response) {
  res.status(200).json(await categoryService.updateCategory(req.params.id, req.body));
}

export async function removeCategory(req: Request, res: Response) {
  await categoryService.deleteCategory(req.params.id);
  res.status(204).send();
}

export async function getItemsForCategory(req: Request, res: Response) {
  res.status(200).json(await itemService.listItemsInCategory(req.params.id));
}

export async function postItemForCategory(req: Request, res: Response) {
  res.status(201).json(await itemService.addItemToCategory(req.params.id, req.body));
}

export async function patchItem(req: Request, res: Response) {
  res.status(200).json(await itemService.updateItem(req.params.itemId, req.body));
}

export async function removeItem(req: Request, res: Response) {
  await itemService.deleteItem(req.params.itemId);
  res.status(204).send();
}

export async function getPricingForCategory(req: Request, res: Response) {
  res.status(200).json(await pricingService.listPricingForCategory(req.params.id));
}

export async function putPricingForCategory(req: Request, res: Response) {
  res.status(200).json(await pricingService.upsertPricingTier(req.params.id, req.body));
}

export async function getAllPricing(_req: Request, res: Response) {
  res.status(200).json(await pricingService.listAllPricing());
}
