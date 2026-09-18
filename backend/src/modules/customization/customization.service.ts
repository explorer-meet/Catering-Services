import { prisma } from "../../lib/prisma";
import { NotFoundError } from "../../common/errors";
import { computeMenuCustomization } from "./customization.ai";
import { CatalogItemSummary } from "../menu/menu.ai";

export async function customizeMenuPackage(menuPackageId: string, instruction: string) {
  const pkg = await prisma.menuPackage.findUnique({
    where: { id: menuPackageId },
    include: { items: { include: { menuItem: { include: { category: true } } } } },
  });
  if (!pkg) throw new NotFoundError("MenuPackage");

  const catalogItems = await prisma.menuItem.findMany({ include: { category: true } });
  const toSummary = (item: (typeof catalogItems)[number]): CatalogItemSummary => ({
    id: item.id,
    name: item.name,
    category: item.category.name,
    cuisine: item.cuisine,
    foodType: item.foodType,
    costPerPlate: Number(item.costPerPlate),
    isJainSafe: item.isJainSafe,
  });

  const result = await computeMenuCustomization({
    instruction,
    currentItems: pkg.items.map((i) => toSummary(i.menuItem)),
    catalog: catalogItems.map(toSummary),
  });

  const catalogById = new Map(catalogItems.map((item) => [item.id, item]));
  const currentIds = new Set(pkg.items.map((i) => i.menuItemId));

  const removeIds = result.removeItemIds.filter((id) => currentIds.has(id));
  const addIds = result.addItemIds.filter((id) => catalogById.has(id) && !currentIds.has(id));

  await prisma.$transaction([
    prisma.menuPackageItem.deleteMany({
      where: { menuPackageId, menuItemId: { in: removeIds } },
    }),
    prisma.menuPackageItem.createMany({
      data: addIds.map((menuItemId) => ({ menuPackageId, menuItemId })),
    }),
  ]);

  const updatedItems = await prisma.menuPackageItem.findMany({
    where: { menuPackageId },
    include: { menuItem: true },
  });
  const newPricePerPlate = updatedItems.reduce(
    (sum, i) => sum + Number(i.menuItem.costPerPlate),
    0,
  );

  const updatedPackage = await prisma.menuPackage.update({
    where: { id: menuPackageId },
    data: { pricePerPlate: newPricePerPlate },
    include: { items: { include: { menuItem: { include: { category: true } } } } },
  });

  // Keep any already-generated quotation for this package in sync with the new price
  const affectedQuotations = await prisma.quotation.findMany({ where: { menuPackageId } });
  for (const quotation of affectedQuotations) {
    const foodCost = newPricePerPlate * quotation.guestCount;
    const subtotal =
      foodCost +
      Number(quotation.staffCost) +
      Number(quotation.equipmentCost) +
      Number(quotation.transportationCost) +
      Number(quotation.decorationCost) +
      Number(quotation.otherServicesCost);
    const taxAmount = (subtotal * Number(quotation.taxPercent)) / 100;
    const totalAmount = subtotal + taxAmount;

    await prisma.quotation.update({
      where: { id: quotation.id },
      data: {
        pricePerPlate: newPricePerPlate,
        foodCost,
        subtotal,
        taxAmount,
        totalAmount,
      },
    });
  }

  return { package: updatedPackage, summary: result.summary, appliedFilters: result.appliedFilters };
}
