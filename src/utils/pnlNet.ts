import { formatMoneyIN } from "@/utils/formatNumber";

export function netPnl(
  gross: number | null | undefined,
  charges: number | null | undefined
): number | null {
  if (gross == null || Number.isNaN(Number(gross))) return null;
  const cost = charges != null && !Number.isNaN(Number(charges)) ? Number(charges) : 0;
  return Number(gross) - cost;
}

export function netPnlTip(
  gross: number | null | undefined,
  charges: number | null | undefined
): string {
  const g = gross != null && !Number.isNaN(Number(gross)) ? Number(gross) : 0;
  const cost = charges != null && !Number.isNaN(Number(charges)) ? Number(charges) : 0;
  return `Gross: ₹${formatMoneyIN(g)} Charges: ₹${formatMoneyIN(-Math.abs(cost))}`;
}
