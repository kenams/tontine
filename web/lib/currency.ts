export const SUPPORTED_CURRENCIES = [
  { code: "XOF", label: "Franc CFA BCEAO", region: "Afrique de l'Ouest", zeroDecimal: true },
  { code: "XAF", label: "Franc CFA BEAC", region: "Afrique centrale", zeroDecimal: true },
  { code: "EUR", label: "Euro", region: "Europe", zeroDecimal: false },
  { code: "USD", label: "Dollar US", region: "Global", zeroDecimal: false },
  { code: "GBP", label: "Livre sterling", region: "Royaume-Uni", zeroDecimal: false },
  { code: "CAD", label: "Dollar canadien", region: "Canada", zeroDecimal: false },
  { code: "AUD", label: "Dollar australien", region: "Australie", zeroDecimal: false },
  { code: "NGN", label: "Naira", region: "Nigeria", zeroDecimal: false },
  { code: "GHS", label: "Cedi", region: "Ghana", zeroDecimal: false },
  { code: "KES", label: "Shilling kenyan", region: "Kenya", zeroDecimal: false },
  { code: "ZAR", label: "Rand", region: "Afrique du Sud", zeroDecimal: false },
  { code: "MAD", label: "Dirham marocain", region: "Maroc", zeroDecimal: false },
  { code: "AED", label: "Dirham EAU", region: "Emirats", zeroDecimal: false },
  { code: "INR", label: "Roupie indienne", region: "Inde", zeroDecimal: false },
  { code: "JPY", label: "Yen", region: "Japon", zeroDecimal: true },
  { code: "BRL", label: "Real bresilien", region: "Bresil", zeroDecimal: false }
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]["code"];

export const currencyCodes = SUPPORTED_CURRENCIES.map((currency) => currency.code) as [
  CurrencyCode,
  ...CurrencyCode[]
];

export const defaultCurrency: CurrencyCode = "XOF";

export function isSupportedCurrency(value: string): value is CurrencyCode {
  return SUPPORTED_CURRENCIES.some((currency) => currency.code === value);
}

export function isZeroDecimalCurrency(currency: string) {
  return SUPPORTED_CURRENCIES.some((item) => item.code === currency && item.zeroDecimal);
}

export function amountToMinorUnits(amount: number, currency: string) {
  if (!Number.isFinite(amount)) return 0;
  return Math.round(isZeroDecimalCurrency(currency) ? amount : amount * 100);
}

export function amountFromMinorUnits(amountMinor: number, currency: string) {
  return isZeroDecimalCurrency(currency) ? amountMinor : amountMinor / 100;
}

export function currencyLabel(code: string) {
  return SUPPORTED_CURRENCIES.find((currency) => currency.code === code)?.label ?? code;
}
