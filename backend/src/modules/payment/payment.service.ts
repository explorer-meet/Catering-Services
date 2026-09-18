import { PaymentType } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { NotFoundError, AppError } from "../../common/errors";
import { sendWhatsAppMessage } from "../../common/whatsappClient";
import { createRazorpayOrder, verifyRazorpaySignature } from "./payment.razorpay";

export async function initiatePayment(params: {
  bookingId: string;
  type: PaymentType;
  amount: number;
}) {
  const booking = await prisma.booking.findUnique({ where: { id: params.bookingId } });
  if (!booking) throw new NotFoundError("Booking");
  if (params.amount > Number(booking.balanceDue)) {
    throw new AppError("Payment amount exceeds outstanding balance", 422);
  }

  const payment = await prisma.payment.create({
    data: { bookingId: params.bookingId, type: params.type, amount: params.amount, status: "PENDING" },
  });

  const order = await createRazorpayOrder(params.amount, payment.id);

  return prisma.payment.update({
    where: { id: payment.id },
    data: { razorpayOrderId: order.id },
  });
}

export async function confirmPayment(params: {
  paymentId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  const isValid = verifyRazorpaySignature({
    orderId: params.razorpayOrderId,
    paymentId: params.razorpayPaymentId,
    signature: params.razorpaySignature,
  });
  if (!isValid) throw new AppError("Invalid payment signature", 400);

  const payment = await prisma.payment.update({
    where: { id: params.paymentId },
    data: {
      status: "PAID",
      razorpayPaymentId: params.razorpayPaymentId,
      razorpaySignature: params.razorpaySignature,
      receiptUrl: `/receipts/${params.paymentId}.pdf`,
    },
    include: { booking: { include: { customer: true } } },
  });

  const booking = payment.booking;
  const advancePaid = Number(booking.advancePaid) + Number(payment.amount);
  const balanceDue = Number(booking.totalAmount) - advancePaid;

  await prisma.booking.update({
    where: { id: booking.id },
    data: { advancePaid, balanceDue: Math.max(balanceDue, 0) },
  });

  await sendWhatsAppMessage(
    booking.customer.phone,
    `Your booking ${booking.eventId} is confirmed. Rs. ${payment.amount} ${payment.type.toLowerCase()} ` +
      `payment received. Remaining balance: Rs. ${Math.max(balanceDue, 0)}.`,
  );

  return payment;
}

export async function getOutstandingAmount(bookingId: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new NotFoundError("Booking");
  return { totalAmount: booking.totalAmount, advancePaid: booking.advancePaid, balanceDue: booking.balanceDue };
}

export async function listPaymentsForBooking(bookingId: string) {
  return prisma.payment.findMany({ where: { bookingId }, orderBy: { createdAt: "desc" } });
}
