import axios from "axios";

export const api = axios.create({ baseURL: "/api" });

export interface EnquiryMessageResponse {
  enquiry: any;
  reply: string;
  isComplete: boolean;
}

export async function sendEnquiryMessage(params: {
  customerPhone: string;
  customerName: string;
  message: string;
  enquiryId?: string;
}): Promise<EnquiryMessageResponse> {
  const { data } = await api.post("/enquiries/message", { ...params, channel: "WEBSITE" });
  return data;
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

export async function confirmBooking(params: {
  quotationId: string;
  contactPerson: string;
  contactPhone: string;
}) {
  const { data } = await api.post("/bookings/confirm", params);
  return data;
}
