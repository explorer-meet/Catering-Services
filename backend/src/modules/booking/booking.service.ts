import { prisma } from "../../lib/prisma";
import { NotFoundError, AppError } from "../../common/errors";
import { sendWhatsAppMessage } from "../../common/whatsappClient";
import { EventStage } from "@prisma/client";

export async function confirmBooking(params: {
  quotationId: string;
  contactPerson: string;
  contactPhone: string;
  venue?: string;
}) {
  const quotation = await prisma.quotation.findUnique({
    where: { id: params.quotationId },
    include: { enquiry: { include: { customer: true } } },
  });
  if (!quotation) throw new NotFoundError("Quotation");

  const existing = await prisma.booking.findUnique({ where: { enquiryId: quotation.enquiryId } });
  if (existing) throw new AppError("Booking already exists for this enquiry", 409);

  const eventId = await nextEventId();

  const booking = await prisma.booking.create({
    data: {
      eventId,
      enquiryId: quotation.enquiryId,
      customerId: quotation.enquiry.customerId,
      stage: "CONFIRMED",
      eventDate: quotation.enquiry.eventDate ?? new Date(),
      eventTime: quotation.enquiry.eventTime ?? undefined,
      venue: params.venue ?? quotation.enquiry.location ?? "TBD",
      guestCount: quotation.guestCount,
      contactPerson: params.contactPerson,
      contactPhone: params.contactPhone,
      totalAmount: quotation.totalAmount,
      advancePaid: 0,
      balanceDue: quotation.totalAmount,
    },
  });

  await prisma.enquiry.update({ where: { id: quotation.enquiryId }, data: { stage: "CONFIRMED" } });

  await sendWhatsAppMessage(
    quotation.enquiry.customer.phone,
    `Your booking ${booking.eventId} is created. Total amount: Rs. ${quotation.totalAmount}. ` +
      `Please pay the advance to confirm your event date.`,
  );

  return booking;
}

async function nextEventId(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.booking.count({ where: { eventId: { startsWith: `EVT-${year}-` } } });
  return `EVT-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function updateBookingStage(bookingId: string, stage: EventStage) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new NotFoundError("Booking");
  return prisma.booking.update({ where: { id: bookingId }, data: { stage } });
}

export async function getBooking(id: string) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { customer: true, enquiry: true, payments: true },
  });
  if (!booking) throw new NotFoundError("Booking");
  return booking;
}

export async function listBookings() {
  return prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    include: { customer: true, payments: true },
  });
}
