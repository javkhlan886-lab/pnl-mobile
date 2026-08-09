import { apiFetch } from "./api";

export interface Workforce {
  _id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  skills: string;
  rate: number;
  status: "active" | "inactive";
  note: string;
}

export type WorkforceInput = Omit<Workforce, "_id">;

export const getWorkforce = () => apiFetch<Workforce[]>("/workforce");
export const createWorkforce = (data: WorkforceInput) => apiFetch<Workforce>("/workforce", { method: "POST", body: JSON.stringify(data) });
export const updateWorkforce = (id: string, data: Partial<WorkforceInput>) => apiFetch<Workforce>(`/workforce/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteWorkforce = (id: string) => apiFetch<void>(`/workforce/${id}`, { method: "DELETE" });
