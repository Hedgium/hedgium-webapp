"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Loader2,
  TrendingUp,
  Briefcase,
  Calendar,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Wallet,
  ChevronDown,
  ChevronUp,
  Layers,
  ArrowRight,
} from "lucide-react";
import {
  createChart,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  LineSeries,
} from "lightweight-charts";
import { authFetch } from "@/utils/api";
import { formatMoneyIN } from "@/utils/formatNumber";
import PositionsTable, { type Position } from "@/components/positions/PositionsTable";
import ReportsSummarySkeleton from "@/components/skeletons/ReportsSummarySkeleton";
import ReportsListSkeleton from "@/components/skeletons/ReportsListSkeleton";
import ReportsChartSkeleton from "@/components/skeletons/ReportsChartSkeleton";

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

type MarginSnapshot = {
  snapshot_date: string;
  net: number;
  available?: number;
  utilised?: number;
};

/** From DailyPnlSnapshot API: level (total PnL as of date), not flow */
type PnlSnapshotPoint = { snapshot_date: string; pnl_total: number };

type ChartPeriod = "daily" | "weekly" | "monthly";

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

function getChartDateRange(period: ChartPeriod): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  let from: string;
  if (period === "daily") {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 1);
    from = d.toISOString().slice(0, 10);
  } else if (period === "weekly") {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 6);
    from = d.toISOString().slice(0, 10);
  } else {
    const d = new Date(now);
    d.setFullYear(d.getFullYear() - 2);
    from = d.toISOString().slice(0, 10);
  }
  return { from, to };
}

function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay());
  return start.toISOString().slice(0, 10);
}

function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7); // "YYYY-MM"
}

function aggregateMarginSnapshots(
  data: MarginSnapshot[],
  period: ChartPeriod
): MarginSnapshot[] {
  if (period === "daily" || data.length === 0) return data;
  const byKey = new Map<string, { net: number[]; utilised: number[] }>();
  for (const row of data) {
    const key = period === "weekly" ? getWeekKey(row.snapshot_date) : getMonthKey(row.snapshot_date);
    const entry = byKey.get(key) ?? { net: [], utilised: [] };
    entry.net.push(row.net);
    entry.utilised.push(Number(row.utilised ?? 0));
    byKey.set(key, entry);
  }
  return Array.from(byKey.entries())
    .map(([key, v]) => ({
      snapshot_date: period === "weekly" ? key : `${key}-01`,
      net: v.net.reduce((a, b) => a + b, 0) / v.net.length,
      utilised: v.utilised.reduce((a, b) => a + b, 0) / v.utilised.length,
    }))
    .sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date));
}

/** Aggregate DailyPnlSnapshot (level series): daily = as-is; weekly/monthly = last value in each period */
function aggregatePnlLevelSeries(
  data: PnlSnapshotPoint[],
  period: ChartPeriod
): { time: string; value: number }[] {
  const sorted = [...data].sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date));
  if (period === "daily") {
    return sorted.map((d) => ({ time: d.snapshot_date, value: d.pnl_total }));
  }
  const byKey = new Map<string, { time: string; value: number }>();
  for (const d of sorted) {
    const key = period === "weekly" ? getWeekKey(d.snapshot_date) : getMonthKey(d.snapshot_date);
    byKey.set(key, { time: period === "weekly" ? key : `${key}-01`, value: d.pnl_total });
  }
  return Array.from(byKey.values()).sort((a, b) => a.time.localeCompare(b.time));
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

export default function ReportsPage() {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [pnlSummary, setPnlSummary] = useState<PnlSummary | null>(null);
  const [allocationSummary, setAllocationSummary] = useState<AllocationSummary | null>(null);
  const [reportsData, setReportsData] = useState<ReportsResponse | null>(null);
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>("daily");
  const [marginSnapshots, setMarginSnapshots] = useState<MarginSnapshot[]>([]);
  const [pnlSnapshots, setPnlSnapshots] = useState<PnlSnapshotPoint[]>([]);
  const [accountCreatedAt, setAccountCreatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingReports, setLoadingReports] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [expandedCycleId, setExpandedCycleId] = useState<number | null>(null);
  const [cycleDetails, setCycleDetails] = useState<Record<number, CycleDetail>>({});
  const [loadingDetails, setLoadingDetails] = useState<Record<number, boolean>>({});

  const fetchReports = useCallback(async () => {
    setLoadingReports(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      const res = await authFetch(`trade-cycles/reports/?${params}`);
      if (!res.ok) throw new Error("Failed to fetch reports");
      const data: ReportsResponse = await res.json();
      setReportsData(data);
    } catch (e) {
      console.error("Error fetching reports:", e);
      setReportsData(null);
    } finally {
      setLoadingReports(false);
    }
  }, [page]);

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
      const params = new URLSearchParams();
      params.set("date_from", chartRange.from);
      params.set("date_to", chartRange.to);
      const [marginRes, pnlRes] = await Promise.all([
        authFetch(`profiles/margin-snapshots/?${params}`),
        authFetch(`profiles/pnl-snapshots/?${params}`),
      ]);
      if (marginRes.ok) {
        const data = await marginRes.json();
        setMarginSnapshots(data.results || []);
      } else {
        setMarginSnapshots([]);
      }
      if (pnlRes.ok) {
        const data = await pnlRes.json();
        setPnlSnapshots(data.results || []);
      } else {
        setPnlSnapshots([]);
      }
    } catch (e) {
      console.error("Error fetching chart data:", e);
      setMarginSnapshots([]);
      setPnlSnapshots([]);
    } finally {
      setLoadingCharts(false);
    }
  }, [chartRange.from, chartRange.to]);

  const marginChartData = aggregateMarginSnapshots(marginSnapshots, effectivePeriod);
  const pnlChartData = aggregatePnlLevelSeries(pnlSnapshots, effectivePeriod);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    fetchChartsData();
  }, [fetchChartsData]);

  useEffect(() => {
    if (accountCreatedAt != null && !allowedPeriods.includes(chartPeriod)) {
      setChartPeriod("daily");
    }
  }, [accountCreatedAt, allowedPeriods, chartPeriod]);

  // Initial load: PnL and allocation summary + account_created_at (once)
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [pnlRes, allocRes, meRes] = await Promise.all([
          authFetch("positions/pnl/"),
          authFetch("trade-cycles/allocation-summary/"),
          authFetch("users/auth/me/"),
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
        if (meRes?.ok) {
          const me = await meRes.json();
          if (me.account_created_at) setAccountCreatedAt(me.account_created_at);
        }
      } catch (e) {
        console.error("Error fetching summaries:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const summary = reportsData?.summary;
  const results = reportsData?.results ?? [];
  const maxPnl = Math.max(...results.map((r) => Math.abs(r.pnl)), 1);

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
      {/* <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-b from-base-200 via-base-200 to-base-300/80" />
        <div className="absolute -top-24 right-[-10%] h-[28rem] w-[28rem] rounded-full bg-primary/12 blur-3xl" />
        <div className="absolute top-1/3 -left-32 h-[22rem] w-[22rem] rounded-full bg-secondary/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/3 h-48 w-48 rounded-full bg-accent/10 blur-2xl opacity-70" />
        <div
          className="absolute inset-0 opacity-[0.35] bg-[linear-gradient(to_right,oklch(var(--bc)/0.04)_1px,transparent_1px),linear-gradient(to_bottom,oklch(var(--bc)/0.04)_1px,transparent_1px)] bg-[size:32px_32px]"
          style={{ maskImage: "linear-gradient(to bottom, black 0%, transparent 85%)" }}
        />
      </div> */}
      <div className="relative mx-auto max-w-7xl space-y-10 px-4 py-8 md:px-8 md:py-10">
        {loading ? (
          <ReportsSummarySkeleton />
        ) : (
          (pnlSummary || allocationSummary) && (
            <section className="space-y-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary shrink-0" aria-hidden />
                  <h2 className="text-xl font-semibold tracking-tight text-base-content md:text-2xl">
                    At a glance
                  </h2>
                </div>
                <p className="max-w-xl text-sm text-base-content/55">
                  PnL summary and allocated trade cycle counts by period.
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
              <Calendar className="h-5 w-5 text-primary shrink-0" aria-hidden />
              <h2 className="text-xl font-semibold tracking-tight text-base-content md:text-2xl">Reports</h2>
            </div>
            <p className="max-w-xl text-sm text-base-content/55">
              Margin and PnL trends, then past trade cycles
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
            {/* Margin over time */}
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
                  <MarginLineChart data={marginChartData} period={effectivePeriod} />
                </div>
              )}
            </div>
            {/* PnL over time */}
            <div className="rounded-2xl border border-base-300/60 bg-base-100/80 p-4 md:p-6 backdrop-blur-sm">
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" aria-hidden />
                <h3 className="text-lg font-semibold">
                  PnL
                  {effectivePeriod === "daily" && " (1 month)"}
                  {effectivePeriod === "weekly" && " (6 months, weekly)"}
                  {effectivePeriod === "monthly" && " (2 years, monthly)"}
                </h3>
              </div>
              {loadingCharts ? (
                <ReportsChartSkeleton />
              ) : pnlChartData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-base-content/60">
                  No PnL data in selected range
                </div>
              ) : (
                <div className="h-64">
                  <PnlLineChart data={pnlChartData} period={effectivePeriod} />
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
              <p className="max-w-xl text-sm text-base-content/55">
                Expand a row to see stored positions for that cycle. PnL shown is from the report aggregate.
              </p>
            </div>
            <div className="flex flex-wrap items-center md:justify-end gap-3">
              <span className="rounded-full border border-base-300/60 bg-base-200/40 px-3 py-1 text-xs font-medium tabular-nums text-base-content/70">
                {reportsData?.count != null ? `${results.length} on page · ${reportsData.count} total` : "—"}
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
                              <p className="mt-0.5 line-clamp-2 text-sm text-base-content/55">{cycle.description}</p>
                            ) : null}
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center rounded-full border border-base-300/60 px-2 py-0.5 text-[11px] font-medium tabular-nums text-base-content/60">
                                #{cycle.id}
                              </span>
                              <span className="text-xs text-base-content/45">{formatDate(cycle.created_at)}</span>
                              <span
                                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${stateChipClass(cycle.state)}`}
                              >
                                {cycle.state}
                              </span>
                              {cycle.sub_state ? (
                                <span className="truncate text-xs text-base-content/50" title={cycle.sub_state}>
                                  {cycle.sub_state}
                                </span>
                              ) : null}
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
    </div>
  );
}

/** Convert any CSS color (oklch, hsl, etc.) to rgb() for lightweight-charts */
function toChartColor(cssColor: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  if (!cssColor || cssColor === "rgba(0, 0, 0, 0)") return fallback;
  if (/^rgb(a?)\(/.test(cssColor) || /^#[0-9A-Fa-f]{3,8}$/.test(cssColor)) return cssColor;
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d");
  if (!ctx) return fallback;
  ctx.fillStyle = cssColor;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return `rgb(${r},${g},${b})`;
}

/** Resolve a CSS color expression (e.g. with var()) to a value lightweight-charts can parse */
function resolveChartColor(expression: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const div = document.createElement("div");
  div.style.color = expression;
  div.style.display = "none";
  document.body.appendChild(div);
  const resolved = getComputedStyle(div).color;
  document.body.removeChild(div);
  return toChartColor(resolved || "", fallback);
}

/** Parse chart time (string YYYY-MM-DD or number) to Date for formatting */
function parseChartTime(time: string | number): Date {
  if (typeof time === "string") return new Date(time + "T12:00:00");
  return new Date(time * 1000);
}

/** X-axis label formatter: dates for daily, week for weekly, month for monthly */
function getTickMarkFormatter(period: ChartPeriod) {
  return (time: string | number, _tickMarkType: unknown, locale: string): string | null => {
    const d = parseChartTime(time);
    if (period === "daily") {
      return d.toLocaleDateString(locale, { day: "numeric", month: "short" });
    }
    if (period === "weekly") {
      return "W/c " + d.toLocaleDateString(locale, { day: "numeric", month: "short" });
    }
    return d.toLocaleDateString(locale, { month: "short", year: "numeric" });
  };
}

function MarginLineChart({ data, period }: { data: MarginSnapshot[]; period: ChartPeriod }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const netSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const utilisedSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    const textColor = resolveChartColor("hsl(var(--bc) / 0.9)", "#374151");
    const gridColor = resolveChartColor("hsl(var(--bc) / 0.15)", "rgba(0,0,0,0.1)");
    const netColor = resolveChartColor("hsl(var(--p))", "#244061");
    const utilisedColor = resolveChartColor("hsl(var(--wa))", "#ea580c");

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      width: containerRef.current.clientWidth,
      height: 256,
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        timeVisible: false,
        secondsVisible: false,
        borderVisible: false,
        tickMarkFormatter: getTickMarkFormatter(period),
        tickMarkMaxCharacterLength: period === "monthly" ? 12 : period === "weekly" ? 10 : 8,
      },
      crosshair: {
        vertLine: { labelVisible: true },
        horzLine: { labelVisible: true },
      },
    });

    const netSeries = chart.addSeries(LineSeries, {
      color: netColor,
      lineWidth: 2,
      title: "Net",
    });
    const utilisedSeries = chart.addSeries(LineSeries, {
      color: utilisedColor,
      lineWidth: 2,
      title: "Utilised",
    });

    const netData = data.map((d) => ({
      time: d.snapshot_date as string,
      value: Number(d.net),
    }));
    const utilisedData = data.map((d) => ({
      time: d.snapshot_date as string,
      value: Number(d.utilised ?? 0),
    }));

    netSeries.setData(netData);
    utilisedSeries.setData(utilisedData);

    chart.timeScale().fitContent();

    chartRef.current = chart;
    netSeriesRef.current = netSeries;
    utilisedSeriesRef.current = utilisedSeries;

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        netSeriesRef.current = null;
        utilisedSeriesRef.current = null;
      }
    };
  }, [data, period]);

  if (data.length === 0) return null;

  return (
    <div className="w-full" ref={containerRef} style={{ minHeight: "256px" }} />
  );
}

type PnlChartPoint = { time: string; value: number };

function PnlLineChart({ data, period }: { data: PnlChartPoint[]; period: ChartPeriod }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    const textColor = resolveChartColor("hsl(var(--bc) / 0.9)", "#374151");
    const gridColor = resolveChartColor("hsl(var(--bc) / 0.15)", "rgba(0,0,0,0.1)");
    const lastValue = data[data.length - 1]?.value ?? 0;
    const lineColor =
      lastValue >= 0
        ? resolveChartColor("hsl(var(--su))", "#22c55e")
        : resolveChartColor("hsl(var(--er))", "#ef4444");

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      width: containerRef.current.clientWidth,
      height: 256,
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        timeVisible: false,
        secondsVisible: false,
        borderVisible: false,
        tickMarkFormatter: getTickMarkFormatter(period),
        tickMarkMaxCharacterLength: period === "monthly" ? 12 : period === "weekly" ? 10 : 8,
      },
      crosshair: {
        vertLine: { labelVisible: true },
        horzLine: { labelVisible: true },
      },
    });

    const series = chart.addSeries(LineSeries, {
      color: lineColor,
      lineWidth: 2,
      title: "Cumulative PnL",
    });
    series.setData(data.map((d) => ({ time: d.time as string, value: d.value })));
    chart.timeScale().fitContent();

    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  }, [data, period]);

  if (data.length === 0) return null;

  return (
    <div className="w-full" ref={containerRef} style={{ minHeight: "256px" }} />
  );
}
