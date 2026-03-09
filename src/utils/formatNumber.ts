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
