import { PaymentMode, VendorEntryType } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError, NotFoundError } from "../../common/errors";
import { getVendor } from "./vendor.service";

export interface LedgerEntryInput {
  type: VendorEntryType;
  entryDate?: string;
  amount: number;
  description?: string | null;
  referenceNo?: string | null;
  paymentMode?: PaymentMode | null;
}

function validate(input: Partial<LedgerEntryInput>) {
  if (input.amount !== undefined && (!Number.isFinite(input.amount) || input.amount <= 0)) {
    throw new AppError("Amount must be greater than zero", 422);
  }
  if (input.entryDate !== undefined && Number.isNaN(new Date(input.entryDate).getTime())) {
    throw new AppError("entryDate is not a valid date", 422);
  }
}

/// Ledger with a running balance: purchases increase what is owed, payments and credit notes reduce it
export async function getLedger(vendorId: string) {
  const vendor = await getVendor(vendorId);
  const entries = await prisma.vendorLedgerEntry.findMany({
    where: { vendorId },
    orderBy: [{ entryDate: "asc" }, { createdAt: "asc" }],
  });

  let running = Number(vendor.openingBalance);
  const rows = entries.map((entry) => {
    const amount = Number(entry.amount);
    const debit = entry.type === "PURCHASE" ? amount : 0;
    const credit = entry.type === "PURCHASE" ? 0 : amount;
    running = Math.round((running + debit - credit) * 100) / 100;
    return {
      id: entry.id,
      type: entry.type,
      entryDate: entry.entryDate,
      amount,
      debit,
      credit,
      description: entry.description,
      referenceNo: entry.referenceNo,
      paymentMode: entry.paymentMode,
      balance: running,
    };
  });

  const totalPurchases = rows.reduce((sum, row) => sum + row.debit, 0);
  const totalPaid = rows
    .filter((row) => row.type === "PAYMENT")
    .reduce((sum, row) => sum + row.credit, 0);
  const totalCredits = rows
    .filter((row) => row.type === "CREDIT_NOTE")
    .reduce((sum, row) => sum + row.credit, 0);

  return {
    vendor,
    openingBalance: Number(vendor.openingBalance),
    entries: rows,
    totalPurchases: Math.round(totalPurchases * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    totalCredits: Math.round(totalCredits * 100) / 100,
    balance: running,
  };
}

export async function addLedgerEntry(vendorId: string, input: LedgerEntryInput) {
  await getVendor(vendorId);
  validate(input);
  if (!input.type) throw new AppError("Entry type is required", 422);

  await prisma.vendorLedgerEntry.create({
    data: {
      vendorId,
      type: input.type,
      entryDate: input.entryDate ? new Date(input.entryDate) : new Date(),
      amount: input.amount,
      description: input.description ?? null,
      referenceNo: input.referenceNo ?? null,
      paymentMode: input.paymentMode ?? null,
    },
  });

  return getLedger(vendorId);
}

export async function updateLedgerEntry(entryId: string, input: Partial<LedgerEntryInput>) {
  const entry = await prisma.vendorLedgerEntry.findUnique({ where: { id: entryId } });
  if (!entry) throw new NotFoundError("VendorLedgerEntry");
  validate(input);

  await prisma.vendorLedgerEntry.update({
    where: { id: entryId },
    data: {
      ...(input.type ? { type: input.type } : {}),
      ...(input.entryDate ? { entryDate: new Date(input.entryDate) } : {}),
      ...(input.amount !== undefined ? { amount: input.amount } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.referenceNo !== undefined ? { referenceNo: input.referenceNo } : {}),
      ...(input.paymentMode !== undefined ? { paymentMode: input.paymentMode } : {}),
    },
  });

  return getLedger(entry.vendorId);
}

export async function deleteLedgerEntry(entryId: string) {
  const entry = await prisma.vendorLedgerEntry.findUnique({ where: { id: entryId } });
  if (!entry) throw new NotFoundError("VendorLedgerEntry");
  await prisma.vendorLedgerEntry.delete({ where: { id: entryId } });
  return getLedger(entry.vendorId);
}
