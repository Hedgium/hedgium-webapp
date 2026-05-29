"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import TradeCycleWithPositionsCard from "@/components/TradeCyclePositions";
import TradeCyclePositionsSkeleton from "@/components/skeletons/TradeCyclePositionsSkeleton";
import { sandboxFetch } from "@/utils/sandboxApi";
import { formatMoneyIN } from "@/utils/formatNumber";
import useAlert from "@/hooks/useAlert";
import { RotateCw, Briefcase } from "lucide-react";
import { useSandboxStore } from "@/store/sandboxStore";
import type {
  SandboxDashboard,
  SandboxE1Risk,
  SandboxPhase,
  SandboxTradeCycleListResponse,
  SandboxTradeCycle,
} from "@/types/sandbox";

const E1_OPTIONS: { id: SandboxE1Risk; label: string }[] = [
  { id: "LOW", label: "Low (7%)" },
  { id: "MEDIUM", label: "Medium (9%)" },
  { id: "HIGH", label: "High (12%)" },
];
const E1_ANNUAL_RATE: Record<SandboxE1Risk, number> = {
  LOW: 0.07,
  MEDIUM: 0.09,
  HIGH: 0.12,
};

function signedClass(value: number): string {
  if (value > 0) return "text-success";
  if (value < 0) return "text-error";
  return "text-base-content/75";
}

function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function SandboxPositionsContent() {
  const { sandboxPlan } = useSandboxStore();
  const alert = useAlert();

  const [e1Risk, setE1Risk] = useState<SandboxE1Risk>("MEDIUM");
  const [phase, setPhase] = useState<SandboxPhase>("before");
  const [dashboard, setDashboard] = useState<SandboxDashboard | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [tradeCycles, setTradeCycles] = useState<SandboxTradeCycle[]>([]);
  const [loadingCycles, setLoadingCycles] = useState(true);
  const [loadingMoreCycles, setLoadingMoreCycles] = useState(false);
  const [cyclePage, setCyclePage] = useState(1);
  const [hasMoreCycles, setHasMoreCycles] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    if (!sandboxPlan) return;
    setLoadingDashboard(true);
    try {
      const res = await sandboxFetch("dashboard/", sandboxPlan);
      if (!res.ok) throw new Error("Failed to load sandbox dashboard");
      const data = (await res.json()) as SandboxDashboard;
      setDashboard(data);
    } catch (error) {
      console.error(error);
      setDashboard({ configured: false, detail: "Failed to load sandbox data." });
    } finally {
      setLoadingDashboard(false);
    }
  }, [sandboxPlan]);

  const fetchTradeCycles = useCallback(async (page = 1, append = false) => {
    if (!sandboxPlan) return;
    if (append) {
      setLoadingMoreCycles(true);
    } else {
      setLoadingCycles(true);
    }
    try {
      const res = await sandboxFetch("trade-cycles/", sandboxPlan, undefined, {
        phase,
        page,
        page_size: 10,
      });
      if (!res.ok) throw new Error("Failed to fetch trade cycles");
      const data = (await res.json()) as SandboxTradeCycleListResponse;
      const nextResults = data.results || [];
      setTradeCycles((prev) => (append ? [...prev, ...nextResults] : nextResults));
      setCyclePage(data.page || page);
      setHasMoreCycles(Boolean(data.has_next));
    } catch (error) {
      console.error(error);
      if (!append) {
        setTradeCycles([]);
        setCyclePage(1);
        setHasMoreCycles(false);
      }
    } finally {
      if (append) {
        setLoadingMoreCycles(false);
      } else {
        setLoadingCycles(false);
      }
    }
  }, [sandboxPlan, phase]);

  const refreshAll = async () => {
    if (!sandboxPlan) return;
    setRefreshing(true);
    try {
      await Promise.all([fetchDashboard(), fetchTradeCycles()]);
      alert.success("Sandbox data refreshed");
    } catch {
      alert.error("Failed to refresh");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    if (dashboard?.configured) {
      void fetchTradeCycles();
    } else {
      setTradeCycles([]);
      setLoadingCycles(false);
      setCyclePage(1);
      setHasMoreCycles(false);
    }
  }, [fetchTradeCycles, dashboard?.configured]);

  if (!sandboxPlan) return null;

  const fetchFn = (path: string) => sandboxFetch(path, sandboxPlan);
  const notional = dashboard?.notional_capital ?? 0;
  const metrics = useMemo(() => {
    const before = dashboard?.before_joining;
    const after = dashboard?.after_joining;
    const combined = dashboard?.combined;
    if (!before || !after || !combined || !notional) {
      return {
        beforeE1: 0,
        afterE1: 0,
        combinedE1: 0,
        combinedRoiValue: combined?.roi_value ?? 0,
        combinedRoiPercent: combined?.roi_percent ?? 0,
      };
    }

    const parseIsoDay = (isoDay: string | undefined): Date | null => {
      if (!isoDay) return null;
      const d = new Date(`${isoDay}T00:00:00`);
      return Number.isNaN(d.getTime()) ? null : d;
    };
    const dayDiff = (fromIso: string | undefined, toIso: string | undefined): number => {
      const from = parseIsoDay(fromIso);
      const to = parseIsoDay(toIso);
      if (!from || !to) return 0;
      const ms = to.getTime() - from.getTime();
      return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
    };

    const rate = E1_ANNUAL_RATE[e1Risk];
    const beforeDays = dayDiff(before.from, before.to);
    const afterDays = dayDiff(after.from, after.to);
    const combinedDays = beforeDays + afterDays;

    const calcE1 = (days: number) => Number((notional * rate * (days / 365)).toFixed(2));
    const beforeE1 = calcE1(beforeDays);
    const afterE1 = calcE1(afterDays);
    const combinedE1 = calcE1(combinedDays);
    const combinedRoiValue = Number((combinedE1 + (combined.e2_pnl ?? 0)).toFixed(2));
    const combinedRoiPercent = notional
      ? Number(((combinedRoiValue / notional) * 100).toFixed(2))
      : 0;

    return {
      beforeE1,
      afterE1,
      combinedE1,
      combinedRoiValue,
      combinedRoiPercent,
    };
  }, [dashboard, e1Risk, notional]);
  const handleLoadMoreCycles = () => {
    if (!hasMoreCycles || loadingMoreCycles) return;
    void fetchTradeCycles(cyclePage + 1, true);
  };

  return (
    <>
      <section className="mb-8">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-base-content/45">
            Summary
          </p>
          <button
            type="button"
            onClick={() => void refreshAll()}
            disabled={refreshing || loadingDashboard}
            className="btn btn-ghost btn-sm gap-2 self-start border border-base-300/70"
            aria-label="Refresh sandbox data"
          >
            <RotateCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden />
            Refresh
          </button>
        </div>

        {loadingDashboard ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl border border-base-300/40 bg-base-100/70"
              />
            ))}
          </div>
        ) : !dashboard?.configured ? (
          <div className="rounded-2xl border border-dashed border-warning/40 bg-warning/5 px-6 py-8 text-center">
            <p className="text-sm font-medium text-base-content">
              {dashboard?.detail ?? "Sandbox not configured for this plan."}
            </p>
            <p className="mt-2 text-xs text-base-content/60">
              Ask your administrator to assign a reference account for this plan tier.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <SummaryCard
              label="PnL before joining"
              sub={`E2 · ${formatDate(dashboard.showcase_start)} – ${formatDate(dashboard.doj)}`}
              value={dashboard.before_joining?.e2_pnl ?? 0}
            />
            <div className="rounded-2xl border border-base-300/60 bg-base-200/35 p-4">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-base-content/50">
                DOJ
              </p>
              <p className="text-lg font-semibold tabular-nums text-base-content md:text-xl">
                {formatDate(dashboard.doj)}
              </p>
              <p className="mt-1 text-[11px] text-base-content/45">Your date of joining</p>
            </div>
            <SummaryCard
              label="PnL after joining"
              sub={
                dashboard.after_joining?.has_cycles === false
                  ? "E2 · No strategies yet"
                  : `E2 · from ${formatDate(dashboard.doj)}`
              }
              value={
                dashboard.after_joining?.has_cycles === false
                  ? null
                  : (dashboard.after_joining?.e2_pnl ?? null)
              }
            />
            <div className="rounded-2xl border border-base-300/60 bg-base-200/35 p-4">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-base-content/50">
                E1
              </label>
              <select
                className="select select-bordered select-xs mb-2 w-full max-w-full"
                value={e1Risk}
                onChange={(e) => setE1Risk(e.target.value as SandboxE1Risk)}
                aria-label="E1 risk tier"
              >
                {E1_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className={`text-lg font-semibold tabular-nums md:text-xl ${signedClass(metrics.combinedE1)}`}>
                {formatMoneyIN(metrics.combinedE1, { decimals: 0 })}
              </p>
              <p className="mt-1 text-[11px] text-base-content/45">
                Simulated on {formatMoneyIN(notional, { decimals: 0 })}
              </p>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-base-100/80 p-4 col-span-2 lg:col-span-1">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-base-content/50">
                ROI (E1 + E2)
              </p>
              <p
                className={`text-lg font-bold tabular-nums leading-tight md:text-xl ${signedClass(metrics.combinedRoiValue)}`}
              >
                {formatMoneyIN(metrics.combinedRoiValue, { decimals: 0 })}
              </p>
              <p className={`mt-1 text-sm font-semibold tabular-nums ${signedClass(metrics.combinedRoiPercent)}`}>
                {metrics.combinedRoiPercent.toFixed(2)}%
              </p>
            </div>
          </div>
        )}
      </section>

      {dashboard?.configured ? (
        <section className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" aria-hidden />
                <h2 className="text-xl font-semibold tracking-tight text-base-content md:text-2xl">
                  Strategies
                </h2>
              </div>
              <p className="text-sm text-base-content/55">
                Reference account on this plan (illustrative)
              </p>
            </div>
          </div>

          <div role="tablist" className="tabs tabs-boxed w-fit bg-base-200/60 p-1">
            <button
              type="button"
              role="tab"
              className={`tab ${phase === "before" ? "tab-active" : ""}`}
              aria-selected={phase === "before"}
              onClick={() => setPhase("before")}
            >
              Before joining
            </button>
            <button
              type="button"
              role="tab"
              className={`tab ${phase === "after" ? "tab-active" : ""}`}
              aria-selected={phase === "after"}
              onClick={() => setPhase("after")}
            >
              After joining
            </button>
          </div>

          {loadingCycles ? (
            <div className="grid grid-cols-1 gap-6">
              {[...Array(2)].map((_, i) => (
                <TradeCyclePositionsSkeleton key={i} />
              ))}
            </div>
          ) : tradeCycles.length > 0 ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-6">
                {tradeCycles.map((cycle) => (
                  <TradeCycleWithPositionsCard
                    key={cycle.id}
                    tradeCycle={{
                      ...cycle,
                      id: String(cycle.id),
                      state: cycle.state as
                        | "NEW"
                        | "ACTIVATED"
                        | "ADJUSTED"
                        | "PENDING"
                        | "COMPLETED"
                        | "STOPPED",
                    }}
                    fetchFn={fetchFn}
                  />
                ))}
              </div>
              {hasMoreCycles ? (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={handleLoadMoreCycles}
                    disabled={loadingMoreCycles}
                    className="btn btn-outline btn-sm min-w-32"
                  >
                    {loadingMoreCycles ? "Loading..." : "Load more"}
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-base-300/70 bg-base-100/40 px-6 py-12 text-center">
              <p className="text-sm text-base-content/60">
                {phase === "before"
                  ? "No strategies in the reference account before your joining date."
                  : "No strategies on the reference account after your joining date yet."}
              </p>
            </div>
          )}
        </section>
      ) : null}
    </>
  );
}

function SummaryCard({
  label,
  sub,
  value,
}: {
  label: string;
  sub: string;
  value: number | null;
}) {
  return (
    <div className="rounded-2xl border border-base-300/60 bg-base-200/35 p-4">
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-base-content/50">
        {label}
      </p>
      <p
        className={`text-lg font-semibold tabular-nums leading-tight md:text-xl ${
          value == null ? "text-base-content/50" : signedClass(value)
        }`}
      >
        {value == null ? "—" : formatMoneyIN(value, { decimals: 0 })}
      </p>
      <p className="mt-1 text-[11px] text-base-content/45">{sub}</p>
    </div>
  );
}
