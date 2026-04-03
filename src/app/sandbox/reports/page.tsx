"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  BarChart3,
  Layers,
  ArrowRight,
} from "lucide-react";
import SandboxPageShell from "@/components/sandbox/SandboxPageShell";
import { sandboxFetch } from "@/utils/sandboxApi";
import { formatMoneyIN } from "@/utils/formatNumber";
import PositionsTable, { type Position } from "@/components/positions/PositionsTable";
import ReportsSummarySkeleton from "@/components/skeletons/ReportsSummarySkeleton";
import ReportsListSkeleton from "@/components/skeletons/ReportsListSkeleton";
import ReportsChartSkeleton from "@/components/skeletons/ReportsChartSkeleton";
import {
  ReportsMarginChart,
  ReportsPnlMonthlyBarChart,
  getChartDateRange,
  getPnlBarChartDateRange,
  aggregateMarginSnapshots,
  buildPnlMonthlyBars,
  parseMarginSnapshotsResponse,
  parsePnlSnapshotsResponse,
  type ChartPeriod,
  type MarginSnapshot,
  type PnlSnapshotRow,
} from "@/components/reports/ReportCharts";
import { useSandboxStore } from "@/store/sandboxStore";

type PnlSummary = {
  all_time?: number;
  last_year?: number;
  last_month?: number;
  last_week?: number;
  today?: number;
};

type AllocationSummary = {
  all_time?: number;
  last_month?: number;
  last_week?: number;
  today?: number;
};

type TradeCycleReport = {
  id: number;
  name: string;
  description: string | null;
  state: string;
  sub_state: string;
  created_at: string;
  updated_at: string;
  pnl: number;
};

type ReportsResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: TradeCycleReport[];
  summary: { total_count: number; pnl_total: number };
};

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

export default function SandboxReportsPage() {
  const router = useRouter();
  const { sandboxPlan } = useSandboxStore();
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [pnlSummary, setPnlSummary] = useState<PnlSummary | null>(null);
  const [allocationSummary, setAllocationSummary] = useState<AllocationSummary | null>(null);
  const [reportsData, setReportsData] = useState<ReportsResponse | null>(null);
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>("daily");
  const [marginSnapshots, setMarginSnapshots] = useState<MarginSnapshot[]>([]);
  const [pnlSnapshots, setPnlSnapshots] = useState<PnlSnapshotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReports, setLoadingReports] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [expandedCycleId, setExpandedCycleId] = useState<number | null>(null);
  const [cycleDetails, setCycleDetails] = useState<Record<number, CycleDetail>>({});
  const [loadingDetails, setLoadingDetails] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!sandboxPlan) {
      router.replace("/sandbox");
      return;
    }
  }, [sandboxPlan, router]);

  const allowedPeriods: ChartPeriod[] = ["daily", "weekly", "monthly"];
  const effectivePeriod = allowedPeriods.includes(chartPeriod) ? chartPeriod : "daily";
  const chartRange = getChartDateRange(effectivePeriod);

  const fetchReports = useCallback(async () => {
    if (!sandboxPlan) return;
    setLoadingReports(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      const res = await sandboxFetch(`trade-cycles/reports/?${params}`, sandboxPlan);
      if (!res.ok) throw new Error("Failed to fetch reports");
      const data: ReportsResponse = await res.json();
      setReportsData(data);
    } catch (e) {
      console.error("Error fetching reports:", e);
      setReportsData(null);
    } finally {
      setLoadingReports(false);
    }
  }, [sandboxPlan, page]);

  const fetchChartsData = useCallback(async () => {
    if (!sandboxPlan) return;
    setLoadingCharts(true);
    try {
      const marginParams = new URLSearchParams();
      marginParams.set("date_from", chartRange.from);
      marginParams.set("date_to", chartRange.to);
      const pnlParams = new URLSearchParams();
      const pnlRange = getPnlBarChartDateRange();
      pnlParams.set("date_from", pnlRange.from);
      pnlParams.set("date_to", pnlRange.to);
      const [marginRes, pnlRes] = await Promise.all([
        sandboxFetch(`margin-snapshots/?${marginParams}`, sandboxPlan),
        sandboxFetch(`pnl-snapshots/?${pnlParams}`, sandboxPlan),
      ]);
      if (marginRes.ok) {
        const data: unknown = await marginRes.json();
        setMarginSnapshots(parseMarginSnapshotsResponse(data));
      } else setMarginSnapshots([]);
      if (pnlRes.ok) {
        const data: unknown = await pnlRes.json();
        setPnlSnapshots(parsePnlSnapshotsResponse(data));
      } else setPnlSnapshots([]);
    } catch (e) {
      console.error("Error fetching chart data:", e);
      setMarginSnapshots([]);
      setPnlSnapshots([]);
    } finally {
      setLoadingCharts(false);
    }
  }, [sandboxPlan, chartRange.from, chartRange.to]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    fetchChartsData();
  }, [fetchChartsData]);

  useEffect(() => {
    if (sandboxPlan) {
      (async () => {
        setLoading(true);
        try {
          const [pnlRes, allocRes] = await Promise.all([
            sandboxFetch("pnl-summary/", sandboxPlan),
            sandboxFetch("allocation-summary/", sandboxPlan),
          ]);
          if (pnlRes.ok) {
            const pnlData = await pnlRes.json();
            setPnlSummary({
              all_time: pnlData.pnl_summary?.all_time,
              last_month: pnlData.pnl_summary?.last_month,
              last_week: pnlData.pnl_summary?.last_week,
              today: pnlData.pnl_summary?.today,
            });
          }
          if (allocRes.ok) {
            const allocData = await allocRes.json();
            setAllocationSummary({
              all_time: allocData.allocation_summary?.all_time,
              last_month: allocData.allocation_summary?.last_month,
              last_week: allocData.allocation_summary?.last_week,
              today: allocData.allocation_summary?.today,
            });
          }
        } catch (e) {
          console.error("Error fetching summaries:", e);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [sandboxPlan]);

  const marginChartData = aggregateMarginSnapshots(marginSnapshots, effectivePeriod);
  const pnlChartData = buildPnlMonthlyBars(pnlSnapshots, 12);

  const summary = reportsData?.summary;
  const results = reportsData?.results ?? [];

  async function toggleCycleDetails(cycleId: number) {
    if (expandedCycleId === cycleId) {
      setExpandedCycleId(null);
      return;
    }
    setExpandedCycleId(cycleId);
    if (cycleDetails[cycleId] && !cycleDetails[cycleId].error) return;
    if (!sandboxPlan) return;
    setLoadingDetails((prev) => ({ ...prev, [cycleId]: true }));
    try {
      const res = await sandboxFetch(
        `trade-cycles/${cycleId}/details?load_all=true`,
        sandboxPlan
      );
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

  if (!sandboxPlan) return null;

  return (
    <SandboxPageShell>
      <div className="space-y-10">
        {loading ? (
          <ReportsSummarySkeleton />
        ) : (
          (pnlSummary || allocationSummary) && (
            <section className="space-y-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <h2 className="text-xl font-semibold tracking-tight text-base-content md:text-2xl">
                    At a glance
                  </h2>
                </div>
                <p className="max-w-xl text-sm text-base-content/55">
                  Sandbox PnL summary and allocated trade cycle counts by period.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10">
                {pnlSummary && (
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" aria-hidden />
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-base-content/80">
                        PnL summary
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(pnlSummary).map(([period, value]) => (
                        <div
                          key={period}
                          className="rounded-xl border border-base-300/50 bg-base-100/80 p-3"
                        >
                          <span className="text-xs text-base-content/55 uppercase">
                            {period.replace(/_/g, " ")}
                          </span>
                          <p
                            className={`mt-1 font-semibold tabular-nums ${
                              value != null && value >= 0 ? "text-success" : "text-error"
                            }`}
                          >
                            {formatMoneyIN(value ?? 0)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {allocationSummary && (
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" aria-hidden />
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-base-content/80">
                        Allocated trade cycles
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(allocationSummary).map(([period, value]) => (
                        <div
                          key={period}
                          className="rounded-xl border border-base-300/50 bg-base-100/80 p-3"
                        >
                          <span className="text-xs text-base-content/55 uppercase">
                            {period.replace(/_/g, " ")}
                          </span>
                          <p className="mt-1 font-semibold tabular-nums text-primary">
                            {value != null ? value : 0}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )
        )}

        <section className="space-y-1">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 shrink-0 text-primary" aria-hidden />
              <h2 className="text-xl font-semibold tracking-tight text-base-content md:text-2xl">Reports</h2>
            </div>
            <p className="max-w-xl text-sm text-base-content/55">
              Sandbox margin and PnL trends, then past trade cycles
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-base-content/80">Chart view</span>
            <div className="join">
              {allowedPeriods.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`btn btn-sm join-item rounded-lg ${chartPeriod === p ? "btn-primary" : "btn-ghost border border-base-300/60"}`}
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
                <div className="h-64 flex items-center justify-center text-base-content/60">
                  No margin data in selected range
                </div>
              ) : (
                <div className="h-64">
                  <ReportsMarginChart data={marginChartData} period={effectivePeriod} />
                </div>
              )}
            </div>
            <div className="rounded-2xl border border-base-300/60 bg-base-100/80 p-4 md:p-6 backdrop-blur-sm">
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" aria-hidden />
                <h3
                  className="text-lg font-semibold"
                  title="Bars are month-on-month change in total PnL (daily snapshots). Summary cards use different rules—for example “last month” filters positions by when totals were last updated, not this chart’s change."
                >
                  PnL (monthly)
                </h3>
              </div>
              {loadingCharts ? (
                <ReportsChartSkeleton />
              ) : pnlChartData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-base-content/60">
                  No PnL snapshot data yet
                </div>
              ) : (
                <div className="h-64">
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
                <Layers className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                <h3 className="text-xl font-semibold tracking-tight text-base-content md:text-2xl">
                  All trade cycles
                </h3>
              </div>
              <p className="max-w-xl text-sm text-base-content/55">
                Expand a row to see stored positions. PnL is from the report aggregate.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 md:justify-end">
              <span className="rounded-full border border-base-300/60 bg-base-200/40 px-3 py-1 text-xs font-medium tabular-nums text-base-content/70">
                {reportsData?.count != null
                  ? `${results.length} on page · ${reportsData.count} total`
                  : "—"}
              </span>
              {summary && (
                <span
                  className={`rounded-full border px-3 py-1 text-sm font-semibold tabular-nums ${
                    summary.pnl_total >= 0
                      ? "border-success/30 bg-success/10 text-success"
                      : "border-error/30 bg-error/10 text-error"
                  }`}
                >
                  Report total PnL {formatMoneyIN(summary?.pnl_total)}
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
              <p className="mt-1 text-sm text-base-content/55">Nothing in this report yet.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4">
                {results.map((cycle) => {
                  const expanded = expandedCycleId === cycle.id;
                  return (
                    <div
                      key={cycle.id}
                      className="group relative overflow-hidden rounded-2xl border border-base-300/70 bg-base-100/95 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25"
                    >
                      <button
                        type="button"
                        className="flex w-full flex-col gap-3 p-4 text-left md:flex-row md:items-center md:justify-between md:gap-4 md:p-6"
                        onClick={() => toggleCycleDetails(cycle.id)}
                        aria-expanded={expanded}
                      >
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          <span
                            className={`mt-0.5 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-base-300/60 bg-base-200/50 text-base-content/60 transition-colors group-hover:border-primary/30 group-hover:bg-base-200 ${expanded ? "text-primary" : ""}`}
                          >
                            {expanded ? (
                              <ChevronUp className="h-4 w-4" aria-hidden />
                            ) : (
                              <ChevronDown className="h-4 w-4" aria-hidden />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold leading-snug text-base-content md:text-lg">
                              {cycle.name}
                            </h4>
                            {cycle.description ? (
                              <p className="mt-0.5 line-clamp-2 text-sm text-base-content/55">
                                {cycle.description}
                              </p>
                            ) : null}
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center rounded-full border border-base-300/60 px-2 py-0.5 text-[11px] font-medium tabular-nums text-base-content/60">
                                #{cycle.id}
                              </span>
                              <span className="text-xs text-base-content/45">
                                {formatDate(cycle.created_at)}
                              </span>
                              <span
                                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${stateChipClass(cycle.state)}`}
                              >
                                {cycle.state}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-row items-center justify-between gap-3 border-t border-base-300/40 pt-3 md:flex-col md:items-end md:border-t-0 md:pt-0">
                          <div
                            className={`text-right text-lg font-bold tabular-nums md:text-xl ${
                              cycle.pnl >= 0 ? "text-success" : "text-error"
                            }`}
                          >
                            {formatMoneyIN(cycle.pnl)}
                          </div>
                          <span className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-primary">
                            {expanded ? "Hide" : "Positions"}
                            <ArrowRight
                              className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-90" : ""}`}
                              aria-hidden
                            />
                          </span>
                        </div>
                      </button>
                      {expanded && (
                        <div className="border-t border-base-300/60 bg-gradient-to-b from-base-200/40 to-base-200/20 px-4 py-5 md:px-5">
                          {loadingDetails[cycle.id] ? (
                            <div className="flex items-center justify-center py-10">
                              <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden />
                            </div>
                          ) : cycleDetails[cycle.id] ? (
                            <div className="space-y-4">
                              {cycleDetails[cycle.id].error ? (
                                <p className="text-sm text-error">Failed to load positions. Try again.</p>
                              ) : (
                                <>
                                  {typeof cycleDetails[cycle.id].totals?.pnl_total === "number" && (
                                    <p className="text-sm">
                                      Total PnL:{" "}
                                      <span
                                        className={
                                          cycleDetails[cycle.id].totals!.pnl_total >= 0
                                            ? "font-medium text-success"
                                            : "font-medium text-error"
                                        }
                                      >
                                        {formatMoneyIN(cycleDetails[cycle.id].totals!.pnl_total)}
                                      </span>
                                    </p>
                                  )}
                                  <PositionsTable positions={cycleDetails[cycle.id].positions} />
                                </>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-base-content/60">No positions.</p>
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
                    className="btn btn-ghost btn-sm join-item gap-1 rounded-none border-0 first:rounded-l-lg last:rounded-r-lg"
                    disabled={!reportsData?.previous}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                    className="btn btn-ghost btn-sm join-item gap-1 rounded-none border-0 first:rounded-l-lg last:rounded-r-lg"
                    disabled={!reportsData?.next}
                    onClick={() => setPage((p) => p + 1)}
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
    </SandboxPageShell>
  );
}
