import { apiFetch } from "./api";

export interface Expense {
  _id: string;
  type: "office" | "other";
  category: string;
  description: string;
  unitPrice: number;
  quantity: number;
  amount: number;
  date: string;
  status: "approved" | "pending" | "rejected";
  note?: string;
}

export type ExpenseInput = Omit<Expense, "_id">;

export const OFFICE_CATS = ["Оффис", "Тоног төхөөрөмж", "Цахилгаан, интернет", "Тээвэр, шатахуун", "Татвар, хураамж", "Бусад"];
export const OTHER_CATS = ["Маркетинг", "Аялал, томилолт", "Сургалт", "Хуулийн зардал", "Эрүүл мэндийн зардал", "Бусад"];

export const getExpenses = () => apiFetch<Expense[]>("/expenses");
export const createExpense = (data: ExpenseInput) => apiFetch<Expense>("/expenses", { method: "POST", body: JSON.stringify(data) });
export const updateExpense = (id: string, data: Partial<ExpenseInput>) => apiFetch<Expense>(`/expenses/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteExpense = (id: string) => apiFetch<void>(`/expenses/${id}`, { method: "DELETE" });
