import { Prisma, VendorCategory } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError, NotFoundError } from "../../common/errors";

export interface VendorInput {
  name: string;
  category?: VendorCategory;
  contactPerson?: string | null;
  phone: string;
  email?: string | null;
  address?: string | null;
  gstNumber?: string | null;
  paymentTerms?: string | null;
  notes?: string | null;
  isActive?: boolean;
  bankName?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  ifscCode?: string | null;
  upiId?: string | null;
  openingBalance?: number;
}

const EDITABLE_FIELDS: (keyof VendorInput)[] = [
  "name",
  "category",
  "contactPerson",
  "phone",
  "email",
  "address",
  "gstNumber",
  "paymentTerms",
  "notes",
  "isActive",
  "bankName",
  "accountName",
  "accountNumber",
  "ifscCode",
  "upiId",
  "openingBalance",
];

/// Account numbers are only revealed on the single-vendor endpoint
function maskAccountNumber(accountNumber: string | null) {
  if (!accountNumber) return null;
  const visible = accountNumber.slice(-4);
  return `${"•".repeat(Math.max(accountNumber.length - 4, 0))}${visible}`;
}

function pickEditable(input: Partial<VendorInput>) {
  const data: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    if (input[field] !== undefined) data[field] = input[field];
  }
  return data;
}

/// Positive balance means money is still owed to the vendor
function computeBalance(openingBalance: Prisma.Decimal | number, entries: { type: string; amount: unknown }[]) {
  return entries.reduce((balance, entry) => {
    const amount = Number(entry.amount);
    if (entry.type === "PURCHASE") return balance + amount;
    if (entry.type === "PAYMENT" || entry.type === "CREDIT_NOTE") return balance - amount;
    return balance;
  }, Number(openingBalance));
}

export async function listVendors(params: { search?: string; category?: VendorCategory }) {
  const vendors = await prisma.vendor.findMany({
    where: {
      ...(params.category ? { category: params.category } : {}),
      ...(params.search
        ? { OR: [{ name: { contains: params.search } }, { phone: { contains: params.search } }] }
        : {}),
    },
    orderBy: { name: "asc" },
    include: { entries: { select: { type: true, amount: true } } },
  });

  return vendors.map(({ entries, ...vendor }) => ({
    ...vendor,
    accountNumber: maskAccountNumber(vendor.accountNumber),
    entryCount: entries.length,
    balance: computeBalance(vendor.openingBalance, entries),
  }));
}

export async function getVendor(id: string) {
  const vendor = await prisma.vendor.findUnique({ where: { id } });
  if (!vendor) throw new NotFoundError("Vendor");
  return vendor;
}

export async function createVendor(input: VendorInput) {
  const name = input.name?.trim();
  const phone = input.phone?.trim();
  if (!name) throw new AppError("Vendor name is required", 422);
  if (!phone) throw new AppError("Vendor phone is required", 422);

  const existing = await prisma.vendor.findUnique({ where: { name_phone: { name, phone } } });
  if (existing) throw new AppError(`Vendor "${name}" with this phone already exists`, 409);

  return prisma.vendor.create({
    data: { ...pickEditable(input), name, phone } as Prisma.VendorCreateInput,
  });
}

export async function updateVendor(id: string, input: Partial<VendorInput>) {
  await getVendor(id);
  return prisma.vendor.update({ where: { id }, data: pickEditable(input) });
}

export async function deleteVendor(id: string) {
  await getVendor(id);
  await prisma.vendor.delete({ where: { id } });
}

/// Totals across every vendor, for the owner's dashboard strip
export async function getVendorSummary() {
  const vendors = await listVendors({});
  const payable = vendors.filter((v) => v.balance > 0).reduce((sum, v) => sum + v.balance, 0);
  const advance = vendors.filter((v) => v.balance < 0).reduce((sum, v) => sum - v.balance, 0);

  return {
    vendorCount: vendors.length,
    activeCount: vendors.filter((v) => v.isActive).length,
    totalPayable: Math.round(payable * 100) / 100,
    totalAdvance: Math.round(advance * 100) / 100,
  };
}
