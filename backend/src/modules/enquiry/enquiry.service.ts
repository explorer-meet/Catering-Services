import { Channel } from "@prisma/client";
import { Prisma } from "@prisma/client";
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

  const previousTurns: ChatTurn[] = (enquiry?.rawConversation as unknown as ChatTurn[]) ?? [];
  const turns: ChatTurn[] = [...previousTurns, { role: "user", content: input.message }];

  const extraction = await extractEnquiryFromConversation(turns);

  if (extraction.nextQuestion) {
    turns.push({ role: "assistant", content: extraction.nextQuestion });
  }

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
    reply: extraction.nextQuestion ?? "Great, I have everything I need to recommend menu packages for you!",
    isComplete: extraction.isComplete,
  };
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
