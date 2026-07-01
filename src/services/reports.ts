import { authFetch } from "@/utils/api";
import type {
  AllocationSummary,
  MarginSnapshotRow,
  PnlPeriodSummary,
  ReportsScope,
  TradeCycleReportsResponse,
} from "@/types/reports";

function tradeCycleReportsPath(scope: ReportsScope): string {
  if (scope.mode === "admin") {
    return `profiles/${scope.profileId}/trade-cycle-reports/`;
  }
  return "trade-cycles/reports/";
}

function pnlPeriodPath(scope: ReportsScope): string {
  if (scope.mode === "admin") {
    return `positions/pnl/${scope.profileId}/`;
  }
  return "positions/pnl/";
}

function allocationSummaryPath(scope: ReportsScope): string {
  if (scope.mode === "admin") {
    return `profiles/${scope.profileId}/allocation-summary/`;
  }
  return "trade-cycles/allocation-summary/";
}

function marginSnapshotsPath(scope: ReportsScope): string {
  if (scope.mode === "admin") {
    return `profiles/${scope.profileId}/margin-snapshots/`;
  }
  return "profiles/margin-snapshots/";
}

function pnlSnapshotsPath(scope: ReportsScope): string {
  if (scope.mode === "admin") {
    return `profiles/${scope.profileId}/pnl-snapshots/`;
  }
  return "profiles/pnl-snapshots/";
}

export async function fetchTradeCycleReports(
  scope: ReportsScope,
  params: { page: number; pageSize: number }
): Promise<TradeCycleReportsResponse> {
  const search = new URLSearchParams({
    page: String(params.page),
    page_size: String(params.pageSize),
  });
  const res = await authFetch(`${tradeCycleReportsPath(scope)}?${search}`);
  if (!res.ok) {
    throw new Error("Failed to fetch reports");
  }
  return res.json() as Promise<TradeCycleReportsResponse>;
}

export async function fetchPnlPeriodSummary(scope: ReportsScope): Promise<PnlPeriodSummary | null> {
  const res = await authFetch(pnlPeriodPath(scope));
  if (!res.ok) return null;
  const data = (await res.json()) as { pnl_summary?: PnlPeriodSummary };
  return data.pnl_summary ?? null;
}

export async function fetchAllocationSummary(scope: ReportsScope): Promise<AllocationSummary | null> {
  const res = await authFetch(allocationSummaryPath(scope));
  if (!res.ok) return null;
  const data = (await res.json()) as { allocation_summary?: AllocationSummary };
  return data.allocation_summary ?? null;
}

export async function fetchMarginSnapshots(
  scope: ReportsScope,
  params: { dateFrom: string; dateTo: string }
): Promise<MarginSnapshotRow[]> {
  const search = new URLSearchParams({
    date_from: params.dateFrom,
    date_to: params.dateTo,
  });
  const res = await authFetch(`${marginSnapshotsPath(scope)}?${search}`);
  if (!res.ok) return [];
  const data = (await res.json()) as { results?: MarginSnapshotRow[] };
  return Array.isArray(data.results) ? data.results : [];
}

export async function fetchPnlSnapshots(
  scope: ReportsScope,
  params: { dateFrom: string; dateTo: string }
): Promise<unknown> {
  const search = new URLSearchParams({
    date_from: params.dateFrom,
    date_to: params.dateTo,
  });
  const res = await authFetch(`${pnlSnapshotsPath(scope)}?${search}`);
  if (!res.ok) return { results: [] };
  return res.json();
}

export async function fetchAccountCreatedAt(scope: ReportsScope): Promise<string | null> {
  if (scope.mode === "admin") {
    const res = await authFetch(`profiles/${scope.profileId}/`);
    if (!res.ok) return null;
    const profile = (await res.json()) as { created_at?: string };
    return profile.created_at ?? null;
  }
  const res = await authFetch("users/auth/me/");
  if (!res.ok) return null;
  const me = (await res.json()) as { account_created_at?: string };
  return me.account_created_at ?? null;
}

export async function refreshProfilePnlAsync(profileId: string): Promise<string> {
  const res = await authFetch(`positions/pnl/refresh/trades/async/${profileId}/`, {
    method: "POST",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error((data as { detail?: string }).detail || "Failed to refresh positions");
  }
  const taskId = (data as { task_id?: string }).task_id;
  if (!taskId) {
    throw new Error("Refresh task not started");
  }
  return taskId;
}

export async function pollTaskUntilDone(
  taskId: string,
  options?: { maxAttempts?: number; intervalMs?: number }
): Promise<"success" | "timeout" | "failure"> {
  const maxAttempts = options?.maxAttempts ?? 30;
  const intervalMs = options?.intervalMs ?? 2000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    const statusRes = await authFetch(`tasks/status/${taskId}/`);
    const statusData = await statusRes.json();
    if (!statusRes.ok) {
      throw new Error((statusData as { detail?: string }).detail || "Failed to check refresh status");
    }
    if (statusData.status === "SUCCESS") return "success";
    if (statusData.status === "FAILURE") {
      throw new Error((statusData as { result?: string }).result || "Refresh failed");
    }
  }
  return "timeout";
}
