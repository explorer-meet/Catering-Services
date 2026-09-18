import { askForJson } from "../../common/openaiClient";

export interface CatalogItemSummary {
  id: string;
  name: string;
  category: string;
  cuisine: string | null;
  foodType: string;
  costPerPlate: number;
  isJainSafe: boolean;
}

export interface RecommendedPackage {
  name: string; // e.g. "Silver", "Gold", "Platinum"
  description: string;
  itemIds: string[]; // subset of the catalog ids provided
}

export interface MenuRecommendation {
  packages: RecommendedPackage[];
}

const SYSTEM_PROMPT = `You are a catering company's AI Menu Recommendation Agent.
Given the customer's event requirement and a catalog of available menu items (each with an id,
category, cuisine, food type and cost per plate), design 2 to 3 complete menu packages
(e.g. "Silver", "Gold", "Platinum") that fit within the customer's budget per plate.

Rules:
- Every package must include items from these categories where available in the catalog:
  Starters, Main Course, Breads, Rice, Dal, Salads, Desserts, Beverages.
  Include Live Counter and Kids Menu items only in higher tiers if budget allows.
- Only use items whose foodType is compatible with the customer's requirement
  (e.g. if the customer wants Jain food, only include items where isJainSafe is true).
- Only reference itemIds that exist in the provided catalog. Never invent new items.
- Keep the sum of included items' costPerPlate at or below the customer's budgetPerPlate for at
  least one package; higher tiers may slightly exceed it.

Respond ONLY with JSON: { "packages": [ { "name": string, "description": string, "itemIds": string[] } ] }`;

export async function recommendMenuPackages(params: {
  eventType: string;
  guestCount: number;
  foodType: string;
  cuisinePreferences: string[];
  budgetPerPlate: number;
  catalog: CatalogItemSummary[];
}): Promise<MenuRecommendation> {
  const userPrompt = JSON.stringify(params);
  return askForJson<MenuRecommendation>(SYSTEM_PROMPT, userPrompt);
}
