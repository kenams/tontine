import { amountFromMinorUnits, defaultCurrency } from "@/lib/currency";

export function money(cents: number, currency: string = defaultCurrency) {
  const amount = amountFromMinorUnits(cents, currency);
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "XOF" || currency === "XAF" || currency === "JPY" ? 0 : 2
  }).format(amount);
}

export function compactNumber(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

export function compactMoney(amountMinor: number, currency: string = defaultCurrency) {
  return `${compactNumber(amountFromMinorUnits(amountMinor, currency))} ${currency}`;
}

export function dateShort(date: Date | string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short"
  }).format(new Date(date));
}

export function dateTime(date: Date | string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(date));
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function pct(value: number, max: number) {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((value / max) * 100)));
}
