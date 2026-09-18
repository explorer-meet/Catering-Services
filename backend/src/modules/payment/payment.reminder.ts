import cron from "node-cron";
import { prisma } from "../../lib/prisma";
import { sendWhatsAppMessage } from "../../common/whatsappClient";

const REMINDER_WINDOW_HOURS = 24;

/// Runs daily: nudges customers with outstanding balance whose event is within 14 days
async function sendPaymentReminders() {
  const fourteenDaysFromNow = new Date();
  fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);

  const bookings = await prisma.booking.findMany({
    where: {
      balanceDue: { gt: 0 },
      stage: { in: ["CONFIRMED", "PREPARATION"] },
      eventDate: { lte: fourteenDaysFromNow },
    },
    include: { customer: true },
  });

  for (const booking of bookings) {
    await sendWhatsAppMessage(
      booking.customer.phone,
      `Reminder: your event ${booking.eventId} on ${booking.eventDate.toDateString()} has an ` +
        `outstanding balance of Rs. ${booking.balanceDue}. Please complete the payment at your earliest.`,
    );
  }
}

export function schedulePaymentReminders() {
  // Every day at 9 AM server time
  cron.schedule("0 9 * * *", () => {
    sendPaymentReminders().catch((err) => console.error("Payment reminder job failed:", err));
  });
}

export { sendPaymentReminders, REMINDER_WINDOW_HOURS };
