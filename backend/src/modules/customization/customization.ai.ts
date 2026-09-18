import { askForJson } from "../../common/openaiClient";
import { CatalogItemSummary } from "../menu/menu.ai";

export interface CustomizationResult {
  addItemIds: string[];
  removeItemIds: string[];
  appliedFilters: string[]; // e.g. "no_onion_garlic", "jain", "gluten_free"
  summary: string; // human readable confirmation message for the customer
}

const SYSTEM_PROMPT = `You are a catering company's AI Menu Customization Agent.
The customer will send a free-form instruction such as "Remove Paneer Tikka and add Dahi Puri" or
"I don't want onion and garlic" or "make it Jain". You are given the current selected items in their
menu package and the full catalog of available items (with dietary flags: isJainSafe, isVegan,
isGlutenFree, containsOnionGarlic, allergens).

Decide which catalog itemIds to add and which currently-selected itemIds to remove so the package
satisfies the customer's instruction. If the instruction implies a dietary filter (no onion/garlic,
Jain, vegan, gluten-free, allergy), remove any currently selected items that violate it and prefer
adding compatible replacements from the catalog in the same category.

Respond ONLY with JSON:
{ "addItemIds": string[], "removeItemIds": string[], "appliedFilters": string[], "summary": string }`;

export async function computeMenuCustomization(params: {
  instruction: string;
  currentItems: CatalogItemSummary[];
  catalog: CatalogItemSummary[];
}): Promise<CustomizationResult> {
  const userPrompt = JSON.stringify(params);
  return askForJson<CustomizationResult>(SYSTEM_PROMPT, userPrompt);
}
