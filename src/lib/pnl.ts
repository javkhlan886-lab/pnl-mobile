import { apiFetch } from "./api";

export interface PnlRow {
  name?: string;
  note?: string;
  unitPrice?: number;
  quantity?: number;
  amount?: number;
}

export interface PnlRecord {
  _id: string;
  company?: string;
  period?: string;
  contractNumber?: string;
  status?: "active" | "pending" | "closed";
  currency: string;
  incomeRows: PnlRow[];
  expenseRows: PnlRow[];
  updatedAt?: string;
  owner?: { id: string; name: string; email: string };
}

export interface Summary {
  pnlIncome: number;
  pnlExpense: number;
  netProfit: number;
  margin: number;
  totalOperatingExpense: number;
  pnlCount: number;
  totalReceivable?: number;
  totalLoan?: number;
  netPosition?: number;
}

export const getPnlList = () => apiFetch<PnlRecord[]>("/pnl");

export const getSummary = () => apiFetch<Summary>("/summary");
