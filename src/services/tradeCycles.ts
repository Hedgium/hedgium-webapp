import { authFetch } from "@/utils/api";
import type {
  TradeCycleAllocationSummary,
  TradeCycleAllocationSummaryResponse,
  TradeCycleListResponse,
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

export async function fetchTradeCycles(
  page = 1,
  pageSize = 50
): Promise<TradeCycleListResponse> {
  const res = await authFetch(`trade-cycles/?page=${page}&page_size=${pageSize}`);
  if (!res.ok) {
    throw new Error("Failed to fetch trade cycles");
  }
  return res.json() as Promise<TradeCycleListResponse>;
}

export async function activateTradeCycle(cycleId: number): Promise<void> {
  const res = await authFetch(`trade-cycles/activate-trade/${cycleId}/`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error("Failed to activate trade cycle");
  }
}
