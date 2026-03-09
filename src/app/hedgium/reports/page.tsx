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
  summary: { total_count: number; total_pnl: number };
};

type MarginSnapshot = {
  snapshot_date: string;
  net: number;
  available?: number;
  utilised?: number;
};

/** From DailyPnlSnapshot API: level (total PnL as of date), not flow */
type PnlSnapshotPoint = { snapshot_date: string; total_pnl: number };

type ChartPeriod = "daily" | "weekly" | "monthly";

type CycleDetail = {
  positions: Position[];
  totals: { total_pnl?: number };
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
    return sorted.map((d) => ({ time: d.snapshot_date, value: d.total_pnl }));
  }
  const byKey = new Map<string, { time: string; value: number }>();
  for (const d of sorted) {
    const key = period === "weekly" ? getWeekKey(d.snapshot_date) : getMonthKey(d.snapshot_date);
    byKey.set(key, { time: period === "weekly" ? key : `${key}-01`, value: d.total_pnl });
  }
  return Array.from(byKey.values()).sort((a, b) => a.time.localeCompare(b.time));
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
    <div className="p-4 md:px-8 bg-base-200 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">

                {/* Legacy PnL Summary & Allocation Summary */}
          {!loading && (pnlSummary || allocationSummary) && (
          <section className="border-base-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {pnlSummary && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h4 className="font-medium">PnL Summary</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(pnlSummary).map(([period, value]) => (
                      <div
                        key={period}
                        className="p-3 bg-base-100 rounded-lg border border-base-300"
                      >
                        <span className="text-xs text-base-content/60 uppercase">
                          {period.replace(/_/g, " ")}
                        </span>
                        <p
                          className={`font-semibold ${
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
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="w-5 h-5 text-primary" />
                    <h4 className="font-medium">Allocated Trade Cycles</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(allocationSummary).map(([period, value]) => (
                      <div
                        key={period}
                        className="p-3 bg-base-100 rounded-lg border border-base-300"
                      >
                        <span className="text-xs text-base-content/60 uppercase">
                          {period.replace(/_/g, " ")}
                        </span>
                        <p className="font-semibold text-primary">
                          {value != null ? value : 0}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Title */}
        <section className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-semibold">Reports</h2>
          </div>
        </section>

        {/* Trade cycles summary (for selected range) */}
        

        {/* PnL & Margin graphs — Daily / Weekly / Monthly */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-base-content/70">Chart view:</span>
            <div className="join">
              {allowedPeriods.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`btn btn-sm join-item ${chartPeriod === p ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setChartPeriod(p)}
                >
                  {p === "daily" ? "Daily (1M)" : p === "weekly" ? "Weekly (6M)" : "Monthly (2Y)"}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Margin over time */}
            <div className="bg-base-100 rounded-xl border border-base-300 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Wallet className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">
                  Margin
                  {effectivePeriod === "daily" && " (1 month)"}
                  {effectivePeriod === "weekly" && " (6 months, weekly avg)"}
                  {effectivePeriod === "monthly" && " (2 years, monthly avg)"}
                </h3>
              </div>
              {loadingCharts ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
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
            <div className="bg-base-100 rounded-xl border border-base-300 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">
                  PnL
                  {effectivePeriod === "daily" && " (1 month)"}
                  {effectivePeriod === "weekly" && " (6 months, weekly)"}
                  {effectivePeriod === "monthly" && " (2 years, monthly)"}
                </h3>
              </div>
              {loadingCharts ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
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

        {/* Past trade cycles list with pagination */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Past Trade Cycles ({reportsData?.count})</h3>
            
            <div className="flex items-center gap-2">
            

            {summary && (
              <p
                  className={`text-sm text-base-content/60 ${
                    summary.total_pnl >= 0 ? "text-success" : "text-error"
                  }`}
                >
                  Total PnL: {formatMoneyIN(summary?.total_pnl)}
                </p>
              )}
              </div>
          </div>

          {loadingReports ? (
            <div className="flex flex-col items-center justify-center py-16 bg-base-100 rounded-lg shadow">
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
              <p className="text-base-content/70">Loading trade cycles...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-16 bg-base-100 rounded-lg shadow">
              <Briefcase className="w-12 h-12 mx-auto text-base-content/40 mb-3" />
              <h3 className="text-lg font-semibold mb-1">No Trade Cycles</h3>
              <p className="text-base-content/60">
                No trade cycles found.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4">
                {results.map((cycle) => (
                  <div
                    key={cycle.id}
                    className="bg-base-100 rounded-xl border border-base-300 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                  >
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => toggleCycleDetails(cycle.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && toggleCycleDetails(cycle.id)}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base-content/60">
                            {expandedCycleId === cycle.id ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </span>
                          <div>
                            <h4 className="font-semibold">{cycle.name}</h4>
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-base-content/70">
                              <span>ID: {cycle.id}</span>
                              <span>·</span>
                              <span>{formatDate(cycle.created_at)}</span>
                              <span className="badge badge-sm badge-outline">{cycle.state}</span>
                            </div>
                          </div>
                        </div>
                        <div
                          className={`font-bold ${
                            cycle.pnl >= 0 ? "text-success" : "text-error"
                          }`}
                        >
                          {formatMoneyIN(cycle.pnl)}
                        </div>
                      </div>
                      <p className="text-xs text-base-content/50 mt-2">
                        {expandedCycleId === cycle.id ? "Hide positions" : "View positions"}
                      </p>
                    </div>
                    {expandedCycleId === cycle.id && (
                      <div className="border-t border-base-300 bg-base-200/50 p-4">
                        {loadingDetails[cycle.id] ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                          </div>
                        ) : cycleDetails[cycle.id] ? (
                          <div>
                            {cycleDetails[cycle.id].error ? (
                              <p className="text-sm text-error">Failed to load positions. Try again.</p>
                            ) : (
                              <>
                                {typeof cycleDetails[cycle.id].totals?.total_pnl === "number" && (
                                  <p className="text-sm mb-2">
                                    Total PnL:{" "}
                                    <span
                                      className={
                                        cycleDetails[cycle.id].totals!.total_pnl >= 0
                                          ? "text-success font-medium"
                                          : "text-error font-medium"
                                      }
                                    >
                                      {formatMoneyIN(cycleDetails[cycle.id].totals!.total_pnl)}
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
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={!reportsData?.previous}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <span className="text-sm text-base-content/70">
                  Page {page}
                  {reportsData?.count != null &&
                    ` of ${Math.ceil(reportsData.count / pageSize) || 1}`}
                </span>
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={!reportsData?.next}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
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
    const netColor = resolveChartColor("hsl(var(--p))", "#2563eb");
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
