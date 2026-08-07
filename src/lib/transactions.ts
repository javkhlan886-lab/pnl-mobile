import { apiFetch } from "./api";

export interface Transaction {
  _id: string;
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  contractNumber?: string;
  note?: string;
  currency?: string;
  status?: string;
}

export interface TransactionListResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  totalPages: number;
  summary: { totalIncome: number; totalExpense: number; incomeCount: number; expenseCount: number };
}

export type TransactionInput = Omit<Transaction, "_id">;

export const CATEGORIES_INCOME = ["Борлуулалт", "Зээл буцаалт", "Хүүгийн орлого", "Бусад орлого"];
export const CATEGORIES_EXPENSE = ["Цалин", "НД / Татвар", "Түрээс", "Тээвэр", "Материал", "Татвар", "Зээл", "Эмчилгээ", "Офис", "Бусад"];

export function getTransactions(params?: { page?: number; limit?: number; type?: string; search?: string }) {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.type) q.set("type", params.type);
  if (params?.search) q.set("search", params.search);
  const qs = q.toString();
  return apiFetch<TransactionListResponse>(`/transactions${qs ? `?${qs}` : ""}`);
}

export const createTransaction = (data: TransactionInput) =>
  apiFetch<Transaction>("/transactions", { method: "POST", body: JSON.stringify(data) });

export const updateTransaction = (id: string, data: Partial<TransactionInput>) =>
  apiFetch<Transaction>(`/transactions/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteTransaction = (id: string) =>
  apiFetch<void>(`/transactions/${id}`, { method: "DELETE" });
