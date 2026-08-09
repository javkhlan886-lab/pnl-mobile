import { apiFetch } from "./api";

export interface Partner {
  _id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  offering: string;
  priceInfo: string;
  collaboration: string;
  status: "active" | "inactive";
  note: string;
}

export type PartnerInput = Omit<Partner, "_id">;

export const getPartners = () => apiFetch<Partner[]>("/partners");
export const createPartner = (data: PartnerInput) => apiFetch<Partner>("/partners", { method: "POST", body: JSON.stringify(data) });
export const updatePartner = (id: string, data: Partial<PartnerInput>) => apiFetch<Partner>(`/partners/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deletePartner = (id: string) => apiFetch<void>(`/partners/${id}`, { method: "DELETE" });
