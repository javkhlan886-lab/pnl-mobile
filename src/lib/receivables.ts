import { apiFetch } from "./api";

export interface Receivable {
  _id: string;
  type: "receivable" | "loan";
  counterparty: string;
  unitPrice: number;
  quantity: number;
  amount: number;
  dueDate?: string;
  interestRate?: number;
  status: "current" | "near" | "overdue" | "paid";
  note?: string;
}

export type ReceivableInput = Omit<Receivable, "_id">;

export const getReceivables = () => apiFetch<Receivable[]>("/receivables");
export const createReceivable = (data: ReceivableInput) => apiFetch<Receivable>("/receivables", { method: "POST", body: JSON.stringify(data) });
export const updateReceivable = (id: string, data: Partial<ReceivableInput>) => apiFetch<Receivable>(`/receivables/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteReceivable = (id: string) => apiFetch<void>(`/receivables/${id}`, { method: "DELETE" });
