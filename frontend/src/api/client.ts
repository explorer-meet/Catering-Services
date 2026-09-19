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

