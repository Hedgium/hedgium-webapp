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
} from "lucide-react";
import { sandboxFetch } from "@/utils/sandboxApi";
import { formatMoneyIN } from "@/utils/formatNumber";
import PositionsTable, { type Position } from "@/components/positions/PositionsTable";
import ReportsSummarySkeleton from "@/components/skeletons/ReportsSummarySkeleton";
import ReportsListSkeleton from "@/components/skeletons/ReportsListSkeleton";
import ReportsChartSkeleton from "@/components/skeletons/ReportsChartSkeleton";
import {
  MarginLineChart,
  PnlLineChart,
  getChartDateRange,
  aggregateMarginSnapshots,
  aggregatePnlLevelSeries,
  type ChartPeriod,
  type MarginSnapshot,
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

type PnlSnapshotPoint = { snapshot_date: string; pnl_total: number };

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
  const [pnlSnapshots, setPnlSnapshots] = useState<PnlSnapshotPoint[]>([]);
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
      const params = new URLSearchParams();
      params.set("date_from", chartRange.from);
      params.set("date_to", chartRange.to);
      const [marginRes, pnlRes] = await Promise.all([
        sandboxFetch(`margin-snapshots/?${params}`, sandboxPlan),
        sandboxFetch(`pnl-snapshots/?${params}`, sandboxPlan),
      ]);
      if (marginRes.ok) {
        const data = await marginRes.json();
        setMarginSnapshots(data.results || []);
      } else setMarginSnapshots([]);
      if (pnlRes.ok) {
        const data = await pnlRes.json();
        setPnlSnapshots(data.results || []);
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
  const pnlChartData = aggregatePnlLevelSeries(pnlSnapshots, effectivePeriod);

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
    <div className="p-4 md:px-8 bg-base-200 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {loading ? (
          <ReportsSummarySkeleton />
        ) : (
          (pnlSummary || allocationSummary) && (
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
          )
        )}

        <section className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-semibold">Reports</h2>
          </div>
        </section>

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
            <div className="bg-base-100 rounded-xl border border-base-300 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Wallet className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Margin</h3>
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
            <div className="bg-base-100 rounded-xl border border-base-300 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">PnL</h3>
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

        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Past Trade Cycles ({reportsData?.count})</h3>
            <div className="flex items-center gap-2">
              {summary && (
                <p
                  className={`text-sm text-base-content/60 ${
                    summary.pnl_total >= 0 ? "text-success" : "text-error"
                  }`}
                >
                  Total PnL: {formatMoneyIN(summary?.pnl_total)}
                </p>
              )}
            </div>
          </div>

          {loadingReports ? (
            <ReportsListSkeleton />
          ) : results.length === 0 ? (
            <div className="text-center py-16 bg-base-100 rounded-lg shadow">
              <Briefcase className="w-12 h-12 mx-auto text-base-content/40 mb-3" />
              <h3 className="text-lg font-semibold mb-1">No Trade Cycles</h3>
              <p className="text-base-content/60">No trade cycles found.</p>
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
                                {typeof cycleDetails[cycle.id].totals?.pnl_total === "number" && (
                                  <p className="text-sm mb-2">
                                    Total PnL:{" "}
                                    <span
                                      className={
                                        cycleDetails[cycle.id].totals!.pnl_total >= 0
                                          ? "text-success font-medium"
                                          : "text-error font-medium"
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
                ))}
              </div>

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
