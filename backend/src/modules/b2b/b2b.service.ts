import { B2BDirection, B2BOrderStatus, PaymentMode, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError, NotFoundError } from "../../common/errors";

export interface B2BOrderItemInput {
  description: string;
  quantity: number;
  unit?: string;
  rate: number;
}

export interface B2BOrderInput {
  direction: B2BDirection;
  status?: B2BOrderStatus;
  partnerName: string;
  partnerPhone?: string | null;
  partnerGst?: string | null;
  vendorId?: string | null;
  eventName: string;
  eventDate: string;
  eventTime?: string | null;
  venue?: string | null;
  paxCount?: number;
  otherCharges?: number;
  taxPercent?: number;
  notes?: string | null;
  items: B2BOrderItemInput[];
}

const ORDER_INCLUDE = {
  items: true,
  payments: { orderBy: { paidOn: "asc" } },
  vendor: { select: { id: true, name: true, phone: true } },
} satisfies Prisma.B2BOrderInclude;

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function computeTotals(items: B2BOrderItemInput[], otherCharges: number, taxPercent: number) {
  const lines = items.map((item) => ({
    description: item.description.trim(),
    quantity: item.quantity,
    unit: item.unit?.trim() || "plates",
    rate: item.rate,
    amount: round(item.quantity * item.rate),
  }));

  const subtotal = round(lines.reduce((sum, line) => sum + line.amount, 0));
  const taxable = round(subtotal + otherCharges);
  const totalAmount = round(taxable + (taxable * taxPercent) / 100);

  return { lines, subtotal, totalAmount };
}

function validate(input: B2BOrderInput) {
  if (!input.partnerName?.trim()) throw new AppError("Partner name is required", 422);
  if (!input.eventName?.trim()) throw new AppError("Event name is required", 422);
  if (!input.eventDate || Number.isNaN(new Date(input.eventDate).getTime())) {
    throw new AppError("A valid event date is required", 422);
  }
  if (!input.items?.length) throw new AppError("Add at least one line item", 422);

  for (const item of input.items) {
    if (!item.description?.trim()) throw new AppError("Every line item needs a description", 422);
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
      throw new AppError("Line item quantity must be greater than zero", 422);
    }
    if (!Number.isFinite(item.rate) || item.rate < 0) {
      throw new AppError("Line item rate cannot be negative", 422);
    }
  }
}

async function nextOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.b2BOrder.count({ where: { orderNumber: { startsWith: `B2B-${year}-` } } });
  return `B2B-${year}-${String(count + 1).padStart(4, "0")}`;
}

function decorate(order: Prisma.B2BOrderGetPayload<{ include: typeof ORDER_INCLUDE }>) {
  const paidAmount = round(order.payments.reduce((sum, payment) => sum + Number(payment.amount), 0));
  const totalAmount = Number(order.totalAmount);

  return {
    ...order,
    subtotal: Number(order.subtotal),
    otherCharges: Number(order.otherCharges),
    taxPercent: Number(order.taxPercent),
    totalAmount,
    paidAmount,
    balanceAmount: round(totalAmount - paidAmount),
    items: order.items.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      rate: Number(item.rate),
      amount: Number(item.amount),
    })),
    payments: order.payments.map((payment) => ({ ...payment, amount: Number(payment.amount) })),
  };
}

export async function listOrders(params: { direction?: B2BDirection; status?: B2BOrderStatus; search?: string }) {
  const orders = await prisma.b2BOrder.findMany({
    where: {
      ...(params.direction ? { direction: params.direction } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.search
        ? {
            OR: [
              { partnerName: { contains: params.search } },
              { eventName: { contains: params.search } },
              { orderNumber: { contains: params.search } },
            ],
          }
        : {}),
    },
    orderBy: { eventDate: "desc" },
    include: ORDER_INCLUDE,
  });

  return orders.map(decorate);
}

export async function getOrder(id: string) {
  const order = await prisma.b2BOrder.findUnique({ where: { id }, include: ORDER_INCLUDE });
  if (!order) throw new NotFoundError("B2BOrder");
  return decorate(order);
}

/// An outgoing order owed to a partner in the vendor directory is mirrored as a
/// PURCHASE entry so it shows up in that vendor's account ledger.
async function syncBillLedgerEntry(orderId: string) {
  const order = await prisma.b2BOrder.findUnique({ where: { id: orderId } });
  if (!order) return;

  const shouldPost =
    order.direction === "OUTGOING" &&
    !!order.vendorId &&
    order.status !== "DRAFT" &&
    order.status !== "CANCELLED";

  if (!shouldPost) {
    if (order.ledgerEntryId) {
      await prisma.vendorLedgerEntry.deleteMany({ where: { id: order.ledgerEntryId } });
      await prisma.b2BOrder.update({ where: { id: orderId }, data: { ledgerEntryId: null } });
    }
    return;
  }

  const payload = {
    type: "PURCHASE" as const,
    entryDate: order.eventDate,
    amount: order.totalAmount,
    description: `B2B order · ${order.eventName}`,
    referenceNo: order.orderNumber,
  };

  if (order.ledgerEntryId) {
    const existing = await prisma.vendorLedgerEntry.findUnique({ where: { id: order.ledgerEntryId } });
    if (existing) {
      await prisma.vendorLedgerEntry.update({ where: { id: order.ledgerEntryId }, data: payload });
      return;
    }
  }

  const created = await prisma.vendorLedgerEntry.create({
    data: { vendorId: order.vendorId!, ...payload },
  });
  await prisma.b2BOrder.update({ where: { id: orderId }, data: { ledgerEntryId: created.id } });
}

export async function createOrder(input: B2BOrderInput) {
  validate(input);

  const otherCharges = input.otherCharges ?? 0;
  const taxPercent = input.taxPercent ?? 0;
  const { lines, subtotal, totalAmount } = computeTotals(input.items, otherCharges, taxPercent);

  const order = await prisma.b2BOrder.create({
    data: {
      orderNumber: await nextOrderNumber(),
      direction: input.direction,
      status: input.status ?? "DRAFT",
      partnerName: input.partnerName.trim(),
      partnerPhone: input.partnerPhone ?? null,
      partnerGst: input.partnerGst ?? null,
      vendorId: input.vendorId || null,
      eventName: input.eventName.trim(),
      eventDate: new Date(input.eventDate),
      eventTime: input.eventTime ?? null,
      venue: input.venue ?? null,
      paxCount: input.paxCount ?? 0,
      otherCharges,
      taxPercent,
      subtotal,
      totalAmount,
      notes: input.notes ?? null,
      items: { create: lines },
    },
  });

  await syncBillLedgerEntry(order.id);
  return getOrder(order.id);
}

export async function updateOrder(id: string, input: B2BOrderInput) {
  await getOrder(id);
  validate(input);

  const otherCharges = input.otherCharges ?? 0;
  const taxPercent = input.taxPercent ?? 0;
  const { lines, subtotal, totalAmount } = computeTotals(input.items, otherCharges, taxPercent);

  await prisma.$transaction([
    prisma.b2BOrderItem.deleteMany({ where: { orderId: id } }),
    prisma.b2BOrder.update({
      where: { id },
      data: {
        direction: input.direction,
        ...(input.status ? { status: input.status } : {}),
        partnerName: input.partnerName.trim(),
        partnerPhone: input.partnerPhone ?? null,
        partnerGst: input.partnerGst ?? null,
        vendorId: input.vendorId || null,
        eventName: input.eventName.trim(),
        eventDate: new Date(input.eventDate),
        eventTime: input.eventTime ?? null,
        venue: input.venue ?? null,
        paxCount: input.paxCount ?? 0,
        otherCharges,
        taxPercent,
        subtotal,
        totalAmount,
        notes: input.notes ?? null,
        items: { create: lines },
      },
    }),
  ]);

  await syncBillLedgerEntry(id);
  return getOrder(id);
}

export async function updateStatus(id: string, status: B2BOrderStatus) {
  await getOrder(id);
  await prisma.b2BOrder.update({ where: { id }, data: { status } });
  await syncBillLedgerEntry(id);
  return getOrder(id);
}

export async function deleteOrder(id: string) {
  const order = await prisma.b2BOrder.findUnique({ where: { id }, include: { payments: true } });
  if (!order) throw new NotFoundError("B2BOrder");

  const ledgerIds = [order.ledgerEntryId, ...order.payments.map((p) => p.ledgerEntryId)].filter(
    (value): value is string => !!value,
  );
  if (ledgerIds.length > 0) {
    await prisma.vendorLedgerEntry.deleteMany({ where: { id: { in: ledgerIds } } });
  }

  await prisma.b2BOrder.delete({ where: { id } });
}

export async function addPayment(
  orderId: string,
  input: { paidOn?: string; amount: number; mode?: PaymentMode | null; referenceNo?: string | null; notes?: string | null },
) {
  const order = await prisma.b2BOrder.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError("B2BOrder");
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new AppError("Payment amount must be greater than zero", 422);
  }

  const paidOn = input.paidOn ? new Date(input.paidOn) : new Date();
  if (Number.isNaN(paidOn.getTime())) throw new AppError("paidOn is not a valid date", 422);

  let ledgerEntryId: string | null = null;
  if (order.direction === "OUTGOING" && order.vendorId) {
    const entry = await prisma.vendorLedgerEntry.create({
      data: {
        vendorId: order.vendorId,
        type: "PAYMENT",
        entryDate: paidOn,
        amount: input.amount,
        description: `Payment for ${order.orderNumber}`,
        referenceNo: input.referenceNo ?? order.orderNumber,
        paymentMode: input.mode ?? null,
      },
    });
    ledgerEntryId = entry.id;
  }

  await prisma.b2BOrderPayment.create({
    data: {
      orderId,
      paidOn,
      amount: input.amount,
      mode: input.mode ?? null,
      referenceNo: input.referenceNo ?? null,
      notes: input.notes ?? null,
      ledgerEntryId,
    },
  });

  return getOrder(orderId);
}

export async function deletePayment(paymentId: string) {
  const payment = await prisma.b2BOrderPayment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new NotFoundError("B2BOrderPayment");

  if (payment.ledgerEntryId) {
    await prisma.vendorLedgerEntry.deleteMany({ where: { id: payment.ledgerEntryId } });
  }
  await prisma.b2BOrderPayment.delete({ where: { id: paymentId } });

  return getOrder(payment.orderId);
}

/// Headline numbers for the B2B dashboard strip
export async function getSummary() {
  const orders = await listOrders({});
  const live = orders.filter((order) => order.status !== "CANCELLED");

  const byDirection = (direction: B2BDirection) => {
    const rows = live.filter((order) => order.direction === direction);
    return {
      orderCount: rows.length,
      totalValue: round(rows.reduce((sum, order) => sum + order.totalAmount, 0)),
      outstanding: round(rows.reduce((sum, order) => sum + order.balanceAmount, 0)),
    };
  };

  return { outgoing: byDirection("OUTGOING"), incoming: byDirection("INCOMING") };
}
