import { authFetch } from "@/utils/api";

export const NEAR_ADJUSTMENT_ACTIONS = [
  { action: "near_ce_itm_shift", label: "Call ITM shift" },
  { action: "near_pe_itm_shift", label: "Put ITM shift" },
  { action: "near_ce_otm_shift", label: "Call OTM shift" },
  { action: "near_pe_otm_shift", label: "Put OTM shift" },
  { action: "near_short_pos_delta", label: "Short positive delta" },
  { action: "near_short_neg_delta", label: "Short negative delta" },
  { action: "near_long_pos_delta", label: "Long positive delta" },
  { action: "near_long_neg_delta", label: "Long negative delta" },
] as const;

export const FAR_ADJUSTMENT_ACTIONS = [
  { action: "far_ce_itm_hedge", label: "Call ITM hedge" },
  { action: "far_ce_otm_hedge", label: "Call OTM hedge" },
  { action: "far_pe_itm_hedge", label: "Put ITM hedge" },
  { action: "far_pe_otm_hedge", label: "Put OTM hedge" },
] as const;

export type ProposeAdjustmentAction =
  | (typeof NEAR_ADJUSTMENT_ACTIONS)[number]["action"]
  | (typeof FAR_ADJUSTMENT_ACTIONS)[number]["action"];

export interface ProposedAdjustmentLeg {
  leg_index: number;
  action: string;
  instrument: string;
  quantity: number;
  price: number | null;
  order_type: string;
  exchange: string;
  lot_size: number;
  token?: string | number | null;
}

export interface ProposeAdjustmentMeta {
  underlying: string;
  expiry: string | null;
  mode: string;
  spot: number;
  warnings?: string[];
}

export interface ProposeAdjustmentResponse {
  title: string | null;
  notes: string | null;
  auto_trade: boolean;
  legs: ProposedAdjustmentLeg[];
  meta: ProposeAdjustmentMeta;
}

export type ProposeAdjustmentResult =
  | { ok: true; data: ProposeAdjustmentResponse }
  | { ok: false; message: string };

export type BookExpiryLabel = "near" | "far";

export interface BookExpiry {
  expiry: string;
  label: BookExpiryLabel | null;
  underlyings: string[];
}

export function formatBookExpiryDate(iso: string): string {
  const date = iso.slice(0, 10);
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return iso;
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const monthName = months[Number(month) - 1] ?? month;
  return `${day} ${monthName} ${year.slice(-2)}`;
}

export async function fetchStrategyBookExpiries(
  strategyId: number
): Promise<BookExpiry[]> {
  const res = await authFetch(
    `myadmin/strategies/${strategyId}/adjustments/book-expiries/`
  );
  const data = (await res.json().catch(() => ({}))) as {
    expiries?: BookExpiry[];
  };
  if (!res.ok || !Array.isArray(data.expiries)) return [];
  return data.expiries.filter((row) => typeof row?.expiry === "string" && row.expiry);
}

export async function proposeStrategyAdjustment(
  strategyId: number,
  action: ProposeAdjustmentAction,
  expiry?: string | null
): Promise<ProposeAdjustmentResult> {
  const payload: { action: ProposeAdjustmentAction; expiry?: string } = { action };
  if (expiry) payload.expiry = expiry;
  const res = await authFetch(`myadmin/strategies/${strategyId}/adjustments/propose/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as
    | ProposeAdjustmentResponse
    | { message?: string; detail?: string };
  if (!res.ok) {
    const err = data as { message?: string; detail?: string };
    return {
      ok: false,
      message: err.message || err.detail || "Failed to propose adjustment",
    };
  }
  return { ok: true, data: data as ProposeAdjustmentResponse };
}
