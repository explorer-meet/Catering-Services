import { GuestTier } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../common/errors";
import { getCategory } from "./category.service";

export async function upsertPricingTier(
  categoryId: string,
  params: { guestTier: GuestTier; minPricePerPerson: number; maxPricePerPerson: number },
) {
  await getCategory(categoryId);
  if (params.minPricePerPerson > params.maxPricePerPerson) {
    throw new AppError("minPricePerPerson cannot be greater than maxPricePerPerson", 422);
  }

  return prisma.categoryPricingTier.upsert({
    where: { categoryId_guestTier: { categoryId, guestTier: params.guestTier } },
    update: {
      minPricePerPerson: params.minPricePerPerson,
      maxPricePerPerson: params.maxPricePerPerson,
    },
    create: {
      categoryId,
      guestTier: params.guestTier,
      minPricePerPerson: params.minPricePerPerson,
      maxPricePerPerson: params.maxPricePerPerson,
    },
  });
}

export async function listPricingForCategory(categoryId: string) {
  await getCategory(categoryId);
  return prisma.categoryPricingTier.findMany({ where: { categoryId } });
}

export async function listAllPricing() {
  return prisma.menuCategory.findMany({
    orderBy: { displayOrder: "asc" },
    select: { id: true, name: true, pricingTiers: true },
  });
}

/// Guest counts <= 75 use the "50 pax" price band, otherwise the "100 pax" band
function resolveGuestTier(guestCount: number): GuestTier {
  return guestCount <= 75 ? "FIFTY" : "HUNDRED";
}

export interface TentativeEstimateResult {
  guestCount: number;
  guestTier: GuestTier;
  perCategory: { category: string; minPricePerPerson: number; maxPricePerPerson: number }[];
  totalMinPricePerPerson: number;
  totalMaxPricePerPerson: number;
}

/// Sums the pricing bands of the given categories to give a quick tentative per-person price
/// range before the full AI menu/quotation is generated.
export async function estimateTentativePrice(params: {
  guestCount: number;
  categoryNames: string[];
}): Promise<TentativeEstimateResult> {
  const guestTier = resolveGuestTier(params.guestCount);

  const categories = await prisma.menuCategory.findMany({
    where: { name: { in: params.categoryNames } },
    include: { pricingTiers: { where: { guestTier } } },
  });

  const perCategory = categories
    .filter((c) => c.pricingTiers.length > 0)
    .map((c) => ({
      category: c.name,
      minPricePerPerson: Number(c.pricingTiers[0].minPricePerPerson),
      maxPricePerPerson: Number(c.pricingTiers[0].maxPricePerPerson),
    }));

  return {
    guestCount: params.guestCount,
    guestTier,
    perCategory,
    totalMinPricePerPerson: perCategory.reduce((sum, c) => sum + c.minPricePerPerson, 0),
    totalMaxPricePerPerson: perCategory.reduce((sum, c) => sum + c.maxPricePerPerson, 0),
  };
}
