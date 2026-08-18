"use client";

import React, { JSX, useState, useEffect } from "react";
import { Clock, CheckCircle, XCircle, Lock, ExternalLink, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatLakhsIN, formatMoneyIN } from "@/utils/formatNumber";
import useAlert from "@/hooks/useAlert";
import { activateTradeCycle } from "@/services/tradeCycles";
import type { SpotByUnderlying, TradeCycleListItem, TradeCycleStrategyMetrics } from "@/types/tradeCycles";

function pnlClass(value: number | null): string {
  if (value == null) return "text-base-content/75";
  if (value > 0) return "text-success";
  if (value < 0) return "text-error";
  return "text-base-content/75";
}

function toNum(v: number | string | null | undefined): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function formatSnapshotAt(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function pickMetric<T>(
  cycle: TradeCycleListItem,
  key: keyof TradeCycleStrategyMetrics
): T | null | undefined {
  const nested = cycle.strategy?.[key];
  if (nested != null && nested !== "") return nested as T;
  return cycle[key] as T | null | undefined;
}

function combinedAbsDelta(
  deltas: SpotByUnderlying | null | undefined,
  spots: SpotByUnderlying | null | undefined
): number | null {
  if (!deltas && !spots) return null;
  const symbols = new Set([...Object.keys(deltas || {}), ...Object.keys(spots || {})]);
  let sum = 0;
  let any = false;
  for (const sym of symbols) {
    if (!sym) continue;
    const delta = toNum(deltas?.[sym] ?? null);
    const spot = toNum(spots?.[sym] ?? null);
    if (delta == null || spot == null || spot <= 0) continue;
    sum += delta * spot;
    any = true;
  }
  return any ? sum : null;
}

interface Props {
  tradeCycle: TradeCycleListItem;
  isActive?: boolean;
  isSimulation?: boolean;
}

function stateStyles(state: string): { pill: string; icon: JSX.Element } {
  switch (state) {
    case "ADJUSTED":
      return {
        pill: "border-success/30 bg-success/10 text-success",
        icon: <CheckCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />,
      };
    case "CLOSED":
      return {
        pill: "border-error/30 bg-error/10 text-error",
        icon: <XCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />,
      };
    case "LOCKED":
      return {
        pill: "border-base-content/15 bg-base-200/80 text-base-content/50",
        icon: <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />,
      };
    case "NEW":
    case "ACTIVATED":
    case "PENDING":
      return {
        pill: "border-warning/35 bg-warning/10 text-warning",
        icon: <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />,
      };
    default:
      return {
        pill: "border-base-300/80 bg-base-200/50 text-base-content/80",
        icon: <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />,
      };
  }
}

function MetricCell({
  label,
  value,
  sub,
  valueClassName = "text-base-content",
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-base-300/60 bg-base-200/35 px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-base-content/70">
        {label}
      </p>
      <p className={`mt-0.5 text-base font-semibold tabular-nums leading-tight md:text-lg ${valueClassName}`}>
        {value}
      </p>
      {sub != null && sub !== false ? (
        <p className="mt-1 text-[10px] tabular-nums leading-snug text-base-content/70">{sub}</p>
      ) : null}
    </div>
  );
}

const TradeCycleCard: React.FC<Props> = ({ tradeCycle, isActive = true, isSimulation }) => {
  const alert = useAlert();
  const [cycle, setCycle] = useState<TradeCycleListItem>(tradeCycle);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    setCycle(tradeCycle);
  }, [tradeCycle]);

  const isLocked = cycle.state === "LOCKED";
  const { pill: statePillClass, icon: stateIcon } = stateStyles(cycle.state);
  const pnlTotal = toNum(cycle.pnl_total);
  const absDelta = combinedAbsDelta(
    pickMetric<SpotByUnderlying>(cycle, "greek_delta_by_underlying"),
    pickMetric<SpotByUnderlying>(cycle, "greek_spot_by_underlying")
  );
  const wpnl = toNum(pickMetric(cycle, "wpnl_total"));
  const midWpnl = toNum(pickMetric(cycle, "mid_wpnl_total"));
  const spread = toNum(pickMetric(cycle, "atm_spread"));
  const greekUpdatedAt = pickMetric<string>(cycle, "greek_updated_at");
  const wpnlUpdatedAt = pickMetric<string>(cycle, "wpnl_updated_at");
  const spreadUpdatedAt = pickMetric<string>(cycle, "spread_updated_at");

  async function handleActivate() {
    if (activating) return;
    setActivating(true);
    try {
      await activateTradeCycle(cycle.id);
      setCycle((prev) => ({ ...prev, state: "ACTIVATED" }));
      alert.success("Trade cycle activated", { duration: 2000 });
    } catch (err) {
      console.error("Activation failed:", err);
      alert.error("Could not activate this trade cycle");
    } finally {
      setActivating(false);
    }
  }

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-base-300/70 bg-base-100/80 backdrop-blur-sm transition-all duration-200 ${
        isActive ? "hover:border-primary/25" : ""
      } hover:-translate-y-0.5 ${isLocked ? "opacity-[0.92]" : ""}`}
    >
      <div className="flex flex-1 flex-col p-4 md:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold leading-snug tracking-tight text-base-content md:text-xl">
              {cycle.name}
            </h3>
            {cycle.description ? (
              <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-base-content/70">
                {cycle.description}
              </p>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statePillClass}`}
              >
                {stateIcon}
                {cycle.state}
              </span>
              {cycle.sub_state ? (
                <span className="inline-flex max-w-full truncate rounded-full border border-base-300/60 bg-base-200/40 px-2.5 py-0.5 text-xs font-medium text-base-content/70">
                  {cycle.sub_state}
                </span>
              ) : null}
            </div>
          </div>
          <div className="shrink-0 text-right text-[11px] tabular-nums text-base-content/70 sm:pt-0.5">
            <div>#{cycle.id}</div>
            <div className="mt-0.5">{new Date(cycle.created_at).toLocaleDateString()}</div>
          </div>
        </div>

        {isLocked && (
          <div className="rounded-xl border border-dashed border-base-300/80 bg-base-200/35 px-4 py-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-base-300/60 bg-base-100/60">
              <Lock className="h-6 w-6 text-base-content/50" aria-hidden />
            </div>
            <h4 className="text-base font-semibold text-base-content">Strategy locked</h4>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-base-content/70">
              This strategy is not available in your current plan.
            </p>
            <div className="mx-auto mt-5 flex max-w-xs flex-col gap-2">
              <Link href="/settings" className="btn btn-primary btn-sm gap-2 rounded-full">
                <ExternalLink className="h-4 w-4" aria-hidden />
                Account settings
              </Link>
              <a href="mailto:support@hedgium.in" className="btn btn-ghost btn-sm rounded-full">
                Contact Hedgium
              </a>
            </div>
          </div>
        )}

        {!isLocked && (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <MetricCell
              label="PnL"
              value={pnlTotal == null ? "—" : formatMoneyIN(pnlTotal)}
              sub={formatSnapshotAt(cycle.pnl_updated_at) ?? "Cycle total"}
              valueClassName={pnlClass(pnlTotal)}
            />
            <MetricCell
              label="Net Δ"
              value={absDelta != null ? formatLakhsIN(absDelta) : "—"}
              sub={formatSnapshotAt(greekUpdatedAt) ?? "Net delta"}
              valueClassName={pnlClass(absDelta)}
            />
            <MetricCell
              label="ATM spread"
              value={spread == null ? "—" : `${spread.toFixed(2)}%`}
              sub={formatSnapshotAt(spreadUpdatedAt) ?? "Not updated"}
            />
            <MetricCell
              label="WPNL / Mid"
              value={
                <>
                  <span className={pnlClass(wpnl)}>{wpnl == null ? "—" : formatMoneyIN(wpnl)}</span>
                  {" / "}
                  <span className={pnlClass(midWpnl)}>{midWpnl == null ? "—" : formatMoneyIN(midWpnl)}</span>
                </>
              }
              sub={formatSnapshotAt(wpnlUpdatedAt) ?? "Not updated"}
            />
          </div>
        )}

        {!isLocked && (
          <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-base-300/50 pt-4">
            {cycle.state !== "NEW" && (
              <Link
                href={isSimulation ? "/simulation" : "/positions"}
                className="btn btn-primary btn-sm gap-1.5 rounded-full px-5"
              >
                View positions
                <ArrowRight className="h-3.5 w-3.5 opacity-90" aria-hidden />
              </Link>
            )}

            {cycle.state === "NEW" && !isSimulation && (
              <button
                type="button"
                onClick={() => void handleActivate()}
                disabled={activating}
                aria-busy={activating}
                className="btn btn-outline btn-primary btn-sm rounded-full border-primary/40 px-5"
              >
                {activating ? "Activating…" : "Activate"}
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
};

export default TradeCycleCard;
