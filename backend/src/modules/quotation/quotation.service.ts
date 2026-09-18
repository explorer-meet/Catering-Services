import { v4 as uuid } from "uuid";
import { prisma } from "../../lib/prisma";
import { NotFoundError } from "../../common/errors";
import { calculateBudget } from "../budget/budget.service";
import { renderQuotationPdf } from "./quotation.pdf";

const DEFAULT_TERMS =
  "1. Menu items are subject to seasonal availability.\n" +
  "2. Guest count changes must be confirmed 3 days before the event.\n" +
  "3. Prices are valid only until the quotation validity date.";

const DEFAULT_CANCELLATION_POLICY =
  "Cancellations made 15+ days before the event: 90% of advance refunded. " +
  "7-14 days before: 50% refunded. Less than 7 days: no refund.";

export async function createQuotation(params: {
  enquiryId: string;
  menuPackageId: string;
  taxPercent?: number;
  advancePercent?: number;
  transportationFlatCost?: number;
  validForDays?: number;
}) {
  const enquiry = await prisma.enquiry.findUnique({ where: { id: params.enquiryId } });
  if (!enquiry) throw new NotFoundError("Enquiry");
  if (!enquiry.guestCount) throw new NotFoundError("Guest count on enquiry");

  const menuPackage = await prisma.menuPackage.findUnique({ where: { id: params.menuPackageId } });
  if (!menuPackage) throw new NotFoundError("MenuPackage");

  const breakdown = calculateBudget({
    guestCount: enquiry.guestCount,
    pricePerPlate: Number(menuPackage.pricePerPlate),
    taxPercent: params.taxPercent,
    advancePercent: params.advancePercent,
    transportationFlatCost: params.transportationFlatCost,
  });

  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + (params.validForDays ?? 7));

  const quotationNumber = `QTN-${new Date().getFullYear()}-${uuid().slice(0, 8).toUpperCase()}`;

  const quotation = await prisma.quotation.create({
    data: {
      enquiryId: enquiry.id,
      menuPackageId: menuPackage.id,
      quotationNumber,
      guestCount: enquiry.guestCount,
      pricePerPlate: menuPackage.pricePerPlate,
      foodCost: breakdown.foodCost,
      staffCost: breakdown.staffCost,
      equipmentCost: breakdown.equipmentCost,
      transportationCost: breakdown.transportationCost,
      decorationCost: breakdown.decorationCost,
      otherServicesCost: breakdown.otherServicesCost,
      subtotal: breakdown.subtotal,
      taxPercent: breakdown.taxPercent,
      taxAmount: breakdown.taxAmount,
      totalAmount: breakdown.totalAmount,
      advanceAmount: breakdown.advanceAmount,
      termsAndConditions: DEFAULT_TERMS,
      cancellationPolicy: DEFAULT_CANCELLATION_POLICY,
      validUntil,
    },
  });

  await prisma.enquiry.update({ where: { id: enquiry.id }, data: { stage: "NEGOTIATION" } });

  return generateQuotationPdf(quotation.id);
}

export async function generateQuotationPdf(quotationId: string) {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      enquiry: { include: { customer: true } },
      menuPackage: { include: { items: { include: { menuItem: { include: { category: true } } } } } },
    },
  });
  if (!quotation) throw new NotFoundError("Quotation");

  const pdfUrl = await renderQuotationPdf(quotation);
  return prisma.quotation.update({ where: { id: quotation.id }, data: { pdfUrl } });
}

export async function getQuotation(id: string) {
  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      enquiry: { include: { customer: true } },
      menuPackage: { include: { items: { include: { menuItem: { include: { category: true } } } } } },
    },
  });
  if (!quotation) throw new NotFoundError("Quotation");
  return quotation;
}
