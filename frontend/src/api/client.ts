import axios from "axios";

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "");
const apiBaseUrl = configuredApiBaseUrl || (import.meta.env.PROD
  ? "https://catering-services-jruw.onrender.com/api"
  : "/api");

export const api = axios.create({ baseURL: apiBaseUrl });

// ---------- Auth ----------

const TOKEN_KEY = "cateringai.owner.token";

export type UserRole = "OWNER" | "MANAGER" | "ACCOUNTANT";

export const USER_ROLES: UserRole[] = ["OWNER", "MANAGER", "ACCOUNTANT"];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  OWNER: "Owner",
  MANAGER: "Manager",
  ACCOUNTANT: "Accountant",
};

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: string | null;
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/// A 401 on any admin call means the session is gone — clear it and let the app show the login screen
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && getAuthToken()) {
      setAuthToken(null);
      window.dispatchEvent(new Event("cateringai:unauthorized"));
    }
    return Promise.reject(error);
  },
);

export async function login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const { data } = await api.post("/auth/login", { email, password });
  return data;
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const { data } = await api.get("/auth/me");
  return data;
}

export async function changePassword(currentPassword: string, newPassword: string) {
  await api.post("/auth/change-password", { currentPassword, newPassword });
}

export async function fetchUsers(): Promise<AuthUser[]> {
  const { data } = await api.get("/admin/users");
  return data;
}

export async function createUser(params: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}): Promise<AuthUser> {
  const { data } = await api.post("/admin/users", params);
  return data;
}

export async function updateUser(
  userId: string,
  params: { name?: string; role?: UserRole; isActive?: boolean; password?: string },
): Promise<AuthUser> {
  const { data } = await api.patch(`/admin/users/${userId}`, params);
  return data;
}

export async function deleteUser(userId: string) {
  await api.delete(`/admin/users/${userId}`);
}

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

// ---------- Owner / admin: vendors & accounts ----------

export type VendorCategory =
  | "VEGETABLES"
  | "GROCERY"
  | "DAIRY"
  | "BAKERY"
  | "MEAT"
  | "BEVERAGES"
  | "EQUIPMENT"
  | "DECORATION"
  | "STAFFING"
  | "TRANSPORT"
  | "OTHER";

export const VENDOR_CATEGORIES: VendorCategory[] = [
  "VEGETABLES",
  "GROCERY",
  "DAIRY",
  "BAKERY",
  "MEAT",
  "BEVERAGES",
  "EQUIPMENT",
  "DECORATION",
  "STAFFING",
  "TRANSPORT",
  "OTHER",
];

export const VENDOR_CATEGORY_LABELS: Record<VendorCategory, string> = {
  VEGETABLES: "Vegetables",
  GROCERY: "Grocery",
  DAIRY: "Dairy",
  BAKERY: "Bakery",
  MEAT: "Meat",
  BEVERAGES: "Beverages",
  EQUIPMENT: "Equipment",
  DECORATION: "Decoration",
  STAFFING: "Staffing",
  TRANSPORT: "Transport",
  OTHER: "Other",
};

export type VendorEntryType = "PURCHASE" | "PAYMENT" | "CREDIT_NOTE" | "OPENING_BALANCE";
export type PaymentMode = "CASH" | "UPI" | "BANK_TRANSFER" | "CHEQUE" | "CARD" | "OTHER";

export const PAYMENT_MODES: PaymentMode[] = ["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "CARD", "OTHER"];

export const PAYMENT_MODE_LABELS: Record<PaymentMode, string> = {
  CASH: "Cash",
  UPI: "UPI",
  BANK_TRANSFER: "Bank transfer",
  CHEQUE: "Cheque",
  CARD: "Card",
  OTHER: "Other",
};

export interface Vendor {
  id: string;
  name: string;
  category: VendorCategory;
  contactPerson: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  gstNumber: string | null;
  paymentTerms: string | null;
  notes: string | null;
  isActive: boolean;
  bankName: string | null;
  accountName: string | null;
  accountNumber: string | null;
  ifscCode: string | null;
  upiId: string | null;
  openingBalance: string | number;
}

export interface VendorListRow extends Vendor {
  balance: number;
  entryCount: number;
}

export interface LedgerRow {
  id: string;
  type: VendorEntryType;
  entryDate: string;
  amount: number;
  debit: number;
  credit: number;
  description: string | null;
  referenceNo: string | null;
  paymentMode: PaymentMode | null;
  balance: number;
}

export interface VendorLedger {
  vendor: Vendor;
  openingBalance: number;
  entries: LedgerRow[];
  totalPurchases: number;
  totalPaid: number;
  totalCredits: number;
  balance: number;
}

export interface VendorSummary {
  vendorCount: number;
  activeCount: number;
  totalPayable: number;
  totalAdvance: number;
}

export type VendorInput = Omit<Vendor, "id" | "openingBalance"> & { openingBalance: number };

export async function fetchVendors(params?: { search?: string; category?: VendorCategory }): Promise<VendorListRow[]> {
  const { data } = await api.get("/admin/vendors", { params });
  return data;
}

export async function fetchVendorSummary(): Promise<VendorSummary> {
  const { data } = await api.get("/admin/vendors/summary");
  return data;
}

export async function fetchVendor(vendorId: string): Promise<Vendor> {
  const { data } = await api.get(`/admin/vendors/${vendorId}`);
  return data;
}

export async function createVendor(params: Partial<VendorInput>): Promise<Vendor> {
  const { data } = await api.post("/admin/vendors", params);
  return data;
}

export async function updateVendor(vendorId: string, params: Partial<VendorInput>): Promise<Vendor> {
  const { data } = await api.patch(`/admin/vendors/${vendorId}`, params);
  return data;
}

export async function deleteVendor(vendorId: string) {
  await api.delete(`/admin/vendors/${vendorId}`);
}

export async function fetchVendorLedger(vendorId: string): Promise<VendorLedger> {
  const { data } = await api.get(`/admin/vendors/${vendorId}/ledger`);
  return data;
}

export async function addLedgerEntry(
  vendorId: string,
  params: {
    type: VendorEntryType;
    entryDate: string;
    amount: number;
    description?: string | null;
    referenceNo?: string | null;
    paymentMode?: PaymentMode | null;
  },
): Promise<VendorLedger> {
  const { data } = await api.post(`/admin/vendors/${vendorId}/ledger`, params);
  return data;
}

export async function deleteLedgerEntry(entryId: string): Promise<VendorLedger> {
  const { data } = await api.delete(`/admin/vendors/entries/${entryId}`);
  return data;
}

// ---------- Owner / admin: B2B orders ----------

export type B2BDirection = "OUTGOING" | "INCOMING";
export type B2BOrderStatus = "DRAFT" | "CONFIRMED" | "IN_PROGRESS" | "DELIVERED" | "CANCELLED";

export const B2B_STATUSES: B2BOrderStatus[] = ["DRAFT", "CONFIRMED", "IN_PROGRESS", "DELIVERED", "CANCELLED"];

export const B2B_STATUS_LABELS: Record<B2BOrderStatus, string> = {
  DRAFT: "Draft",
  CONFIRMED: "Confirmed",
  IN_PROGRESS: "In progress",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export interface B2BOrderItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

export interface B2BOrderPayment {
  id: string;
  paidOn: string;
  amount: number;
  mode: PaymentMode | null;
  referenceNo: string | null;
  notes: string | null;
}

export interface B2BOrder {
  id: string;
  orderNumber: string;
  direction: B2BDirection;
  status: B2BOrderStatus;
  partnerName: string;
  partnerPhone: string | null;
  partnerGst: string | null;
  vendorId: string | null;
  vendor: { id: string; name: string; phone: string } | null;
  eventName: string;
  eventDate: string;
  eventTime: string | null;
  venue: string | null;
  paxCount: number;
  subtotal: number;
  otherCharges: number;
  taxPercent: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  notes: string | null;
  items: B2BOrderItem[];
  payments: B2BOrderPayment[];
}

export interface B2BSummary {
  outgoing: { orderCount: number; totalValue: number; outstanding: number };
  incoming: { orderCount: number; totalValue: number; outstanding: number };
}

export interface B2BOrderInput {
  direction: B2BDirection;
  status: B2BOrderStatus;
  partnerName: string;
  partnerPhone?: string | null;
  partnerGst?: string | null;
  vendorId?: string | null;
  eventName: string;
  eventDate: string;
  eventTime?: string | null;
  venue?: string | null;
  paxCount: number;
  otherCharges: number;
  taxPercent: number;
  notes?: string | null;
  items: { description: string; quantity: number; unit: string; rate: number }[];
}

export async function fetchB2BOrders(params?: {
  direction?: B2BDirection;
  status?: B2BOrderStatus;
  search?: string;
}): Promise<B2BOrder[]> {
  const { data } = await api.get("/admin/b2b-orders", { params });
  return data;
}

export async function fetchB2BSummary(): Promise<B2BSummary> {
  const { data } = await api.get("/admin/b2b-orders/summary");
  return data;
}

export async function createB2BOrder(payload: B2BOrderInput): Promise<B2BOrder> {
  const { data } = await api.post("/admin/b2b-orders", payload);
  return data;
}

export async function updateB2BOrder(orderId: string, payload: B2BOrderInput): Promise<B2BOrder> {
  const { data } = await api.put(`/admin/b2b-orders/${orderId}`, payload);
  return data;
}

export async function updateB2BStatus(orderId: string, status: B2BOrderStatus): Promise<B2BOrder> {
  const { data } = await api.patch(`/admin/b2b-orders/${orderId}/status`, { status });
  return data;
}

export async function deleteB2BOrder(orderId: string) {
  await api.delete(`/admin/b2b-orders/${orderId}`);
}

export async function addB2BPayment(
  orderId: string,
  payload: {
    paidOn: string;
    amount: number;
    mode?: PaymentMode | null;
    referenceNo?: string | null;
    notes?: string | null;
  },
): Promise<B2BOrder> {
  const { data } = await api.post(`/admin/b2b-orders/${orderId}/payments`, payload);
  return data;
}

export async function deleteB2BPayment(paymentId: string): Promise<B2BOrder> {
  const { data } = await api.delete(`/admin/b2b-orders/payments/${paymentId}`);
  return data;
}

