import { FoodType } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { NotFoundError } from "../../common/errors";
import { getCategory } from "./category.service";

export interface CreateItemInput {
  name: string;
  cuisine?: string;
  foodType?: FoodType;
  costPerPlate: number;
  isJainSafe?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  containsOnionGarlic?: boolean;
  allergens?: string;
}

/// Admin adds a new menu item under an existing category
export async function addItemToCategory(categoryId: string, input: CreateItemInput) {
  await getCategory(categoryId);
  return prisma.menuItem.create({
    data: { ...input, categoryId },
  });
}

export async function listItemsInCategory(categoryId: string) {
  await getCategory(categoryId);
  return prisma.menuItem.findMany({ where: { categoryId }, orderBy: { name: "asc" } });
}

export async function updateItem(itemId: string, input: Partial<CreateItemInput>) {
  const item = await prisma.menuItem.findUnique({ where: { id: itemId } });
  if (!item) throw new NotFoundError("MenuItem");
  return prisma.menuItem.update({ where: { id: itemId }, data: input });
}

export async function deleteItem(itemId: string) {
  const item = await prisma.menuItem.findUnique({ where: { id: itemId } });
  if (!item) throw new NotFoundError("MenuItem");
  await prisma.menuItem.delete({ where: { id: itemId } });
}
