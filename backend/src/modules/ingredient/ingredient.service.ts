import { IngredientUnit } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError, NotFoundError } from "../../common/errors";

export interface IngredientInput {
  name: string;
  unit?: IngredientUnit;
  costPerUnit?: number | null;
  notes?: string | null;
}

export async function listIngredients(search?: string) {
  return prisma.ingredient.findMany({
    where: search ? { name: { contains: search } } : undefined,
    orderBy: { name: "asc" },
  });
}

export async function getIngredient(id: string) {
  const ingredient = await prisma.ingredient.findUnique({ where: { id } });
  if (!ingredient) throw new NotFoundError("Ingredient");
  return ingredient;
}

export async function createIngredient(input: IngredientInput) {
  const name = input.name?.trim();
  if (!name) throw new AppError("Ingredient name is required", 422);

  const existing = await prisma.ingredient.findUnique({ where: { name } });
  if (existing) throw new AppError(`Ingredient "${name}" already exists`, 409);

  return prisma.ingredient.create({
    data: {
      name,
      unit: input.unit ?? "KG",
      costPerUnit: input.costPerUnit ?? null,
      notes: input.notes ?? null,
    },
  });
}

export async function updateIngredient(id: string, input: Partial<IngredientInput>) {
  await getIngredient(id);
  const name = input.name?.trim();

  if (name) {
    const clash = await prisma.ingredient.findUnique({ where: { name } });
    if (clash && clash.id !== id) throw new AppError(`Ingredient "${name}" already exists`, 409);
  }

  return prisma.ingredient.update({
    where: { id },
    data: {
      ...(name ? { name } : {}),
      ...(input.unit ? { unit: input.unit } : {}),
      ...(input.costPerUnit !== undefined ? { costPerUnit: input.costPerUnit } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
  });
}

export async function deleteIngredient(id: string) {
  await getIngredient(id);
  const usage = await prisma.menuItemIngredient.count({ where: { ingredientId: id } });
  if (usage > 0) {
    throw new AppError("Cannot delete an ingredient that is still used in item recipes.", 409);
  }
  await prisma.ingredient.delete({ where: { id } });
}

/// Finds an ingredient by name (case-insensitive on MySQL's default collation) or creates it,
/// so the owner can type a new ingredient straight from the recipe screen.
export async function findOrCreateIngredient(name: string, unit: IngredientUnit) {
  const trimmed = name.trim();
  if (!trimmed) throw new AppError("Ingredient name is required", 422);

  const existing = await prisma.ingredient.findUnique({ where: { name: trimmed } });
  if (existing) return existing;

  return prisma.ingredient.create({ data: { name: trimmed, unit } });
}
