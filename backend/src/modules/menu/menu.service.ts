import { prisma } from "../../lib/prisma";
import { NotFoundError, AppError } from "../../common/errors";
import { CatalogItemSummary, recommendMenuPackages } from "./menu.ai";

export async function generateMenuPackagesForEnquiry(enquiryId: string) {
  const enquiry = await prisma.enquiry.findUnique({ where: { id: enquiryId } });
  if (!enquiry) throw new NotFoundError("Enquiry");
  if (!enquiry.guestCount || !enquiry.budgetPerPlate || !enquiry.foodType) {
    throw new AppError("Enquiry is missing guestCount, budgetPerPlate or foodType", 422);
  }

  const catalogItems = await prisma.menuItem.findMany({ include: { category: true } });
  const catalog: CatalogItemSummary[] = catalogItems.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category.name,
    cuisine: item.cuisine,
    foodType: item.foodType,
    costPerPlate: Number(item.costPerPlate),
    isJainSafe: item.isJainSafe,
  }));

  const recommendation = await recommendMenuPackages({
    eventType: enquiry.eventType,
    guestCount: enquiry.guestCount,
    foodType: enquiry.foodType,
    cuisinePreferences: enquiry.cuisinePreferences?.split(",") ?? [],
    budgetPerPlate: Number(enquiry.budgetPerPlate),
    catalog,
  });

  const catalogById = new Map(catalogItems.map((item) => [item.id, item]));

  const createdPackages = await Promise.all(
    recommendation.packages.map(async (pkg) => {
      const validItemIds = pkg.itemIds.filter((id) => catalogById.has(id));
      const pricePerPlate = validItemIds.reduce(
        (sum, id) => sum + Number(catalogById.get(id)!.costPerPlate),
        0,
      );

      return prisma.menuPackage.create({
        data: {
          enquiryId,
          name: pkg.name,
          description: pkg.description,
          pricePerPlate,
          items: {
            create: validItemIds.map((menuItemId) => ({ menuItemId })),
          },
        },
        include: { items: { include: { menuItem: { include: { category: true } } } } },
      });
    }),
  );

  await prisma.enquiry.update({ where: { id: enquiryId }, data: { stage: "QUOTATION" } });

  return createdPackages;
}

export async function getMenuPackage(id: string) {
  const pkg = await prisma.menuPackage.findUnique({
    where: { id },
    include: { items: { include: { menuItem: { include: { category: true } } } } },
  });
  if (!pkg) throw new NotFoundError("MenuPackage");
  return pkg;
}

export async function listMenuPackagesForEnquiry(enquiryId: string) {
  return prisma.menuPackage.findMany({
    where: { enquiryId },
    include: { items: { include: { menuItem: { include: { category: true } } } } },
  });
}

export async function selectMenuPackage(id: string) {
  const pkg = await getMenuPackage(id);
  await prisma.menuPackage.updateMany({
    where: { enquiryId: pkg.enquiryId },
    data: { isSelected: false },
  });
  return prisma.menuPackage.update({
    where: { id },
    data: { isSelected: true },
    include: { items: { include: { menuItem: { include: { category: true } } } } },
  });
}
