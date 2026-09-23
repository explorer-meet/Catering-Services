import { Channel, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { NotFoundError } from "../../common/errors";
import { ChatTurn, extractEnquiryFromConversation } from "./enquiry.ai";
import { EnquiryExtraction } from "./enquiry.schema";

interface StartOrContinueInput {
  customerPhone: string;
  customerName: string;
  channel: Channel;
  message: string;
  enquiryId?: string;
}

interface WhatsAppEnquiryData {
  eventType?: string;
  guestCount?: number;
  eventDate?: Date;
  location?: string;
  budgetPerPlate?: number;
}

const WHATSAPP_WELCOME_MESSAGE =
  "Welcome to Vivah Caterers! Thanks for reaching out. We will help you plan the right catering menu for your event.";
const WHATSAPP_FINAL_MESSAGE =
  "Thank you for sharing your event details. Our team will reach out to you shortly for further details.";

const EVENT_TYPE_OPTIONS = [
  "Birthday Celebration",
  "Farewell Party",
  "Corporate Event",
  "Wedding Ceremony",
  "Bachelor Party",
  "Others",
];

export async function handleEnquiryMessage(input: StartOrContinueInput) {
  const customer = await prisma.customer.upsert({
    where: { phone: input.customerPhone },
    update: { name: input.customerName },
    create: { phone: input.customerPhone, name: input.customerName, channel: input.channel },
  });

  const enquiry = input.enquiryId
    ? await prisma.enquiry.findUnique({ where: { id: input.enquiryId } })
    : await prisma.enquiry.findFirst({
        where: { customerId: customer.id, stage: "ENQUIRY" },
        orderBy: { createdAt: "desc" },
      });

  if (input.channel === "WHATSAPP") {
    return handleWhatsAppEnquiry({ customerId: customer.id, enquiry, input });
  }

  const previousTurns: ChatTurn[] = (enquiry?.rawConversation as unknown as ChatTurn[]) ?? [];
  const message = normalizeEventTypeOption(input.message, previousTurns);
  const turns: ChatTurn[] = [...previousTurns, { role: "user", content: message }];

  const extraction = await extractEnquiryFromConversation(turns);
  const reply = buildReply(extraction.nextQuestion, false);

  turns.push({ role: "assistant", content: reply });

  const data = mapExtractionToEnquiryData(extraction);
  const rawConversation = turns as unknown as Prisma.InputJsonValue;

  const saved = enquiry
    ? await prisma.enquiry.update({
        where: { id: enquiry.id },
        data: { ...data, rawConversation },
      })
    : await prisma.enquiry.create({
        data: {
          customerId: customer.id,
          channel: input.channel,
          ...data,
          eventType: data.eventType ?? "unspecified",
          rawConversation,
        },
      });

  return {
    enquiry: saved,
    reply,
    isComplete: extraction.isComplete,
  };
}

async function handleWhatsAppEnquiry({
  customerId,
  enquiry,
  input,
}: {
  customerId: string;
  enquiry: Awaited<ReturnType<typeof prisma.enquiry.findUnique>>;
  input: StartOrContinueInput;
}) {
  const previousTurns: ChatTurn[] = (enquiry?.rawConversation as unknown as ChatTurn[]) ?? [];
  const lastAssistantMessage = [...previousTurns].reverse().find((turn) => turn.role === "assistant")?.content ?? "";
  const turns: ChatTurn[] = [...previousTurns, { role: "user", content: input.message }];

  const updateData: WhatsAppEnquiryData = {};
  let createEventType = "unspecified";
  let reply = getNextWhatsAppQuestion(enquiry);
  let isComplete = false;

  if (isEventTypeQuestion(lastAssistantMessage)) {
    const eventType = normalizeEventTypeAnswer(input.message);
    updateData.eventType = eventType;
    createEventType = eventType;
    reply = "How many guests are you expecting?";
  } else if (isGuestCountQuestion(lastAssistantMessage)) {
    const guestCount = parsePositiveNumber(input.message);

    if (!guestCount) {
      reply = "Please share the expected guest count as a number, for example 50, 100, or 200.";
    } else {
      updateData.guestCount = guestCount;
      reply = "When is the event?";
    }
  } else if (isEventDateQuestion(lastAssistantMessage)) {
    const eventDate = parseEventDate(input.message);

    if (!eventDate) {
      reply = "Please share the event date, for example 25 Dec 2026.";
    } else {
      updateData.eventDate = eventDate;
      reply = "What is the location?";
    }
  } else if (isLocationQuestion(lastAssistantMessage)) {
    updateData.location = input.message.trim();
    reply = "What is the budget per person?";
  } else if (isBudgetQuestion(lastAssistantMessage)) {
    const budgetPerPlate = parsePositiveNumber(input.message);

    if (!budgetPerPlate) {
      reply = "Please share the budget per person as a number, for example 300, 500, or 800.";
    } else {
      updateData.budgetPerPlate = budgetPerPlate;
      reply = WHATSAPP_FINAL_MESSAGE;
      isComplete = true;
    }
  } else if (!enquiry) {
    reply = buildReply(formatEventTypeQuestion("What type of event are you planning?"), isGreetingMessage(input.message));
  }

  turns.push({ role: "assistant", content: reply });

  const rawConversation = turns as unknown as Prisma.InputJsonValue;
  const saved = enquiry
    ? await prisma.enquiry.update({
        where: { id: enquiry.id },
        data: { ...updateData, rawConversation },
      })
    : await prisma.enquiry.create({
        data: {
          customerId,
          channel: input.channel,
          eventType: createEventType,
          ...updateData,
          rawConversation,
        },
      });

  return { enquiry: saved, reply, isComplete };
}

function getNextWhatsAppQuestion(enquiry: Awaited<ReturnType<typeof prisma.enquiry.findUnique>>) {
  if (!enquiry || enquiry.eventType === "unspecified") {
    return formatEventTypeQuestion("What type of event are you planning?");
  }

  if (!enquiry.guestCount) {
    return "How many guests are you expecting?";
  }

  if (!enquiry.eventDate) {
    return "When is the event?";
  }

  if (!enquiry.location) {
    return "What is the location?";
  }

  if (!enquiry.budgetPerPlate) {
    return "What is the budget per person?";
  }

  return WHATSAPP_FINAL_MESSAGE;
}

function buildReply(nextQuestion: string | null | undefined, includeWelcome: boolean) {
  const reply = formatEventTypeQuestion(
    nextQuestion ?? "Great, I have everything I need to recommend menu packages for you!",
  );
  return includeWelcome ? `${WHATSAPP_WELCOME_MESSAGE}\n\n${reply}` : reply;
}

function formatEventTypeQuestion(reply: string) {
  if (!isEventTypeQuestion(reply)) {
    return reply;
  }

  const options = EVENT_TYPE_OPTIONS.map((option, index) => `${index + 1}. ${option}`).join("\n");
  return `What type of event are you planning?\n\n${options}`;
}

function normalizeEventTypeOption(message: string, previousTurns: ChatTurn[]) {
  const selectedOption = EVENT_TYPE_OPTIONS[Number(message.trim()) - 1];

  if (!selectedOption || !previousTurns.some((turn) => turn.role === "assistant" && isEventTypeQuestion(turn.content))) {
    return message;
  }

  return selectedOption;
}

function normalizeEventTypeAnswer(message: string) {
  return EVENT_TYPE_OPTIONS[Number(message.trim()) - 1] ?? message.trim();
}

function isEventTypeQuestion(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("type of event") || normalized.includes("event are you planning");
}

function isGreetingMessage(message: string) {
  const words = message
    .trim()
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0 || words.length > 3) {
    return false;
  }

  return words.some((word) => ["hi", "hii", "hello", "hey", "namaste", "start"].includes(word));
}

function isGuestCountQuestion(message: string) {
  return message.toLowerCase().includes("how many guests");
}

function isEventDateQuestion(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("when is the event") || normalized.includes("event date");
}

function isLocationQuestion(message: string) {
  return message.toLowerCase().includes("what is the location");
}

function isBudgetQuestion(message: string) {
  return message.toLowerCase().includes("budget per person");
}

function parsePositiveNumber(message: string) {
  const match = message.replace(/,/g, "").match(/\d+/);
  const value = match ? Number(match[0]) : 0;
  return value > 0 ? value : null;
}

function parseEventDate(message: string) {
  const date = new Date(message.trim());
  return Number.isNaN(date.getTime()) ? null : date;
}

function mapExtractionToEnquiryData(extraction: EnquiryExtraction) {
  return {
    eventType: extraction.eventType ?? undefined,
    eventDate: extraction.eventDate ? new Date(extraction.eventDate) : undefined,
    eventTime: extraction.eventTime ?? undefined,
    location: extraction.location ?? undefined,
    guestCount: extraction.guestCount ?? undefined,
    foodType: extraction.foodType ?? undefined,
    cuisinePreferences: extraction.cuisinePreferences?.join(",") ?? undefined,
    budgetPerPlate: extraction.budgetPerPlate ?? undefined,
    serviceTimes: extraction.serviceTimes?.join(",") ?? undefined,
    venueType: extraction.venueType ?? undefined,
    specialRequirements: extraction.specialRequirements ?? undefined,
  };
}

export interface WizardEnquiryInput {
  customerPhone: string;
  customerName: string;
  eventType: string;
  guestCount: number;
  paxCount: number;
  eventDate: string; // ISO date
  venueType: "INDOOR" | "OUTDOOR";
  budgetPerPlate: number;
  serviceTimes: ("BREAKFAST" | "LUNCH" | "HIGH_TEA" | "DINNER" | "SNACKS")[];
  location?: string;
  specialRequirements?: string;
}

export interface ContactEnquiryInput {
  customerName: string;
  customerPhone: string;
  eventType: string;
  note: string;
}

export async function createContactEnquiry(input: ContactEnquiryInput) {
  const customer = await prisma.customer.upsert({
    where: { phone: input.customerPhone },
    update: { name: input.customerName },
    create: { phone: input.customerPhone, name: input.customerName, channel: "WEBSITE" },
  });

  return prisma.enquiry.create({
    data: {
      customerId: customer.id,
      channel: "WEBSITE",
      eventType: input.eventType,
      specialRequirements: input.note,
      foodType: "VEG",
    },
    include: { customer: true },
  });
}

/// Creates an Enquiry directly from the structured planning wizard (no free-form chat/AI parsing needed)
export async function createEnquiryFromWizard(input: WizardEnquiryInput) {
  const customer = await prisma.customer.upsert({
    where: { phone: input.customerPhone },
    update: { name: input.customerName },
    create: { phone: input.customerPhone, name: input.customerName, channel: "WEBSITE" },
  });

  const enquiry = await prisma.enquiry.create({
    data: {
      customerId: customer.id,
      channel: "WEBSITE",
      eventType: input.eventType,
      eventDate: new Date(input.eventDate),
      guestCount: input.guestCount,
      paxCount: input.paxCount,
      venueType: input.venueType,
      budgetPerPlate: input.budgetPerPlate,
      serviceTimes: input.serviceTimes.join(","),
      location: input.location,
      specialRequirements: input.specialRequirements,
      foodType: "VEG",
      stage: "QUOTATION",
    },
    include: { customer: true },
  });

  const welcomeMessage = `Hi Vivah Caterers, I am ${input.customerName}. My enquiry ${enquiry.id} is ready. Please help me finalize my event menu.`;
  return {
    ...enquiry,
    whatsappLink: `https://wa.me/918758770402?text=${encodeURIComponent(welcomeMessage)}`,
  };
}

export async function getEnquiry(id: string) {
  const enquiry = await prisma.enquiry.findUnique({ where: { id }, include: { customer: true } });
  if (!enquiry) throw new NotFoundError("Enquiry");
  return enquiry;
}

export async function listEnquiries() {
  return prisma.enquiry.findMany({ orderBy: { createdAt: "desc" }, include: { customer: true } });
}
