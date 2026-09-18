import { z } from "zod";

/// Structured Event Requirement the Enquiry Agent must extract from free-form chat
export const EnquiryExtractionSchema = z.object({
  eventType: z.string().nullable(),
  eventDate: z.string().nullable(), // ISO date string or null
  eventTime: z.string().nullable(),
  location: z.string().nullable(),
  guestCount: z.number().int().positive().nullable(),
  foodType: z.enum(["VEG", "JAIN", "NON_VEG", "VEGAN", "SWAMINARAYAN"]).nullable(),
  cuisinePreferences: z.array(z.string()).nullable(),
  budgetPerPlate: z.number().positive().nullable(),
  serviceTimes: z.array(z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACKS"])).nullable(),
  venueType: z.enum(["INDOOR", "OUTDOOR"]).nullable(),
  specialRequirements: z.string().nullable(),
  /// true once all the mandatory fields above are known and the enquiry can move to menu recommendation
  isComplete: z.boolean(),
  /// the next question the assistant should ask the customer, empty if isComplete is true
  nextQuestion: z.string().nullable(),
});

export type EnquiryExtraction = z.infer<typeof EnquiryExtractionSchema>;

export const REQUIRED_FIELDS: (keyof EnquiryExtraction)[] = [
  "eventType",
  "eventDate",
  "location",
  "guestCount",
  "foodType",
  "cuisinePreferences",
  "budgetPerPlate",
  "serviceTimes",
  "venueType",
];
