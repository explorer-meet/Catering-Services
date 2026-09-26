import { IngredientUnit } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError, NotFoundError } from "../../common/errors";
import { findOrCreateIngredient } from "./ingredient.service";

export interface RecipeLineInput {
  ingredientId?: string;
  ingredientName?: string;
  quantity: number;
  unit: IngredientUnit;
  notes?: string | null;
}

// ---------- Unit helpers ----------

const WEIGHT_FACTORS: Partial<Record<IngredientUnit, number>> = { GRAM: 1, KG: 1000 };
const VOLUME_FACTORS: Partial<Record<IngredientUnit, number>> = { ML: 1, LITRE: 1000 };

/// Converts a quantity to a comparable base amount so the same ingredient expressed in
/// grams and kilograms can be summed across different menu items.
function toBase(quantity: number, unit: IngredientUnit): { amount: number; family: string } {
  if (WEIGHT_FACTORS[unit]) return { amount: quantity * WEIGHT_FACTORS[unit]!, family: "WEIGHT" };
  if (VOLUME_FACTORS[unit]) return { amount: quantity * VOLUME_FACTORS[unit]!, family: "VOLUME" };
  return { amount: quantity, family: unit };
}

function fromBase(amount: number, family: string): { quantity: number; unit: IngredientUnit } {
  if (family === "WEIGHT") {
    return amount >= 1000
      ? { quantity: round(amount / 1000), unit: "KG" }
      : { quantity: round(amount), unit: "GRAM" };
  }
  if (family === "VOLUME") {
    return amount >= 1000
      ? { quantity: round(amount / 1000), unit: "LITRE" }
      : { quantity: round(amount), unit: "ML" };
  }
  return { quantity: round(amount), unit: family as IngredientUnit };
}

function round(value: number) {
  return Math.round(value * 1000) / 1000;
}

// ---------- Recipe CRUD ----------

async function requireItem(itemId: string) {
  const item = await prisma.menuItem.findUnique({
    where: { id: itemId },
    include: { category: true },
  });
  if (!item) throw new NotFoundError("MenuItem");
  return item;
}

export async function getRecipe(itemId: string) {
  const item = await requireItem(itemId);
  const lines = await prisma.menuItemIngredient.findMany({
    where: { menuItemId: itemId },
    include: { ingredient: true },
    orderBy: { createdAt: "asc" },
  });

  return {
    itemId: item.id,
    itemName: item.name,
    categoryId: item.categoryId,
    categoryName: item.category.name,
    recipeBaseServings: item.recipeBaseServings,
    lines: lines.map((line) => ({
      id: line.id,
      ingredientId: line.ingredientId,
      ingredientName: line.ingredient.name,
      quantity: Number(line.quantity),
      unit: line.unit,
      notes: line.notes,
    })),
  };
}

async function resolveIngredientId(line: RecipeLineInput) {
  if (line.ingredientId) return line.ingredientId;
  if (!line.ingredientName) throw new AppError("Each line needs an ingredientId or ingredientName", 422);
  const ingredient = await findOrCreateIngredient(line.ingredientName, line.unit);
  return ingredient.id;
}

function validateLine(line: RecipeLineInput) {
  if (!Number.isFinite(line.quantity) || line.quantity <= 0) {
    throw new AppError("Ingredient quantity must be greater than zero", 422);
  }
  if (!line.unit) throw new AppError("Ingredient unit is required", 422);
}

export async function addRecipeLine(itemId: string, line: RecipeLineInput) {
  await requireItem(itemId);
  validateLine(line);
  const ingredientId = await resolveIngredientId(line);

  const existing = await prisma.menuItemIngredient.findUnique({
    where: { menuItemId_ingredientId: { menuItemId: itemId, ingredientId } },
  });
  if (existing) throw new AppError("This ingredient is already part of the recipe. Edit it instead.", 409);

  await prisma.menuItemIngredient.create({
    data: {
      menuItemId: itemId,
      ingredientId,
      quantity: line.quantity,
      unit: line.unit,
      notes: line.notes ?? null,
    },
  });

  return getRecipe(itemId);
}

export async function updateRecipeLine(
  lineId: string,
  input: { quantity?: number; unit?: IngredientUnit; notes?: string | null },
) {
  const line = await prisma.menuItemIngredient.findUnique({ where: { id: lineId } });
  if (!line) throw new NotFoundError("MenuItemIngredient");

  if (input.quantity !== undefined && (!Number.isFinite(input.quantity) || input.quantity <= 0)) {
    throw new AppError("Ingredient quantity must be greater than zero", 422);
  }

  await prisma.menuItemIngredient.update({
    where: { id: lineId },
    data: {
      ...(input.quantity !== undefined ? { quantity: input.quantity } : {}),
      ...(input.unit ? { unit: input.unit } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
  });

  return getRecipe(line.menuItemId);
}

export async function deleteRecipeLine(lineId: string) {
  const line = await prisma.menuItemIngredient.findUnique({ where: { id: lineId } });
  if (!line) throw new NotFoundError("MenuItemIngredient");
  await prisma.menuItemIngredient.delete({ where: { id: lineId } });
  return getRecipe(line.menuItemId);
}

/// Replaces the full recipe of an item in one shot (used by the owner's "Save recipe" button)
export async function replaceRecipe(
  itemId: string,
  payload: { recipeBaseServings: number; lines: RecipeLineInput[] },
) {
  await requireItem(itemId);

  if (!Number.isFinite(payload.recipeBaseServings) || payload.recipeBaseServings <= 0) {
    throw new AppError("recipeBaseServings must be greater than zero", 422);
  }

  const lines = payload.lines ?? [];
  lines.forEach(validateLine);

  const resolved: { ingredientId: string; quantity: number; unit: IngredientUnit; notes: string | null }[] = [];
  for (const line of lines) {
    const ingredientId = await resolveIngredientId(line);
    if (resolved.some((r) => r.ingredientId === ingredientId)) {
      throw new AppError("The same ingredient is listed twice in this recipe", 422);
    }
    resolved.push({ ingredientId, quantity: line.quantity, unit: line.unit, notes: line.notes ?? null });
  }

  await prisma.$transaction([
    prisma.menuItem.update({
      where: { id: itemId },
      data: { recipeBaseServings: payload.recipeBaseServings },
    }),
    prisma.menuItemIngredient.deleteMany({ where: { menuItemId: itemId } }),
    prisma.menuItemIngredient.createMany({
      data: resolved.map((r) => ({ menuItemId: itemId, ...r })),
    }),
  ]);

  return getRecipe(itemId);
}

// ---------- Requirement calculation ----------

export interface RequirementLine {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: IngredientUnit;
  estimatedCost: number | null;
  notes: string | null;
}

export async function calculateItemRequirement(itemId: string, personCount: number) {
  if (!Number.isFinite(personCount) || personCount <= 0) {
    throw new AppError("personCount must be greater than zero", 422);
  }

  const recipe = await getRecipe(itemId);
  const factor = personCount / recipe.recipeBaseServings;

  const lines: RequirementLine[] = [];
  for (const line of recipe.lines) {
    const ingredient = await prisma.ingredient.findUnique({ where: { id: line.ingredientId } });
    const base = toBase(line.quantity * factor, line.unit);
    const scaled = fromBase(base.amount, base.family);
    lines.push({
      ingredientId: line.ingredientId,
      ingredientName: line.ingredientName,
      quantity: scaled.quantity,
      unit: scaled.unit,
      estimatedCost: estimateCost(scaled.quantity, scaled.unit, ingredient?.unit, ingredient?.costPerUnit),
      notes: line.notes,
    });
  }

  return {
    itemId: recipe.itemId,
    itemName: recipe.itemName,
    categoryName: recipe.categoryName,
    personCount,
    recipeBaseServings: recipe.recipeBaseServings,
    lines,
    estimatedTotalCost: sumCost(lines),
  };
}

/// Aggregates the shopping list across several items, e.g. a 500-person contract with
/// Margherita Pizza + Paneer Tikka + Gulab Jamun.
export async function calculatePlan(payload: {
  personCount?: number;
  items: { itemId: string; personCount?: number }[];
}) {
  const items = payload.items ?? [];
  if (items.length === 0) throw new AppError("At least one item is required", 422);

  const perItem = [];
  const totals = new Map<string, { name: string; family: string; amount: number }>();

  for (const entry of items) {
    const personCount = entry.personCount ?? payload.personCount;
    if (!personCount) throw new AppError("personCount is required for every item", 422);

    const requirement = await calculateItemRequirement(entry.itemId, personCount);
    perItem.push(requirement);

    for (const line of requirement.lines) {
      const base = toBase(line.quantity, line.unit);
      const key = `${line.ingredientId}|${base.family}`;
      const bucket = totals.get(key);
      if (bucket) bucket.amount += base.amount;
      else totals.set(key, { name: line.ingredientName, family: base.family, amount: base.amount });
    }
  }

  const ingredientIds = [...new Set(perItem.flatMap((i) => i.lines.map((l) => l.ingredientId)))];
  const ingredients = await prisma.ingredient.findMany({ where: { id: { in: ingredientIds } } });
  const ingredientById = new Map(ingredients.map((i) => [i.id, i]));

  const shoppingList: RequirementLine[] = [...totals.entries()]
    .map(([key, bucket]) => {
      const ingredientId = key.split("|")[0];
      const ingredient = ingredientById.get(ingredientId);
      const scaled = fromBase(bucket.amount, bucket.family);
      return {
        ingredientId,
        ingredientName: bucket.name,
        quantity: scaled.quantity,
        unit: scaled.unit,
        estimatedCost: estimateCost(scaled.quantity, scaled.unit, ingredient?.unit, ingredient?.costPerUnit),
        notes: null,
      };
    })
    .sort((a, b) => a.ingredientName.localeCompare(b.ingredientName));

  return {
    perItem,
    shoppingList,
    estimatedTotalCost: sumCost(shoppingList),
  };
}

function estimateCost(
  quantity: number,
  unit: IngredientUnit,
  purchaseUnit: IngredientUnit | undefined,
  costPerUnit: unknown,
): number | null {
  if (!purchaseUnit || costPerUnit === null || costPerUnit === undefined) return null;

  const required = toBase(quantity, unit);
  const purchase = toBase(1, purchaseUnit);
  if (required.family !== purchase.family) return null;

  return round((required.amount / purchase.amount) * Number(costPerUnit));
}

function sumCost(lines: RequirementLine[]): number | null {
  const known = lines.filter((l) => l.estimatedCost !== null);
  if (known.length === 0) return null;
  return round(known.reduce((sum, l) => sum + (l.estimatedCost ?? 0), 0));
}
