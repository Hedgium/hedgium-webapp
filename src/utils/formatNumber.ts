/**
 * Format a number as Indian convention (lakh, crore): 1,00,000 and 1,00,00,000.
 * No currency symbol — use for displaying money values in the UI.
 */
export function formatMoneyIN(
  value: number | null | undefined,
  options?: { decimals?: number; minDecimals?: number }
): string {
  if (value == null || Number.isNaN(value)) return "—";
  const decimals = options?.decimals ?? 2;
  const minDecimals = options?.minDecimals ?? 0;
  return value.toLocaleString("en-IN", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: minDecimals,
  });
}

function trimShortAmount(x: number): string {
  const abs = Math.abs(x);
  const decimals = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
  return x.toFixed(decimals).replace(/\.?0+$/, "");
}

/**
 * Short Indian-style amounts for charts: thousands as k, lakhs as L, crores as Cr.
 * Examples: 1500 → 1.5k, 1_00_000 → 1L, 2_50_000 → 2.5L, 1_00_00_000 → 1Cr
 */
export function formatIndianShort(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  if (value === 0) return "0";
  const sign = value < 0 ? "-" : "";
  const n = Math.abs(value);
  if (n < 1000) return sign + String(Math.round(n));
  const crore = 10000000;
  const lakh = 100000;
  if (n >= crore) {
    return sign + trimShortAmount(n / crore) + "Cr";
  }
  if (n >= lakh) {
    return sign + trimShortAmount(n / lakh) + "L";
  }
  return sign + trimShortAmount(n / 1000) + "k";
}
