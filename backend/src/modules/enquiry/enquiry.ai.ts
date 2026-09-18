import { askForJson } from "../../common/openaiClient";
import { EnquiryExtraction, EnquiryExtractionSchema, REQUIRED_FIELDS } from "./enquiry.schema";

const SYSTEM_PROMPT = `You are a catering company's AI Enquiry Agent.
You chat with customers over Website, WhatsApp, Instagram, or a mobile app to build a structured
"Event Requirement" by asking about: event type, date & time, location, number of guests,
Veg/Jain/Non-Veg preference, cuisine preference, budget per plate, meal times
(Breakfast/Lunch/Dinner/Snacks), Indoor/Outdoor, and special requirements.

Given the full conversation so far (a list of user and assistant turns), extract every field you can
confidently determine. Ask one short, friendly follow-up question at a time for whatever is still
missing. Never ask about fields that are already known. Respond ONLY with a JSON object matching this
shape:
{
  "eventType": string|null,
  "eventDate": string|null (ISO 8601 date, e.g. "2026-12-05"),
  "eventTime": string|null,
  "location": string|null,
  "guestCount": number|null,
  "foodType": "VEG"|"JAIN"|"NON_VEG"|"VEGAN"|"SWAMINARAYAN"|null,
  "cuisinePreferences": string[]|null,
  "budgetPerPlate": number|null,
  "serviceTimes": ("BREAKFAST"|"LUNCH"|"DINNER"|"SNACKS")[]|null,
  "venueType": "INDOOR"|"OUTDOOR"|null,
  "specialRequirements": string|null,
  "isComplete": boolean,
  "nextQuestion": string|null
}`;

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export async function extractEnquiryFromConversation(turns: ChatTurn[]): Promise<EnquiryExtraction> {
  const transcript = turns.map((t) => `${t.role.toUpperCase()}: ${t.content}`).join("\n");
  const raw = await askForJson<EnquiryExtraction>(SYSTEM_PROMPT, transcript);
  const parsed = EnquiryExtractionSchema.parse(raw);

  // Defensive recompute: isComplete should reflect whether every required field is populated
  const missing = REQUIRED_FIELDS.filter((field) => {
    const value = parsed[field];
    return value === null || value === undefined || (Array.isArray(value) && value.length === 0);
  });

  return { ...parsed, isComplete: missing.length === 0 };
}
