import { Channel, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { NotFoundError } from "../../common/errors";
import { env } from "../../config/env";
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
  specialRequirements?: string;
}

interface EnquiryMessageResult {
  enquiry: Awaited<ReturnType<typeof prisma.enquiry.findUnique>>;
  reply: string;
  isComplete: boolean;
  mediaUrls?: string[];
}

const WHATSAPP_WELCOME_MESSAGE =
  "✨ Welcome to *Vivah Caterers!*\nThanks for reaching out. We will help you plan the perfect catering menu for your event.";
const WHATSAPP_FINAL_MESSAGE =
  "✅ *Thank you for sharing your event details!*\n\nOur team will reach out to you shortly for further details.";
const OFFICE_LOCATION_MESSAGE =
  "📍 *Vivah Caterers Office*\n\nGoogle Maps: https://maps.app.goo.gl/R94MdmReW2w2H5g48";

const EVENT_TYPE_OPTIONS = [
  "🎂 Birthday Celebration",
  "🎓 Farewell Party",
  "💼 Corporate Event",
  "💍 Wedding Ceremony",
  "🎉 Bachelor Party",
  "✨ Others",
];

const POST_BUDGET_OPTIONS = ["📄 Get Menu's", "📍 Visit Our Office", "🤝 In-person Meeting"];

const STANDARD_MENU_PDFS = [
  { label: "Silver Menu.pdf", fileName: "silver-menu.pdf" },
  { label: "Gold Menu.pdf", fileName: "gold-menu.pdf" },
  { label: "Platinum Menu.pdf", fileName: "platinum-menu.pdf" },
];

const OWNER_CATEGORY_OPTIONS = [
  "Soup",
  "Starter",
  "Chinese Counter",
  "Himalayan Counter",
  "Punjabi Counter",
  "Gujarati",
  "Kathiyavadi",
  "Sweets",
  "Mocktails",
  "Fresh Juice",
];

const OWNER_MAIN_MENU_OPTIONS = [
  "📋 View New Enquiries",
  "📅 View Bookings",
  "🍽️ Generate Menu",
  "🤝 View Meeting Requests",
  "📊 Today's Summary",
];

export async function handleEnquiryMessage(input: StartOrContinueInput) {
  const customer = await prisma.customer.upsert({
    where: { phone: input.customerPhone },
    update: { name: input.customerName },
    create: { phone: input.customerPhone, name: input.customerName, channel: input.channel },
  });

  const shouldStartNewWhatsAppEnquiry =
    input.channel === "WHATSAPP" &&
    !input.enquiryId &&
    (isGreetingMessage(input.message) || isOwnerMainMenuStart(input.message) || isOwnerMenuStart(input.message));

  const enquiry = input.enquiryId
    ? await prisma.enquiry.findUnique({ where: { id: input.enquiryId } })
    : shouldStartNewWhatsAppEnquiry
      ? null
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
    mediaUrls: undefined,
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
  let mediaUrls: string[] | undefined;

  if (isOwnerMainMenuStart(input.message)) {
    createEventType = "Owner Command";
    reply = formatOwnerMainMenu();
  } else if (isOwnerMainMenuQuestion(lastAssistantMessage)) {
    createEventType = "Owner Command";
    reply = await handleOwnerMainMenuSelection(input.message);
    isComplete = true;
  } else if (isOwnerMenuStart(input.message)) {
    createEventType = "Owner Menu Draft";
    reply = `👨‍🍳 *Owner Menu Generator*\n\n${formatEventTypeQuestion("What type of event are you planning?")}`;
  } else if (isOwnerEventQuestion(lastAssistantMessage)) {
    const eventType = normalizeEventTypeAnswer(input.message);
    updateData.eventType = eventType;
    createEventType = eventType;
    reply = "📅 *Owner Menu Generator*\n\nWhen is the event?\n\nPlease share the event date, for example: 21 Feb 2026.";
  } else if (isOwnerDateQuestion(lastAssistantMessage)) {
    const eventDate = parseEventDate(input.message);

    if (!eventDate) {
      reply = "📅 Please share the event date, for example: 25 Dec 2026.";
    } else {
      updateData.eventDate = eventDate;
      reply = "👥 *Owner Menu Generator*\n\nHow many persons are expected?\n\nPlease reply with a number, for example: 100, 300, or 500.";
    }
  } else if (isOwnerPersonsQuestion(lastAssistantMessage)) {
    const guestCount = parsePositiveNumber(input.message);

    if (!guestCount) {
      reply = "👥 Please share the person count as a number, for example: 100, 300, or 500.";
    } else {
      updateData.guestCount = guestCount;
      reply = "📍 *Owner Menu Generator*\n\nWhat is the event location?\n\nExample: Green Wood Party Plot";
    }
  } else if (isOwnerLocationQuestion(lastAssistantMessage)) {
    updateData.location = input.message.trim();
    reply = formatOwnerCategoryOptions();
  } else if (isOwnerCategoryQuestion(lastAssistantMessage)) {
    const selectedCategories = normalizeOwnerCategorySelection(input.message);

    if (selectedCategories.length === 0) {
      reply = `Please select at least one category by replying with numbers or names.\n\n${formatOwnerCategoryOptions()}`;
    } else {
      updateData.specialRequirements = `Owner selected menu categories: ${selectedCategories.join(", ")}`;
      reply = await generateOwnerMenuReply({ enquiry, updateData, selectedCategories });
      isComplete = true;
    }
  } else if (isEventTypeQuestion(lastAssistantMessage)) {
    const eventType = normalizeEventTypeAnswer(input.message);
    updateData.eventType = eventType;
    createEventType = eventType;
    reply = "👥 *How many guests are you expecting?*\n\nPlease reply with a number, for example: 50, 100, or 200.";
  } else if (isGuestCountQuestion(lastAssistantMessage)) {
    const guestCount = parsePositiveNumber(input.message);

    if (!guestCount) {
      reply = "👥 Please share the expected guest count as a number, for example: 50, 100, or 200.";
    } else {
      updateData.guestCount = guestCount;
      reply = "📅 *When is the event?*\n\nPlease share the date, for example: 21 Feb 2026.";
    }
  } else if (isEventDateQuestion(lastAssistantMessage)) {
    const eventDate = parseEventDate(input.message);

    if (!eventDate) {
      reply = "📅 Please share the event date, for example: 25 Dec 2026.";
    } else {
      updateData.eventDate = eventDate;
      reply = "📍 *What is the location?*\n\nFor example: Green Wood Party Plot.";
    }
  } else if (isLocationQuestion(lastAssistantMessage)) {
    updateData.location = input.message.trim();
    reply = "💰 *What is the budget per person?*\n\nPlease reply with an amount, for example: 300, 500, or 800.";
  } else if (isBudgetQuestion(lastAssistantMessage)) {
    const budgetPerPlate = parsePositiveNumber(input.message);

    if (!budgetPerPlate) {
      reply = "💰 Please share the budget per person as a number, for example: 300, 500, or 800.";
    } else {
      updateData.budgetPerPlate = budgetPerPlate;
      reply = formatPostBudgetOptions();
    }
  } else if (isPostBudgetOptionsQuestion(lastAssistantMessage)) {
    const action = normalizePostBudgetAction(input.message);

    if (action === "STANDARD_MENU") {
      updateData.specialRequirements = "Customer requested standard menu options.";
      reply = formatStandardMenuOptions();
    } else if (action === "VISIT_OFFICE") {
      updateData.specialRequirements = "Customer requested office location.";
      reply = `${OFFICE_LOCATION_MESSAGE}\n\n${WHATSAPP_FINAL_MESSAGE}`;
      isComplete = true;
    } else if (action === "IN_PERSON_MEETING") {
      updateData.specialRequirements = "Customer requested an in-person meeting.";
      reply = "🤝 *In-person meeting*\n\nPlease share your preferred meeting date, time, and location.";
    } else {
      reply = `Please choose one option by replying with 1, 2, or 3.\n\n${formatPostBudgetOptions()}`;
    }
  } else if (isStandardMenuOptionsQuestion(lastAssistantMessage)) {
    const selectedMenu = normalizeStandardMenuSelection(input.message);

    if (!selectedMenu) {
      reply = `Please choose a menu by replying with 1, 2, 3, Silver, Gold, or Platinum.\n\n${formatStandardMenuOptions()}`;
    } else {
      updateData.specialRequirements = `Customer requested ${selectedMenu.label}.`;
      reply = `${formatSelectedMenuReply(selectedMenu.label)}\n\n${WHATSAPP_FINAL_MESSAGE}`;
      mediaUrls = [getStandardMenuMediaUrl(selectedMenu.fileName)];
      isComplete = true;
    }
  } else if (isMeetingDetailsQuestion(lastAssistantMessage)) {
    updateData.specialRequirements = `Customer requested an in-person meeting. Preferred details: ${input.message.trim()}`;
    reply = WHATSAPP_FINAL_MESSAGE;
    isComplete = true;
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

  return { enquiry: saved, reply, isComplete, mediaUrls } satisfies EnquiryMessageResult;
}

function getNextWhatsAppQuestion(enquiry: Awaited<ReturnType<typeof prisma.enquiry.findUnique>>) {
  if (!enquiry || enquiry.eventType === "unspecified") {
    return formatEventTypeQuestion("What type of event are you planning?");
  }

  if (!enquiry.guestCount) {
    return "👥 *How many guests are you expecting?*\n\nPlease reply with a number, for example: 50, 100, or 200.";
  }

  if (!enquiry.eventDate) {
    return "📅 *When is the event?*\n\nPlease share the date, for example: 21 Feb 2026.";
  }

  if (!enquiry.location) {
    return "📍 *What is the location?*\n\nFor example: Green Wood Party Plot.";
  }

  if (!enquiry.budgetPerPlate) {
    return "💰 *What is the budget per person?*\n\nPlease reply with an amount, for example: 300, 500, or 800.";
  }

  return formatPostBudgetOptions();
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
  return `🎊 *What type of event are you planning?*\n\n${options}\n\nReply with the option number or event name.`;
}

function normalizeEventTypeOption(message: string, previousTurns: ChatTurn[]) {
  const selectedOption = EVENT_TYPE_OPTIONS[Number(message.trim()) - 1];

  if (!selectedOption || !previousTurns.some((turn) => turn.role === "assistant" && isEventTypeQuestion(turn.content))) {
    return message;
  }

  return selectedOption;
}

function normalizeEventTypeAnswer(message: string) {
  return stripEmojiPrefix(EVENT_TYPE_OPTIONS[Number(message.trim()) - 1] ?? message.trim());
}

function formatPostBudgetOptions() {
  const options = POST_BUDGET_OPTIONS.map((option, index) => `${index + 1}. ${option}`).join("\n");
  return `✅ *Thanks! What would you like to do next?*\n\n${options}\n\nReply with 1, 2, or 3.`;
}

function normalizePostBudgetAction(message: string) {
  const normalized = message.trim().toLowerCase();
  const selectedOption = Number(normalized);

  if (selectedOption === 1 || normalized.includes("standard") || normalized.includes("menu")) {
    return "STANDARD_MENU";
  }

  if (selectedOption === 2 || normalized.includes("office") || normalized.includes("visit")) {
    return "VISIT_OFFICE";
  }

  if (selectedOption === 3 || normalized.includes("meeting") || normalized.includes("person")) {
    return "IN_PERSON_MEETING";
  }

  return null;
}

function formatStandardMenuOptions() {
  const menus = STANDARD_MENU_PDFS.map((menu, index) => `${index + 1}. ${menu.label}`).join("\n");
  return `📄 *Get Menu's*\n\nWhich menu would you like to receive?\n\n${menus}\n\nReply with 1, 2, 3, Silver, Gold, or Platinum.`;
}

function formatSelectedMenuReply(menuLabel: string) {
  return `📄 *${menuLabel}*\n\nWe have attached the selected menu PDF for your reference.`;
}

function normalizeStandardMenuSelection(message: string) {
  const normalized = message.trim().toLowerCase();
  const selectedIndex = Number(normalized) - 1;

  if (STANDARD_MENU_PDFS[selectedIndex]) {
    return STANDARD_MENU_PDFS[selectedIndex];
  }

  return STANDARD_MENU_PDFS.find((menu) => menu.label.toLowerCase().includes(normalized));
}

function getStandardMenuMediaUrl(fileName: string) {
  const baseUrl = env.appBaseUrl.replace(/\/$/, "");
  return `${baseUrl}/menus/${fileName}`;
}

function formatOwnerMainMenu() {
  const options = OWNER_MAIN_MENU_OPTIONS.map((option, index) => `${index + 1}. ${option}`).join("\n");
  return `👨‍🍳 *Vivah Owner Desk*\n\nWhat would you like to do?\n\n${options}\n\nReply with option number or name.`;
}

async function handleOwnerMainMenuSelection(message: string) {
  const action = normalizeOwnerMainMenuAction(message);

  if (action === "VIEW_ENQUIRIES") {
    return formatOwnerNewEnquiries(await getOwnerNewEnquiries());
  }

  if (action === "VIEW_BOOKINGS") {
    return formatOwnerBookings(await getOwnerUpcomingBookings());
  }

  if (action === "GENERATE_MENU") {
    return `👨‍🍳 *Owner Menu Generator*\n\n${formatEventTypeQuestion("What type of event are you planning?")}`;
  }

  if (action === "VIEW_MEETINGS") {
    return formatOwnerMeetingRequests(await getOwnerMeetingRequests());
  }

  if (action === "TODAY_SUMMARY") {
    return formatOwnerTodaySummary(await getOwnerTodaySummary());
  }

  return `Please choose a valid option by replying with 1, 2, 3, 4, or 5.\n\n${formatOwnerMainMenu()}`;
}

function normalizeOwnerMainMenuAction(message: string) {
  const normalized = message.trim().toLowerCase();
  const selectedOption = Number(normalized);

  if (selectedOption === 1 || normalized.includes("enquir")) return "VIEW_ENQUIRIES";
  if (selectedOption === 2 || normalized.includes("booking")) return "VIEW_BOOKINGS";
  if (selectedOption === 3 || normalized.includes("generate") || normalized.includes("menu")) return "GENERATE_MENU";
  if (selectedOption === 4 || normalized.includes("meeting")) return "VIEW_MEETINGS";
  if (selectedOption === 5 || normalized.includes("summary") || normalized.includes("today")) return "TODAY_SUMMARY";

  return null;
}

async function getOwnerNewEnquiries() {
  return prisma.enquiry.findMany({
    where: { stage: "ENQUIRY", eventType: { notIn: ["Owner Command", "Owner Menu Draft"] } },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { customer: true },
  });
}

function formatOwnerNewEnquiries(enquiries: Awaited<ReturnType<typeof getOwnerNewEnquiries>>) {
  if (enquiries.length === 0) {
    return "📋 *New Enquiries*\n\nNo open customer enquiries found right now.";
  }

  const rows = enquiries.map((enquiry, index) => {
    const date = formatDateForWhatsApp(enquiry.eventDate);
    const budget = enquiry.budgetPerPlate ? `₹${Number(enquiry.budgetPerPlate)}/person` : "Not shared";
    return `${index + 1}. *${enquiry.customer.name}* - ${enquiry.eventType}\n   Guests: ${enquiry.guestCount ?? "Not shared"}\n   Date: ${date}\n   Location: ${enquiry.location ?? "Not shared"}\n   Budget: ${budget}`;
  });

  return `📋 *New Enquiries*\n\n${rows.join("\n\n")}\n\nReply *Owner* to go back to the owner menu.`;
}

async function getOwnerUpcomingBookings() {
  const now = new Date();
  return prisma.booking.findMany({
    where: { eventDate: { gte: now } },
    orderBy: { eventDate: "asc" },
    take: 5,
    include: { customer: true },
  });
}

function formatOwnerBookings(bookings: Awaited<ReturnType<typeof getOwnerUpcomingBookings>>) {
  if (bookings.length === 0) {
    return "📅 *Upcoming Bookings*\n\nNo upcoming bookings found right now.";
  }

  const rows = bookings.map((booking, index) => {
    return `${index + 1}. *${booking.eventId}* - ${booking.customer.name}\n   Date: ${formatDateForWhatsApp(booking.eventDate)}\n   Venue: ${booking.venue}\n   Guests: ${booking.guestCount}\n   Balance Due: ₹${Number(booking.balanceDue)}`;
  });

  return `📅 *Upcoming Bookings*\n\n${rows.join("\n\n")}\n\nReply *Owner* to go back to the owner menu.`;
}

async function getOwnerMeetingRequests() {
  return prisma.enquiry.findMany({
    where: {
      stage: "ENQUIRY",
      specialRequirements: { contains: "in-person meeting" },
      eventType: { notIn: ["Owner Command", "Owner Menu Draft"] },
    },
    orderBy: { updatedAt: "desc" },
    take: 5,
    include: { customer: true },
  });
}

function formatOwnerMeetingRequests(enquiries: Awaited<ReturnType<typeof getOwnerMeetingRequests>>) {
  if (enquiries.length === 0) {
    return "🤝 *Meeting Requests*\n\nNo pending in-person meeting requests found right now.";
  }

  const rows = enquiries.map((enquiry, index) => {
    const meetingDetails = enquiry.specialRequirements?.replace(/^Customer requested an in-person meeting\. ?/i, "") ?? "Details not shared";
    return `${index + 1}. *${enquiry.customer.name}* - ${enquiry.eventType}\n   Date: ${formatDateForWhatsApp(enquiry.eventDate)}\n   Location: ${enquiry.location ?? "Not shared"}\n   ${meetingDetails}`;
  });

  return `🤝 *Meeting Requests*\n\n${rows.join("\n\n")}\n\nReply *Owner* to go back to the owner menu.`;
}

async function getOwnerTodaySummary() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const [newEnquiries, meetingRequests, upcomingBookings, pendingPayments, generatedMenus] = await Promise.all([
    prisma.enquiry.count({
      where: {
        createdAt: { gte: startOfDay, lt: endOfDay },
        eventType: { notIn: ["Owner Command", "Owner Menu Draft"] },
      },
    }),
    prisma.enquiry.count({ where: { stage: "ENQUIRY", specialRequirements: { contains: "in-person meeting" } } }),
    prisma.booking.count({ where: { eventDate: { gte: startOfDay } } }),
    prisma.payment.count({ where: { status: { in: ["PENDING", "PARTIAL"] } } }),
    prisma.enquiry.count({ where: { eventType: "Owner Menu Draft", createdAt: { gte: startOfDay, lt: endOfDay } } }),
  ]);

  return { newEnquiries, meetingRequests, upcomingBookings, pendingPayments, generatedMenus };
}

function formatOwnerTodaySummary(summary: Awaited<ReturnType<typeof getOwnerTodaySummary>>) {
  return `📊 *Today's Summary*\n\nNew enquiries today: ${summary.newEnquiries}\nMeeting requests pending: ${summary.meetingRequests}\nOwner menus generated today: ${summary.generatedMenus}\nUpcoming bookings: ${summary.upcomingBookings}\nPending payments: ${summary.pendingPayments}\n\nReply *Owner* to go back to the owner menu.`;
}

function formatDateForWhatsApp(date: Date | null | undefined) {
  return date ? date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Not shared";
}

function formatOwnerCategoryOptions() {
  const categories = OWNER_CATEGORY_OPTIONS.map((category, index) => `${index + 1}. ${category}`).join("\n");
  return `🍽️ *Select menu categories*\n\n${categories}\n\nReply with category numbers or names.\nExample: 1, 2, 5, 8`;
}

function normalizeOwnerCategorySelection(message: string) {
  const normalized = message.trim().toLowerCase();

  if (normalized === "all") {
    return OWNER_CATEGORY_OPTIONS;
  }

  const selected = new Set<string>();
  const tokens = normalized
    .split(/[,\n]+/)
    .map((token) => token.trim())
    .filter(Boolean);

  for (const token of tokens) {
    const selectedByNumber = OWNER_CATEGORY_OPTIONS[Number(token) - 1];

    if (selectedByNumber) {
      selected.add(selectedByNumber);
      continue;
    }

    const selectedByName = OWNER_CATEGORY_OPTIONS.find((category) => {
      const categoryName = category.toLowerCase();
      return categoryName.includes(token) || token.includes(categoryName.split(" ")[0]);
    });

    if (selectedByName) {
      selected.add(selectedByName);
    }
  }

  return [...selected];
}

async function generateOwnerMenuReply({
  enquiry,
  updateData,
  selectedCategories,
}: {
  enquiry: Awaited<ReturnType<typeof prisma.enquiry.findUnique>>;
  updateData: WhatsAppEnquiryData;
  selectedCategories: string[];
}) {
  const eventType = updateData.eventType ?? enquiry?.eventType ?? "Event";
  const eventDate = updateData.eventDate ?? enquiry?.eventDate ?? null;
  const guestCount = updateData.guestCount ?? enquiry?.guestCount ?? null;
  const location = updateData.location ?? enquiry?.location ?? "Not shared";
  const menuSections = await Promise.all(
    selectedCategories.map(async (category) => ({ category, items: await findOwnerMenuItems(category) })),
  );
  const selectedItems = menuSections.flatMap((section) => section.items);
  const estimatedPrice = selectedItems.reduce((sum, item) => sum + Number(item.costPerPlate), 0);
  const sections = menuSections
    .map((section) => {
      const items = section.items.length > 0
        ? section.items.map((item) => `• ${item.name}`).join("\n")
        : "• No matching items found in catalog";

      return `*${section.category}*\n${items}`;
    })
    .join("\n\n");
  const formattedDate = eventDate ? eventDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Not shared";

  return `👨‍🍳 *Generated Owner Menu*\n\n*Event:* ${eventType}\n*Date:* ${formattedDate}\n*Persons:* ${guestCount ?? "Not shared"}\n*Location:* ${location}\n\n${sections}\n\n*Estimated food cost:* ₹${estimatedPrice}/person\n\nYou can review and customize this menu during the meeting.`;
}

async function findOwnerMenuItems(category: string) {
  const items = await prisma.menuItem.findMany({ include: { category: true }, orderBy: { costPerPlate: "asc" } });
  const matched = items.filter((item) => ownerCategoryMatchesItem(category, item));
  const fallback = items.filter((item) => item.category.name.toLowerCase().includes(category.toLowerCase().split(" ")[0]));
  const selected = matched.length > 0 ? matched : fallback;

  return selected.slice(0, getOwnerCategoryItemCount(category));
}

function ownerCategoryMatchesItem(
  category: string,
  item: Prisma.MenuItemGetPayload<{ include: { category: true } }>,
) {
  const target = category.toLowerCase();
  const itemText = `${item.name} ${item.cuisine ?? ""} ${item.category.name}`.toLowerCase();

  if (target === "soup") return item.category.name.toLowerCase().includes("soup");
  if (target === "starter") return item.category.name.toLowerCase().includes("starter");
  if (target === "mocktails") return item.category.name.toLowerCase().includes("mocktail");
  if (target === "fresh juice") return item.category.name.toLowerCase().includes("juice");
  if (target === "sweets") return item.category.name.toLowerCase().includes("dessert") || itemText.includes("sweet");
  if (target === "chinese counter") {
    return ["chinese", "manchurian", "schezwan", "noodle", "fried rice", "spring roll", "chilli paneer"].some((word) => itemText.includes(word));
  }
  if (target === "himalayan counter") {
    return ["momo", "thukpa", "wonton", "dumpling"].some((word) => itemText.includes(word));
  }
  if (target === "punjabi counter") {
    return ["punjabi", "paneer", "dal makhani", "naan", "kulcha", "chole", "tandoori"].some((word) => itemText.includes(word));
  }
  if (target === "gujarati") {
    return ["gujarati", "undhiyu", "kadhi", "mohanthal", "shrikhand", "basundi"].some((word) => itemText.includes(word));
  }
  if (target === "kathiyavadi") {
    return ["kathiyavadi", "bajra", "lasooni", "sev tameta", "ringan", "rotla", "gujarati"].some((word) => itemText.includes(word));
  }

  return itemText.includes(target);
}

function getOwnerCategoryItemCount(category: string) {
  if (["Soup", "Mocktails", "Fresh Juice", "Sweets"].includes(category)) {
    return 3;
  }

  return 4;
}

function stripEmojiPrefix(message: string) {
  return message.replace(/^[^A-Za-z0-9]+\s*/, "").trim();
}

function isOwnerMainMenuStart(message: string) {
  const normalized = message.trim().toLowerCase();
  return ["owner", "admin", "owner desk", "owner menu"].includes(normalized);
}

function isOwnerMainMenuQuestion(message: string) {
  return message.toLowerCase().includes("vivah owner desk");
}

function isOwnerMenuStart(message: string) {
  const normalized = message.trim().toLowerCase();
  return ["generate menu", "create menu", "admin menu"].some((phrase) => normalized.includes(phrase));
}

function isOwnerEventQuestion(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("owner menu generator") && isEventTypeQuestion(message);
}

function isOwnerDateQuestion(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("owner menu generator") && normalized.includes("when is the event");
}

function isOwnerPersonsQuestion(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("owner menu generator") && normalized.includes("how many persons are expected");
}

function isOwnerLocationQuestion(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("owner menu generator") && normalized.includes("what is the event location");
}

function isOwnerCategoryQuestion(message: string) {
  return message.toLowerCase().includes("select menu categories");
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

function isPostBudgetOptionsQuestion(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("what would you like to do next") || normalized.includes("standard menu");
}

function isStandardMenuOptionsQuestion(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("which menu would you like to receive");
}

function isMeetingDetailsQuestion(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("preferred meeting date") || normalized.includes("in-person meeting");
}

function parsePositiveNumber(message: string) {
  const match = message.replace(/,/g, "").match(/\d+/);
  const value = match ? Number(match[0]) : 0;
  return value > 0 ? value : null;
}

function parseEventDate(message: string) {
  const normalized = message.trim().replace(/(\d+)(st|nd|rd|th)/gi, "$1");
  let date = new Date(normalized);

  if (Number.isNaN(date.getTime()) && !/\b\d{4}\b/.test(normalized)) {
    date = new Date(`${normalized} ${new Date().getFullYear()}`);
  }

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (!/\b\d{4}\b/.test(normalized) && date < new Date()) {
    date.setFullYear(date.getFullYear() + 1);
  }

  return date;
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
