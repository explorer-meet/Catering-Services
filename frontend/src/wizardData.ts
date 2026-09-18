export const EVENT_TYPES = [
  { value: "Wedding", label: "Wedding", icon: "💍" },
  { value: "Birthday Celebration", label: "Birthday Celebration", icon: "🎂" },
  { value: "Farewell", label: "Farewell", icon: "🎓" },
  { value: "Bachelor Party", label: "Bachelor Party", icon: "🥂" },
  { value: "Corporate Event", label: "Corporate Event", icon: "💼" },
  { value: "Others", label: "Others", icon: "✨" },
] as const;

export const MEAL_TYPES = [
  { value: "BREAKFAST", label: "Breakfast" },
  { value: "LUNCH", label: "Lunch" },
  { value: "HIGH_TEA", label: "High Tea" },
  { value: "DINNER", label: "Dinner" },
] as const;

export interface WizardData {
  eventType: string;
  guestCount: string;
  paxCount: string;
  eventDate: string;
  venueType: "INDOOR" | "OUTDOOR" | "";
  budgetPerPlate: string;
  serviceTimes: string[];
  customerName: string;
  customerPhone: string;
}

export const EMPTY_WIZARD_DATA: WizardData = {
  eventType: "",
  guestCount: "",
  paxCount: "",
  eventDate: "",
  venueType: "",
  budgetPerPlate: "",
  serviceTimes: [],
  customerName: "",
  customerPhone: "",
};
