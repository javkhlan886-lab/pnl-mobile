export function fmt(n: number | undefined | null, currency = "₮"): string {
  const value = Math.round(Number(n ?? 0));
  return `${currency}${value.toLocaleString("en-US")}`;
}

export function formatDate(d: string | undefined | null): string {
  if (!d) return "";
  return d.slice(0, 10);
}
