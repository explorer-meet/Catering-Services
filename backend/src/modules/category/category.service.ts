import { prisma } from "../../lib/prisma";
import { NotFoundError, AppError } from "../../common/errors";

export async function listCategories() {
  return prisma.menuCategory.findMany({
    orderBy: { displayOrder: "asc" },
    include: { pricingTiers: true, _count: { select: { items: true } } },
  });
}

export async function getCategory(id: string) {
  const category = await prisma.menuCategory.findUnique({
    where: { id },
    include: { pricingTiers: true, items: { orderBy: { name: "asc" } } },
  });
  if (!category) throw new NotFoundError("MenuCategory");
  return category;
}

export async function createCategory(params: {
  name: string;
  description?: string;
  displayOrder?: number;
}) {
  const existing = await prisma.menuCategory.findUnique({ where: { name: params.name } });
  if (existing) throw new AppError(`Category "${params.name}" already exists`, 409);

  return prisma.menuCategory.create({
    data: {
      name: params.name,
      description: params.description,
      displayOrder: params.displayOrder ?? 0,
    },
  });
}

export async function updateCategory(
  id: string,
  params: { name?: string; description?: string; displayOrder?: number },
) {
  await getCategory(id);
  return prisma.menuCategory.update({
    where: { id },
    data: {
      ...(params.name !== undefined ? { name: params.name } : {}),
      ...(params.description !== undefined ? { description: params.description } : {}),
      ...(params.displayOrder !== undefined ? { displayOrder: params.displayOrder } : {}),
    },
  });
}

export async function deleteCategory(id: string) {
  await getCategory(id);
  const itemCount = await prisma.menuItem.count({ where: { categoryId: id } });
  if (itemCount > 0) {
    throw new AppError("Cannot delete a category that still has menu items. Remove its items first.", 409);
  }
  await prisma.menuCategory.delete({ where: { id } });
}
