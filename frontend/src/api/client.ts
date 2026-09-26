import axios from "axios";

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "");
const apiBaseUrl = configuredApiBaseUrl || (import.meta.env.PROD
  ? "https://catering-services-jruw.onrender.com/api"
  : "/api");

export const api = axios.create({ baseURL: apiBaseUrl });

export async function createWizardEnquiry(params: {
  customerPhone: string;
  customerName: string;
  eventType: string;
  guestCount: number;
  paxCount: number;
  eventDate: string;
  venueType: "INDOOR" | "OUTDOOR";
  budgetPerPlate: number;
  serviceTimes: string[];
}) {
  const { data } = await api.post("/enquiries/wizard", params);
  return data;
}

export async function createContactEnquiry(params: {
  customerName: string;
  customerPhone: string;
  eventType: string;
  note: string;
}) {
  const { data } = await api.post("/enquiries/contact", params);
  return data;
}

export async function generateMenuPackages(enquiryId: string) {
  const { data } = await api.post(`/menu/enquiries/${enquiryId}/generate`);
  return data;
}

export interface TentativeEstimate {
  guestCount: number;
  guestTier: "FIFTY" | "HUNDRED";
  perCategory: { category: string; minPricePerPerson: number; maxPricePerPerson: number }[];
  totalMinPricePerPerson: number;
  totalMaxPricePerPerson: number;
}

export async function estimateTentativePrice(params: {
  guestCount: number;
  categories: string[];
}): Promise<TentativeEstimate> {
  const { data } = await api.post("/menu/estimate", params);
  return data;
}

export async function selectMenuPackage(packageId: string) {
  const { data } = await api.post(`/menu/packages/${packageId}/select`);
  return data;
}

export async function customizeMenuPackage(packageId: string, instruction: string) {
  const { data } = await api.post(`/customization/packages/${packageId}`, { instruction });
  return data;
}

export async function createQuotation(params: { enquiryId: string; menuPackageId: string }) {
  const { data } = await api.post("/quotations", params);
  return data;
}

// ---------- Owner / admin: categories, items, ingredients ----------

export type IngredientUnit =
  | "KG"
  | "GRAM"
  | "LITRE"
  | "ML"
  | "PIECE"
  | "PACKET"
  | "DOZEN"
  | "BUNDLE"
  | "TABLESPOON"
  | "TEASPOON";

export const INGREDIENT_UNITS: IngredientUnit[] = [
  "KG",
  "GRAM",
  "LITRE",
  "ML",
  "PIECE",
  "PACKET",
  "DOZEN",
  "BUNDLE",
  "TABLESPOON",
  "TEASPOON",
];

export const UNIT_LABELS: Record<IngredientUnit, string> = {
  KG: "kg",
  GRAM: "g",
  LITRE: "litre",
  ML: "ml",
  PIECE: "piece",
  PACKET: "packet",
  DOZEN: "dozen",
  BUNDLE: "bundle",
  TABLESPOON: "tbsp",
  TEASPOON: "tsp",
};

export interface AdminCategory {
  id: string;
  name: string;
  description: string | null;
  displayOrder: number;
  _count?: { items: number };
}

export interface AdminItem {
  id: string;
  name: string;
  categoryId: string;
  cuisine: string | null;
  foodType: string;
  costPerPlate: string | number;
  recipeBaseServings: number;
  _count?: { ingredients: number };
}

export interface RecipeLine {
  id: string;
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: IngredientUnit;
  notes: string | null;
}

export interface Recipe {
  itemId: string;
  itemName: string;
  categoryId: string;
  categoryName: string;
  recipeBaseServings: number;
  lines: RecipeLine[];
}

export interface RequirementLine {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: IngredientUnit;
  estimatedCost: number | null;
  notes: string | null;
}

export interface ItemRequirement {
  itemId: string;
  itemName: string;
  categoryName: string;
  personCount: number;
  recipeBaseServings: number;
  lines: RequirementLine[];
  estimatedTotalCost: number | null;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: IngredientUnit;
  costPerUnit: string | null;
  notes: string | null;
}

export async function fetchCategories(): Promise<AdminCategory[]> {
  const { data } = await api.get("/admin/categories");
  return data;
}

export async function createCategory(params: { name: string; description?: string; displayOrder?: number }) {
  const { data } = await api.post("/admin/categories", params);
  return data as AdminCategory;
}

export async function updateCategory(
  categoryId: string,
  params: { name?: string; description?: string; displayOrder?: number },
) {
  const { data } = await api.patch(`/admin/categories/${categoryId}`, params);
  return data as AdminCategory;
}

export async function deleteCategory(categoryId: string) {
  await api.delete(`/admin/categories/${categoryId}`);
}

export async function fetchItems(categoryId: string): Promise<AdminItem[]> {
  const { data } = await api.get(`/admin/categories/${categoryId}/items`);
  return data;
}

export async function createItem(
  categoryId: string,
  params: { name: string; cuisine?: string; costPerPlate: number },
) {
  const { data } = await api.post(`/admin/categories/${categoryId}/items`, params);
  return data as AdminItem;
}

export async function updateItem(
  itemId: string,
  params: { name?: string; cuisine?: string; costPerPlate?: number },
) {
  const { data } = await api.patch(`/admin/categories/items/${itemId}`, params);
  return data as AdminItem;
}

export async function deleteItem(itemId: string) {
  await api.delete(`/admin/categories/items/${itemId}`);
}

export async function fetchRecipe(itemId: string): Promise<Recipe> {
  const { data } = await api.get(`/admin/recipes/items/${itemId}`);
  return data;
}

export async function saveRecipe(
  itemId: string,
  payload: {
    recipeBaseServings: number;
    lines: { ingredientName: string; quantity: number; unit: IngredientUnit; notes?: string | null }[];
  },
): Promise<Recipe> {
  const { data } = await api.put(`/admin/recipes/items/${itemId}`, payload);
  return data;
}

export async function calculateRequirement(itemId: string, personCount: number): Promise<ItemRequirement> {
  const { data } = await api.post(`/admin/recipes/items/${itemId}/requirement`, { personCount });
  return data;
}

export async function calculatePlan(payload: {
  personCount: number;
  items: { itemId: string }[];
}): Promise<{ perItem: ItemRequirement[]; shoppingList: RequirementLine[]; estimatedTotalCost: number | null }> {
  const { data } = await api.post("/admin/recipes/plan", payload);
  return data;
}

export async function fetchIngredients(): Promise<Ingredient[]> {
  const { data } = await api.get("/admin/ingredients");
  return data;
}

export async function createIngredient(params: {
  name: string;
  unit: IngredientUnit;
  costPerUnit?: number | null;
}): Promise<Ingredient> {
  const { data } = await api.post("/admin/ingredients", params);
  return data;
}

export async function updateIngredient(
  ingredientId: string,
  params: { name?: string; unit?: IngredientUnit; costPerUnit?: number | null },
): Promise<Ingredient> {
  const { data } = await api.patch(`/admin/ingredients/${ingredientId}`, params);
  return data;
}

export async function deleteIngredient(ingredientId: string) {
  await api.delete(`/admin/ingredients/${ingredientId}`);
}

