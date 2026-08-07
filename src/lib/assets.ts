import { apiFetch } from "./api";

export interface Asset {
  _id: string;
  name: string;
  code?: string;
  category: string;
  unitPrice: number;
  quantity: number;
  price: number;
  residualValue: number;
  lifespan: number;
  depMethod: "straight" | "declining";
  purchaseDate: string;
  assignedTo?: string;
  location?: string;
  status: "active" | "disposed" | "maintenance";
  currency?: string;
}

export type AssetInput = Omit<Asset, "_id" | "status"> & { status?: Asset["status"] };

export const ASSET_CATEGORIES = [
  "Тоног төхөөрөмж", "Тээврийн хэрэгсэл", "Программ хангамж",
  "Тавилга, эд хогшил", "Барилга, байгууламж", "Цахилгаан хэрэгсэл",
  "Нийлмэл хөрөнгө", "Бусад",
];

export const getAssets = () => apiFetch<Asset[]>("/assets");
export const createAsset = (data: AssetInput) => apiFetch<Asset>("/assets", { method: "POST", body: JSON.stringify(data) });
export const updateAsset = (id: string, data: Partial<AssetInput>) => apiFetch<Asset>(`/assets/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const disposeAsset = (id: string) => apiFetch<void>(`/assets/${id}`, { method: "DELETE" });

export function calcDepreciation(price: number, residual: number, lifespan: number, method: string, purchaseDate: string) {
  const depBase = Math.max(0, price - residual);
  const monthsElapsed = Math.max(0, (Date.now() - new Date(purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  let monthly = 0, yearly = 0, accumulated = 0;
  if (method === "straight") {
    yearly = depBase / Math.max(1, lifespan);
    monthly = yearly / 12;
    accumulated = Math.min(depBase, monthly * monthsElapsed);
  } else {
    const rate = 2 / Math.max(1, lifespan);
    yearly = price * rate;
    monthly = yearly / 12;
    accumulated = Math.min(depBase, price * (1 - Math.pow(1 - rate / 12, monthsElapsed)));
  }
  return {
    monthly: Math.round(monthly),
    yearly: Math.round(yearly),
    accumulated: Math.round(accumulated),
    currentValue: Math.max(residual, price - Math.round(accumulated)),
    depreciatedPct: price > 0 ? Math.round((accumulated / price) * 100) : 0,
  };
}
