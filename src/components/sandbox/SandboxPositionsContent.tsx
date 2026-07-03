"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
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
  const tabsId = useId();

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

  const notional = dashboard?.notional_capital ?? 0;
  const metrics = useMemo(() => {
    const before = dashboard?.before_joining;
    const after = dashboard?.after_joining;
    if (!before || !after || !notional) {
      return {
        beforeE1: 0,
        afterE1: 0,
        beforeRoiValue: before?.roi_value ?? 0,
        beforeRoiPercent: before?.roi_percent ?? 0,
        afterRoiValue: after?.roi_value ?? 0,
        afterRoiPercent: after?.roi_percent ?? 0,
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

    const calcE1 = (days: number) => Number((notional * rate * (days / 365)).toFixed(2));
    const beforeE1 = calcE1(beforeDays);
    const afterE1 = calcE1(afterDays);
    const beforeRoiValue = Number((beforeE1 + (before.e2_pnl ?? 0)).toFixed(2));
    const afterRoiValue = Number((afterE1 + (after.e2_pnl ?? 0)).toFixed(2));
    const beforeRoiPercent = notional
      ? Number(((beforeRoiValue / notional) * 100).toFixed(2))
      : 0;
    const afterRoiPercent = notional
      ? Number(((afterRoiValue / notional) * 100).toFixed(2))
      : 0;

    return {
      beforeE1,
      afterE1,
      beforeRoiValue,
      beforeRoiPercent,
      afterRoiValue,
      afterRoiPercent,
    };
  }, [dashboard, e1Risk, notional]);
  const handleLoadMoreCycles = () => {
    if (!hasMoreCycles || loadingMoreCycles) return;
    void fetchTradeCycles(cyclePage + 1, true);
  };
  if (!sandboxPlan) return null;

  const fetchFn = (path: string) => sandboxFetch(path, sandboxPlan);

  return (
    <>
      <section className="mb-8">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-base-content/70">
            Summary
          </p>
          <button
            type="button"
            onClick={() => void refreshAll()}
            disabled={refreshing || loadingDashboard}
            aria-busy={refreshing}
            className="btn btn-circle btn-ghost btn-sm h-9 min-h-9 w-9 min-w-9 shrink-0 self-start border border-base-300 bg-base-100/80 hover:border-primary/35 hover:bg-base-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:self-auto"
            aria-label="Refresh sandbox data"
          >
            <RotateCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden />
          </button>
        </div>

        {loadingDashboard ? (
          <div className="space-y-4 rounded-2xl border border-base-300 bg-base-100/55 p-5 backdrop-blur-sm">
            <div className="h-10 w-48 animate-pulse rounded-xl border border-base-300 bg-base-200/50" />
            {[...Array(2)].map((_, i) => (
              <div key={i} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[...Array(3)].map((__, j) => (
                  <div
                    key={j}
                    className="h-28 animate-pulse rounded-2xl border border-base-300 bg-base-200/50"
                  />
                ))}
              </div>
            ))}
          </div>
        ) : !dashboard?.configured ? (
          <div className="rounded-2xl border border-dashed border-warning/50 bg-warning/5 px-6 py-8 text-center">
            <p className="text-sm font-medium text-base-content">
              {dashboard?.detail ?? "Sandbox not configured for this plan."}
            </p>
            <p className="mt-2 text-xs text-base-content/70">
              Ask your administrator to assign a reference account for this plan tier.
            </p>
          </div>
        ) : (
          <div className="space-y-5 rounded-2xl border border-base-300 bg-base-100/55 p-5 backdrop-blur-sm md:p-6">
            <div className="flex flex-col gap-3 rounded-xl border border-base-300 bg-base-200/40 p-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-base-content/70">
                  E1 risk tier
                </p>
                <p className="mt-1 text-[11px] text-base-content/70">
                  Simulated on {formatMoneyIN(notional, { decimals: 0 })}
                </p>
              </div>
              <select
                className="select select-bordered select-sm h-9 min-h-9 w-full max-w-xs border-base-300 bg-base-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
            </div>

            <PeriodSummaryGroup
              title="Before joining"
              subtitle={`${formatDate(dashboard.showcase_start)} – ${formatDate(dashboard.doj)}`}
              e2Label="E2 PnL"
              e2Sub={`${formatDate(dashboard.showcase_start)} – ${formatDate(dashboard.doj)}`}
              e2Value={dashboard.before_joining?.e2_pnl ?? 0}
              e1Value={metrics.beforeE1}
              e1Sub={`From ${formatDate(dashboard.showcase_start)}`}
              roiValue={metrics.beforeRoiValue}
              roiPercent={metrics.beforeRoiPercent}
            />

            <div className="flex justify-center">
              <div className="rounded-xl border border-base-300 bg-base-200/40 px-6 py-3 text-center">
                <p className="text-xs font-medium uppercase tracking-wider text-base-content/70">
                  DOJ
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-base-content md:text-xl">
                  {formatDate(dashboard.doj)}
                </p>
                <p className="mt-0.5 text-[11px] text-base-content/70">Your date of joining</p>
              </div>
            </div>

            <PeriodSummaryGroup
              title="After joining"
              subtitle={`From ${formatDate(dashboard.doj)}`}
              e2Label="E2 PnL"
              e2Sub={
                dashboard.after_joining?.has_cycles === false
                  ? "No strategies yet"
                  : `From ${formatDate(dashboard.doj)}`
              }
              e2Value={
                dashboard.after_joining?.has_cycles === false
                  ? null
                  : (dashboard.after_joining?.e2_pnl ?? null)
              }
              e1Value={metrics.afterE1}
              e1Sub={`From ${formatDate(dashboard.doj)}`}
              roiValue={metrics.afterRoiValue}
              roiPercent={metrics.afterRoiPercent}
            />
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
              <p className="text-sm text-base-content/70">
                Reference account on this plan (illustrative)
              </p>
            </div>
          </div>

          <div
            role="tablist"
            aria-label="Strategy phase"
            className="join w-fit rounded-xl border border-base-300 bg-base-200/50 p-0.5"
          >
            <button
              id={`${tabsId}-tab-before`}
              type="button"
              role="tab"
              className={`join-item btn btn-sm h-9 min-h-9 border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                phase === "before" ? "btn-primary" : "btn-ghost"
              }`}
              aria-selected={phase === "before"}
              aria-controls={`${tabsId}-panel`}
              tabIndex={phase === "before" ? 0 : -1}
              onClick={() => setPhase("before")}
            >
              Before joining
            </button>
            <button
              id={`${tabsId}-tab-after`}
              type="button"
              role="tab"
              className={`join-item btn btn-sm h-9 min-h-9 border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                phase === "after" ? "btn-primary" : "btn-ghost"
              }`}
              aria-selected={phase === "after"}
              aria-controls={`${tabsId}-panel`}
              tabIndex={phase === "after" ? 0 : -1}
              onClick={() => setPhase("after")}
            >
              After joining
            </button>
          </div>

          <div
            id={`${tabsId}-panel`}
            role="tabpanel"
            aria-labelledby={phase === "before" ? `${tabsId}-tab-before` : `${tabsId}-tab-after`}
          >
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
                      aria-busy={loadingMoreCycles}
                      className="btn btn-outline btn-sm min-w-32 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {loadingMoreCycles ? "Loading…" : "Load more"}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-base-300 bg-base-100/40 px-6 py-12 text-center backdrop-blur-sm">
                <p className="text-sm text-base-content/70">
                  {phase === "before"
                    ? "No strategies in the reference account before your joining date."
                    : "No strategies on the reference account after your joining date yet."}
                </p>
              </div>
            )}
          </div>
        </section>
      ) : null}
    </>
  );
}

function PeriodSummaryGroup({
  title,
  subtitle,
  e2Label,
  e2Sub,
  e2Value,
  e1Value,
  e1Sub,
  roiValue,
  roiPercent,
}: {
  title: string;
  subtitle: string;
  e2Label: string;
  e2Sub: string;
  e2Value: number | null;
  e1Value: number;
  e1Sub: string;
  roiValue: number;
  roiPercent: number;
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-base-content">{title}</p>
        <p className="text-xs text-base-content/70">{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard label={e2Label} sub={e2Sub} value={e2Value} />
        <SummaryCard label="E1 PnL" sub={e1Sub} value={e1Value} />
        <RoiSummaryCard value={roiValue} percent={roiPercent} />
      </div>
    </div>
  );
}

function RoiSummaryCard({ value, percent }: { value: number; percent: number }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-base-100/80 p-4">
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-base-content/70">
        Total (E1 + E2)
      </p>
      <p
        className={`text-lg font-bold tabular-nums leading-tight md:text-xl ${signedClass(value)}`}
      >
        {formatMoneyIN(value, { decimals: 0 })}
      </p>
      <p className={`mt-1 text-sm font-semibold tabular-nums ${signedClass(percent)}`}>
        {percent.toFixed(2)}%
      </p>
    </div>
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
    <div className="rounded-2xl border border-base-300 bg-base-200/40 p-4">
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-base-content/70">
        {label}
      </p>
      <p
        className={`text-lg font-semibold tabular-nums leading-tight md:text-xl ${
          value == null ? "text-base-content/70" : signedClass(value)
        }`}
      >
        {value == null ? "—" : formatMoneyIN(value, { decimals: 0 })}
      </p>
      <p className="mt-1 text-[11px] text-base-content/70">{sub}</p>
    </div>
  );
}
