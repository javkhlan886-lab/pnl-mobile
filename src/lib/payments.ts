import { apiFetch } from "./api";

export interface PaymentStatus {
  paidUntil: string | null;
  isActive: boolean;
  priceMnt: number;
  configured: boolean;
}

export interface CheckoutResponse {
  paymentIntentId: string;
  status: string;
  clientSecret: string;
  nextAction: unknown;
}

export interface RefreshResponse {
  status: string;
  isActive: boolean;
  paidUntil: string | null;
}

export const getPaymentStatus = () => apiFetch<PaymentStatus>("/payments/status");

export const startCheckout = () => apiFetch<CheckoutResponse>("/payments/checkout", { method: "POST" });

export const refreshCheckout = (paymentIntentId: string) =>
  apiFetch<RefreshResponse>(`/payments/${paymentIntentId}/refresh`, { method: "POST" });

export interface QrDeeplink {
  name: string;
  description: string;
  logo: string;
  link: string;
}

export interface QrAction {
  text: string;
  imageUrl: string;
  deeplinks: QrDeeplink[];
}

/** QPay-style QR next_action: {type:"qr", qr:{text, image_url, deeplinks}}. */
export function getQrAction(nextAction: unknown): QrAction | null {
  if (!nextAction || typeof nextAction !== "object") return null;
  const na = nextAction as { type?: unknown; qr?: unknown };
  if (na.type !== "qr" || !na.qr || typeof na.qr !== "object") return null;
  const qr = na.qr as Record<string, unknown>;
  if (typeof qr.image_url !== "string") return null;
  return {
    text: typeof qr.text === "string" ? qr.text : "",
    imageUrl: qr.image_url,
    deeplinks: Array.isArray(qr.deeplinks) ? (qr.deeplinks as QrDeeplink[]) : [],
  };
}

/** Fallback for non-QR next_action shapes (e.g. hosted redirect) — pull out a plain URL. */
export function findActionUrl(nextAction: unknown): string | null {
  if (!nextAction || typeof nextAction !== "object") return null;
  const na = nextAction as Record<string, unknown>;
  if (na.type === "qr") return null;
  for (const value of Object.values(na)) {
    if (typeof value === "string" && /^https?:\/\//.test(value)) return value;
    if (value && typeof value === "object") {
      const nested = findActionUrl(value);
      if (nested) return nested;
    }
  }
  return null;
}

export function daysLeft(paidUntil: string | null): number {
  if (!paidUntil) return 0;
  return Math.max(0, Math.ceil((new Date(paidUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}
