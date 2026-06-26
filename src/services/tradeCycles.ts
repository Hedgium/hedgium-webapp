import { authFetch } from "@/utils/api";
import type {
  TradeCycleAllocationSummary,
  TradeCycleAllocationSummaryResponse,
} from "@/types/tradeCycles";

let inflight: Promise<TradeCycleAllocationSummary> | null = null;

export async function fetchAllocationSummary(): Promise<TradeCycleAllocationSummary> {
  if (!inflight) {
    inflight = authFetch("trade-cycles/allocation-summary/")
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch trade cycle allocation summary");
        }
        const data = (await res.json()) as TradeCycleAllocationSummaryResponse;
        return data.allocation_summary;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export async function hasAssignedTradeCycles(): Promise<boolean> {
  const summary = await fetchAllocationSummary();
  return summary.all_time > 0;
}
