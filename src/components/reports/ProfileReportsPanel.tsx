"use client";

import React, { useEffect, useState, useCallback, useMemo, type ReactNode } from "react";
import {
  Loader2,
  TrendingUp,
  Briefcase,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Wallet,
  ChevronDown,
  ChevronUp,
  Layers,
  ArrowRight,
  RotateCw,
} from "lucide-react";
import {
  ReportsMarginChart,
  ReportsPnlMonthlyBarChart,
  getChartDateRange,
  getPnlBarChartDateRange,
  aggregateMarginSnapshots,
  buildPnlMonthlyBars,
  parsePnlSnapshotsResponse,
} from "@/components/reports/ReportCharts";
import type { ChartPeriod, PnlSnapshotRow } from "@/components/reports/ReportCharts";
import PnlSummarySection from "@/components/reports/PnlSummarySection";
import AllocationSummarySection from "@/components/reports/AllocationSummarySection";
import NetPnlWithCosts, { e2NetPnl } from "@/components/reports/NetPnlWithCosts";
import { authFetch } from "@/utils/api";
import PositionsTable, { type Position } from "@/components/positions/PositionsTable";
import ReportsSummarySkeleton from "@/components/skeletons/ReportsSummarySkeleton";
import ReportsListSkeleton from "@/components/skeletons/ReportsListSkeleton";
import ReportsChartSkeleton from "@/components/skeletons/ReportsChartSkeleton";
import useAlert from "@/hooks/useAlert";
import {
  fetchAccountCreatedAt,
  fetchAllocationSummary,
  fetchE2PnlSummary,
  fetchMarginSnapshots,
  fetchPnlSnapshots,
  fetchTradeCycleReports,
  pollTaskUntilDone,
  refreshProfilePnlAsync,
} from "@/services/reports";
import type {
  AllocationSummary,
  E2PnlSummary,
  ReportsScope,
  TradeCycleReportsResponse,
} from "@/types/reports";

type CycleDetail = {
  positions: Position[];
  totals: { pnl_total?: number };
  error?: boolean;
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function stateChipClass(state: string): string {
  const u = state.toUpperCase();
  if (u === "ADJUSTED" || u === "COMPLETED") {
    return "border-success/35 bg-success/10 text-success";
  }
  if (u === "CLOSED" || u === "STOPPED") {
    return "border-error/30 bg-error/10 text-error";
  }
  if (u === "NEW" || u === "ACTIVATED" || u === "PENDING") {
    return "border-warning/35 bg-warning/10 text-warning";
  }
  return "border-base-300/70 bg-base-200/50 text-base-content/80";
}

export interface ProfileReportsPanelProps {
  scope: ReportsScope;
  header?: ReactNode;
}

export default function ProfileReportsPanel({ scope, header }: ProfileReportsPanelProps) {
  const alert = useAlert();
  const adminProfileId = scope.mode === "admin" ? scope.profileId : "";
  const stableScope = useMemo((): ReportsScope => {
    if (scope.mode === "admin") {
      return { mode: "admin", profileId: adminProfileId };
    }
    return { mode: "client" };
  }, [scope.mode, adminProfileId]);
  const isAdmin = stableScope.mode === "admin";
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [pnlSummary, setPnlSummary] = useState<E2PnlSummary | null>(null);
  const [allocationSummary, setAllocationSummary] = useState<AllocationSummary | null>(null);
  const [reportsData, setReportsData] = useState<TradeCycleReportsResponse | null>(null);
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>("daily");
  const [marginSnapshots, setMarginSnapshots] = useState<
    { snapshot_date: string; net: number; available?: number; utilised?: number }[]
  >([]);
  const [pnlSnapshots, setPnlSnapshots] = useState<PnlSnapshotRow[]>([]);
  const [accountCreatedAt, setAccountCreatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingReports, setLoadingReports] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [refreshingPnl, setRefreshingPnl] = useState(false);
  const [expandedCycleId, setExpandedCycleId] = useState<number | null>(null);
  const [cycleDetails, setCycleDetails] = useState<Record<number, CycleDetail>>({});
  const [loadingDetails, setLoadingDetails] = useState<Record<number, boolean>>({});

  const fetchReports = useCallback(async () => {
    setLoadingReports(true);
    try {
      const data = await fetchTradeCycleReports(stableScope, { page, pageSize });
      setReportsData(data);
    } catch (e) {
      console.error("Error fetching reports:", e);
      setReportsData(null);
    } finally {
      setLoadingReports(false);
    }
  }, [stableScope, page]);

  const allowedPeriods = ((): ChartPeriod[] => {
    if (!accountCreatedAt) return ["daily"];
    const created = new Date(accountCreatedAt);
    const now = new Date();
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const twoYearsAgo = new Date(now);
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const periods: ChartPeriod[] = ["daily"];
    if (created <= sixMonthsAgo) periods.push("weekly");
    if (created <= twoYearsAgo) periods.push("monthly");
    return periods;
  })();
  const effectivePeriod = allowedPeriods.includes(chartPeriod) ? chartPeriod : "daily";
  const chartRange = getChartDateRange(effectivePeriod);

  const fetchChartsData = useCallback(async () => {
    setLoadingCharts(true);
    try {
      const pnlRange = getPnlBarChartDateRange();
      const [marginRows, pnlRaw] = await Promise.all([
        fetchMarginSnapshots(stableScope, { dateFrom: chartRange.from, dateTo: chartRange.to }),
        fetchPnlSnapshots(stableScope, { dateFrom: pnlRange.from, dateTo: pnlRange.to }),
      ]);
      setMarginSnapshots(marginRows);
      setPnlSnapshots(parsePnlSnapshotsResponse(pnlRaw));
    } catch (e) {
      console.error("Error fetching chart data:", e);
      setMarginSnapshots([]);
      setPnlSnapshots([]);
    } finally {
      setLoadingCharts(false);
    }
  }, [stableScope, chartRange.from, chartRange.to]);

  const loadSummaries = useCallback(async () => {
    setLoading(true);
    try {
      const [pnl, alloc, createdAt] = await Promise.all([
        fetchE2PnlSummary(stableScope),
        fetchAllocationSummary(stableScope),
        fetchAccountCreatedAt(stableScope),
      ]);
      setPnlSummary(pnl);
      setAllocationSummary(alloc);
      if (createdAt) setAccountCreatedAt(createdAt);
    } catch (e) {
      console.error("Error fetching summaries:", e);
    } finally {
      setLoading(false);
    }
  }, [stableScope]);

  const marginChartData = aggregateMarginSnapshots(marginSnapshots, effectivePeriod);
  const pnlChartData = buildPnlMonthlyBars(pnlSnapshots, 12);

  useEffect(() => {
    setPage(1);
    setCycleDetails({});
    setExpandedCycleId(null);
  }, [stableScope]);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    void fetchChartsData();
  }, [fetchChartsData]);

  useEffect(() => {
    if (accountCreatedAt != null && !allowedPeriods.includes(chartPeriod)) {
      setChartPeriod("daily");
    }
  }, [accountCreatedAt, allowedPeriods, chartPeriod]);

  useEffect(() => {
    void loadSummaries();
  }, [loadSummaries]);

  const summary = reportsData?.summary;
  const results = reportsData?.results ?? [];
  const reportNet = summary
    ? e2NetPnl(summary.pnl_total, summary.charges_total ?? 0)
    : null;

  async function handleRefreshPnl() {
    if (stableScope.mode !== "admin") return;
    setRefreshingPnl(true);
    try {
      alert.success("PnL refresh started");
      const taskId = await refreshProfilePnlAsync(stableScope.profileId);
      const outcome = await pollTaskUntilDone(taskId);
      if (outcome === "timeout") {
        alert.success("Refresh running in background");
        return;
      }
      alert.success("PnL refreshed successfully");
      await Promise.all([fetchReports(), loadSummaries(), fetchChartsData()]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to refresh PnL";
      alert.error(message);
    } finally {
      setRefreshingPnl(false);
    }
  }

  async function toggleCycleDetails(cycleId: number) {
    if (expandedCycleId === cycleId) {
      setExpandedCycleId(null);
      return;
    }
    setExpandedCycleId(cycleId);
    if (cycleDetails[cycleId] && !cycleDetails[cycleId].error) return;
    setLoadingDetails((prev) => ({ ...prev, [cycleId]: true }));
    try {
      const res = await authFetch(`trade-cycles/${cycleId}/details?load_all=true`);
      if (!res.ok) throw new Error("Failed to fetch details");
      const data = await res.json();
      const positions: Position[] = Array.isArray(data.positions) ? data.positions : [];
      const totals = data.totals && typeof data.totals === "object" ? data.totals : {};
      setCycleDetails((prev) => ({
        ...prev,
        [cycleId]: { positions, totals, error: false },
      }));
    } catch (e) {
      console.error("Error fetching cycle details:", e);
      setCycleDetails((prev) => ({
        ...prev,
        [cycleId]: { positions: [], totals: {}, error: true },
      }));
    } finally {
      setLoadingDetails((prev) => ({ ...prev, [cycleId]: false }));
    }
  }

  return (
    <div className="relative min-h-screen">
      <div className="relative mx-auto max-w-7xl space-y-10 px-4 py-8 md:px-8 md:py-10">
        {header}

       

        {loading ? (
          <ReportsSummarySkeleton />
        ) : (
          (pnlSummary || allocationSummary) && (
            <section className="space-y-8">
              {pnlSummary ? (
                <PnlSummarySection
                  pnlSummary={pnlSummary}
                  accountCreatedAt={accountCreatedAt}
                />
              ) : null}

              {allocationSummary ? (
                <AllocationSummarySection
                  allocationSummary={allocationSummary}
                  pnlInceptionDate={pnlSummary?.pnl_inception_date}
                  accountCreatedAt={accountCreatedAt}
                />
              ) : null}
            </section>
          )
        )}

        <section className="space-y-1">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary shrink-0" aria-hidden />
              <h2 className="text-xl font-semibold tracking-tight text-base-content md:text-2xl">Charts</h2>
            </div>
            <p className="max-w-xl text-sm text-base-content/70">
              Margin and PnL trends, then past trade cycles
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-base-content/80" id="report-chart-view-label">Chart view</span>
            <div className="join" role="group" aria-labelledby="report-chart-view-label">
              {allowedPeriods.map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={chartPeriod === p}
                  className={`btn btn-sm join-item rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${chartPeriod === p ? "btn-primary" : "btn-ghost border border-base-300/60"}`}
                  onClick={() => setChartPeriod(p)}
                >
                  {p === "daily" ? "Daily (1M)" : p === "weekly" ? "Weekly (6M)" : "Monthly (2Y)"}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-base-300/60 bg-base-100/80 p-4 md:p-6 backdrop-blur-sm">
              <div className="mb-4 flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" aria-hidden />
                <h3 className="text-lg font-semibold">
                  Margin
                  {effectivePeriod === "daily" && " (1 month)"}
                  {effectivePeriod === "weekly" && " (6 months, weekly avg)"}
                  {effectivePeriod === "monthly" && " (2 years, monthly avg)"}
                </h3>
              </div>
              {loadingCharts ? (
                <ReportsChartSkeleton />
              ) : marginChartData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-base-content/70">
                  No margin data in selected range
                </div>
              ) : (
                <div className="h-64">
                  <ReportsMarginChart data={marginChartData} period={effectivePeriod} />
                </div>
              )}
            </div>
            <div className="rounded-2xl border border-base-300/60 bg-base-100/80 p-4 md:p-6 backdrop-blur-sm">
              <div className="mb-4 space-y-1">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" aria-hidden />
                  <h3 className="text-lg font-semibold">E2 PnL (monthly)</h3>
                </div>
                {/* <p
                  id="pnl-monthly-chart-desc"
                  className="text-xs leading-relaxed text-base-content/70"
                >
                  Bars are month-on-month change in total PnL (daily snapshots). Summary cards use different rules—for example “last month” filters positions by when totals were last updated, not this chart’s change.
                </p> */}
              </div>
              {loadingCharts ? (
                <ReportsChartSkeleton />
              ) : pnlChartData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-base-content/70">
                  No PnL snapshot data yet
                </div>
              ) : (
                <div className="h-64" aria-describedby="pnl-monthly-chart-desc">
                  <ReportsPnlMonthlyBarChart data={pnlChartData} />
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary shrink-0" aria-hidden />
                <h3 className="text-xl font-semibold tracking-tight text-base-content md:text-2xl">
                  All trade cycles
                </h3>
              </div>
              <p className="max-w-xl text-sm text-base-content/70">
                Expand a row to see stored positions for that cycle. Net PnL shown is from the report
                aggregate.
              </p>
            </div>
            <div className="flex flex-wrap items-center md:justify-end gap-3">
              <span className="rounded-full border border-base-300/60 bg-base-200/40 px-3 py-1 text-xs font-medium tabular-nums text-base-content/70">
                {reportsData?.count != null ? `${results.length} on page · ${reportsData.count} total` : "—"}
              </span>
              {summary && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-semibold tabular-nums ${
                    (reportNet ?? 0) >= 0
                      ? "border-success/30 bg-success/10"
                      : "border-error/30 bg-error/10"
                  }`}
                >
                  Report total PnL
                  <NetPnlWithCosts
                    className="font-semibold"
                    dropdownLeft
                    gross={summary.pnl_total}
                    charges={summary.charges_total ?? 0}
                  />
                </span>
              )}
            </div>
          </div>

          {loadingReports ? (
            <ReportsListSkeleton />
          ) : results.length === 0 ? (
            <div className="rounded-xl border border-dashed border-base-300/70 bg-base-200/20 py-14 text-center">
              <Briefcase className="mx-auto mb-3 h-11 w-11 text-base-content/30" aria-hidden />
              <p className="font-medium text-base-content">No trade cycles</p>
              <p className="mt-1 text-sm text-base-content/70">Nothing in this report yet.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4">
                {results.map((cycle) => {
                  const expanded = expandedCycleId === cycle.id;
                  return (
                    <div
                      key={cycle.id}
                      className="group relative overflow-visible rounded-2xl border border-base-300/70 bg-base-100/95 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25"
                    >
                      <div className="flex w-full flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between md:gap-4 md:p-6">
                        <button
                          type="button"
                          className="flex min-w-0 flex-1 items-start gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                          onClick={() => void toggleCycleDetails(cycle.id)}
                          aria-expanded={expanded}
                          aria-label={`${expanded ? "Collapse" : "Expand"} positions for ${cycle.name}`}
                        >
                          <span
                            className={`mt-0.5 cursor-pointer flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-base-300/60 bg-base-200/50 text-base-content/60 transition-colors group-hover:border-primary/30 group-hover:bg-base-200 ${expanded ? "text-primary" : ""}`}
                          >
                            {expanded ? (
                              <ChevronUp className="h-4 w-4" aria-hidden />
                            ) : (
                              <ChevronDown className="h-4 w-4" aria-hidden />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold leading-snug text-base-content md:text-lg">{cycle.name}</h4>
                            {cycle.description ? (
                              <p className="mt-0.5 line-clamp-2 text-sm text-base-content/70">{cycle.description}</p>
                            ) : null}
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center rounded-full border border-base-300/60 px-2 py-0.5 text-[11px] font-medium tabular-nums text-base-content/70">
                                #{cycle.id}
                              </span>
                              {isAdmin && cycle.strategy_name ? (
                                <span className="inline-flex max-w-[12rem] items-center truncate rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                                  {cycle.strategy_name}
                                </span>
                              ) : null}
                              <span className="text-xs text-base-content/70">{formatDate(cycle.created_at)}</span>
                              <span
                                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${stateChipClass(cycle.state)}`}
                              >
                                {cycle.state}
                              </span>
                              {cycle.sub_state ? (
                                <span className="truncate text-xs text-base-content/70">
                                  {cycle.sub_state}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </button>
                        <div className="flex shrink-0 flex-row items-center justify-between gap-3 border-t border-base-300/40 pt-3 md:flex-col md:items-end md:border-t-0 md:pt-0">
                          <NetPnlWithCosts
                            className="text-lg font-bold md:text-xl"
                            dropdownLeft
                            gross={cycle.pnl}
                            charges={cycle.charges ?? 0}
                          />
                          <button
                            type="button"
                            className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-primary"
                            onClick={() => void toggleCycleDetails(cycle.id)}
                            aria-expanded={expanded}
                          >
                            {expanded ? "Hide" : "Positions"}
                            <ArrowRight
                              className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-90" : ""}`}
                              aria-hidden
                            />
                          </button>
                        </div>
                      </div>
                      {expanded && (
                        <div className="border-t border-base-300/60 bg-gradient-to-b from-base-200/40 to-base-200/20 px-4 py-5 md:px-5">
                          {loadingDetails[cycle.id] ? (
                            <div className="flex items-center justify-center py-10">
                              <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden />
                            </div>
                          ) : cycleDetails[cycle.id] ? (
                            <div className="space-y-4">
                              {cycleDetails[cycle.id].error ? (
                                <p className="text-sm text-error" role="alert">
                                  Failed to load positions. Try again.
                                </p>
                              ) : (
                                <PositionsTable positions={cycleDetails[cycle.id].positions} />
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-base-content/70">No positions.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <div className="join border border-base-300/60">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm join-item gap-1 rounded-none border-0 first:rounded-l-lg last:rounded-r-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    disabled={!reportsData?.previous}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                    Previous
                  </button>
                  <span className="join-item flex items-center border-x border-base-300/60 bg-base-200/30 px-4 text-sm tabular-nums text-base-content/80">
                    Page {page}
                    {reportsData?.count != null &&
                      ` of ${Math.ceil(reportsData.count / pageSize) || 1}`}
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm join-item gap-1 rounded-none border-0 first:rounded-l-lg last:rounded-r-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    disabled={!reportsData?.next}
                    onClick={() => setPage((p) => p + 1)}
                    aria-label="Next page"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
