"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { authFetch } from "@/utils/api";
import Adjustments from "@/components/admin/Adjustments";
import Link from "next/link";
import TradeCycles from "@/components/admin/TradeCycles";
import { formatDateTimeMinutes } from "@/utils/formatDate";
import { formatMoneyIN } from "@/utils/formatNumber";
import useAlert from "@/hooks/useAlert";
import { CheckCircle, ChevronLeft, Plus, Layers, Table2, RotateCcw, RotateCw } from "lucide-react";
import StrategyAdjustmentsSkeleton from "@/components/skeletons/StrategyAdjustmentsSkeleton";
import StrategyTradeCyclesSkeleton from "@/components/skeletons/StrategyTradeCyclesSkeleton";
import ManualAdjustmentModal from "@/components/admin/strategy/ManualAdjustmentModal";

const StrategyOptionChainModal = dynamic(
  () => import("@/components/admin/strategy/StrategyOptionChainModal"),
  { ssr: false, loading: () => null }
);

interface StrategyVersion {
  id: number;
  version: number;
  title: string | null;
}

interface StrategyDetail {
  id: number;
  name: string;
  description?: string | null;
  margin_required: number;
  exchange?: string;
  underlying_names?: string[];
  created_at: string;
  source?: string | null;
  is_active: boolean;
  completed: boolean;
  completed_at?: string | null;
  trade_cycle_count: number;
  wpnl_total?: number | string | null;
  mid_wpnl_total?: number | string | null;
  atm_spread?: number | string | null;
  wpnl_updated_at?: string | null;
  spread_updated_at?: string | null;
  pnl_total?: number | string | null;
  pnl_updated_at?: string | null;
  adjustment_count: number;
  leg_count: number;
  versions: StrategyVersion[];
  multiplier_allowed?: boolean;
  /** Uppercase symbol -> Zerodha underlying instrument_token from builder legs */
  underlying_instrument_tokens?: Record<string, number>;
}

export default function StrategyDetail() {
  const [strategy, setStrategy] = useState<StrategyDetail | null>(null);
  const [trade_cycles, setTradeCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tradeCyclesLoading, setTradeCyclesLoading] = useState(false);
  const [completingStrategy, setCompletingStrategy] = useState(false);
  const [uncompletingStrategy, setUncompletingStrategy] = useState(false);
  const [showManualAdjustment, setShowManualAdjustment] = useState(false);
  const [showOptionChainModal, setShowOptionChainModal] = useState(false);
  const [strategyRefreshing, setStrategyRefreshing] = useState(false);
  const alert = useAlert();

  const params = useParams<{ id: string }>();
  const { id } = params;
  const strategyId = Number(id);

  async function fetchStrategyData(opts?: { silent?: boolean }) {
    const silent = opts?.silent ?? false;
    if (silent) {
      setStrategyRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const res = await authFetch(`myadmin/strategies/${id}/`);
      const data = await res.json();
      // console.log(data);
      setStrategy(data);
    } catch (error) {
      console.error("Error fetching strategy data:", error);
    } finally {
      if (silent) {
        setStrategyRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }

  async function fetchTradeCycles() {
    try {
      setTradeCyclesLoading(true);
      const res = await authFetch(`myadmin/trade-cycles/${id}/?page=1&page_size=100`);
      const data = await res.json();
      setTradeCycles(data.results);
    } catch (error) {
      console.error("Error fetching trade cycles:", error);
    } finally {
      setTradeCyclesLoading(false);
    }
  }

  async function completeStrategy() {
    if (
      !confirm(
        "Are you sure you want to mark this strategy as completed? This will close all associated trade cycles."
      )
    ) {
      return;
    }

    setCompletingStrategy(true);
    try {
      const res = await authFetch(`myadmin/strategies/${id}/complete/`, {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok && data.status === "success") {
        alert.success(data.message || "Strategy marked as completed successfully");
        await fetchStrategyData({ silent: true });
        await fetchTradeCycles();
      } else {
        alert.error(data.message || "Failed to complete strategy");
      }
    } catch (error) {
      console.error("Error completing strategy:", error);
      alert.error("Error completing strategy");
    } finally {
      setCompletingStrategy(false);
    }
  }

  async function uncompleteStrategy() {
    if (
      !confirm(
        "Undo “mark complete” for this strategy?\n\n" +
          "The strategy will show as active again and a linked builder (if any) will return from Exited to Active. " +
          "Trade cycles that were closed together with that completion (same time window) will be reopened; " +
          "cycles that were already closed before that stay closed."
      )
    ) {
      return;
    }

    setUncompletingStrategy(true);
    try {
      const res = await authFetch(`myadmin/strategies/${id}/uncomplete/`, {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok && data.status === "success") {
        alert.success(data.message || "Strategy is active again");
        await fetchStrategyData({ silent: true });
        await fetchTradeCycles();
      } else {
        alert.error(data.message || "Failed to undo completion");
      }
    } catch (error) {
      console.error("Error undoing strategy completion:", error);
      alert.error("Error undoing strategy completion");
    } finally {
      setUncompletingStrategy(false);
    }
  }

  React.useEffect(() => {
    fetchStrategyData();
    fetchTradeCycles();
  }, [id]);

  const pnlColor = (val: number | null) => {
    if (val == null) return "";
    return val > 0
      ? "text-emerald-600 dark:text-emerald-400"
      : val < 0
        ? "text-red-600 dark:text-red-400"
        : "";
  };

  const toNum = (v: number | string | null | undefined): number | null => {
    if (v == null || v === "") return null;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-8 bg-base-300/60 rounded w-24 mb-6 animate-pulse" />
          <div className="h-10 bg-base-300/60 rounded w-72 mb-2 animate-pulse" />
          <div className="h-4 bg-base-300/60 rounded w-40 mb-8 animate-pulse" />
          <StrategyAdjustmentsSkeleton />
          <StrategyTradeCyclesSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-base-content/70 hover:text-primary mb-6 transition-colors"
        >
          <ChevronLeft className="size-4" />
          Back to strategies
        </Link>

        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
                <Layers className="size-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {strategy?.name}
                </h1>
                {strategy?.description && (
                  <p className="text-base-content/70 mt-1 text-sm">
                    {strategy.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-base-content/60">
                  <span>Created: {strategy?.created_at ? formatDateTimeMinutes(strategy.created_at) : "—"}</span>
                  <span>
                    PnL:{" "}
                    <span className={pnlColor(toNum(strategy?.pnl_total))}>
                      {toNum(strategy?.pnl_total) != null
                        ? formatMoneyIN(toNum(strategy.pnl_total)!)
                        : "—"}
                    </span>
                  </span>
                  <span>
                    WPNL:{" "}
                    <span className={pnlColor(toNum(strategy?.wpnl_total))}>
                      {toNum(strategy?.wpnl_total) != null
                        ? formatMoneyIN(toNum(strategy.wpnl_total)!)
                        : "—"}
                    </span>
                  </span>
                  <span>
                    Mid PNL:{" "}
                    <span className={pnlColor(toNum(strategy?.mid_wpnl_total))}>
                      {toNum(strategy?.mid_wpnl_total) != null
                        ? formatMoneyIN(toNum(strategy.mid_wpnl_total)!)
                        : "—"}
                    </span>
                  </span>
                  <span>
                    Spread:{" "}
                    <span className="font-medium text-base-content/80 tabular-nums">
                      {toNum(strategy?.atm_spread) != null
                        ? `${toNum(strategy.atm_spread)!.toFixed(2)}%`
                        : "—"}
                    </span>
                  </span>
                  <span>
                    WPNL updated:{" "}
                    {strategy?.wpnl_updated_at
                      ? formatDateTimeMinutes(strategy.wpnl_updated_at)
                      : "—"}
                  </span>
                  <span>
                    Spread updated:{" "}
                    {strategy?.spread_updated_at
                      ? formatDateTimeMinutes(strategy.spread_updated_at)
                      : "—"}
                  </span>
                  <span>
                    PnL updated:{" "}
                    {strategy?.pnl_updated_at
                      ? formatDateTimeMinutes(strategy.pnl_updated_at)
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowOptionChainModal(true)}
                disabled={!strategy?.underlying_names?.length}
                title={
                  strategy?.underlying_names?.length
                    ? "Live option chain and Greeks"
                    : "No underlyings on this strategy"
                }
                className="btn btn-outline btn-sm gap-1.5 border-base-content/20"
              >
                <Table2 className="size-4" />
                Option chains
              </button>
              {strategy?.completed ? (
                <>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
                    <CheckCircle className="size-4" />
                    Completed
                  </span>
                  <button
                    type="button"
                    onClick={uncompleteStrategy}
                    disabled={uncompletingStrategy}
                    className="btn btn-outline btn-sm gap-1.5"
                    title="Clear completed flag; reopens cycles closed in that completion window"
                  >
                    {uncompletingStrategy ? (
                      <span className="loading loading-spinner size-4" />
                    ) : (
                      <RotateCcw className="size-4" />
                    )}
                    Undo complete
                  </button>
                </>
              ) : (
                <button
                  onClick={completeStrategy}
                  disabled={completingStrategy}
                  className="btn btn-primary btn-sm gap-1.5"
                  title="Mark strategy as completed and close all trade cycles"
                >
                  {completingStrategy ? (
                    <span className="loading loading-spinner size-4" />
                  ) : (
                    <CheckCircle className="size-4" />
                  )}
                  Mark complete
                </button>
              )}
            </div>
          </div>
        </header>

        <hr className="border-base-300/60 mb-6" />

        <div className="mb-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 mb-2">
            <h2 className="text-lg font-semibold min-w-0 shrink sm:pr-2">
              Strategy adjustments ({Array.isArray(strategy?.versions) ? strategy.versions.length : 0})
            </h2>
            <div className="flex flex-wrap items-center gap-1 shrink-0">
              {!strategy?.completed && (
                <button
                  type="button"
                  onClick={() => setShowManualAdjustment(true)}
                  className="btn btn-ghost btn-sm gap-1.5 text-primary hover:bg-primary/10"
                >
                  <Plus className="size-4" />
                  Manual adjustment
                </button>
              )}
              <button
                type="button"
                onClick={() => fetchStrategyData({ silent: true })}
                disabled={strategyRefreshing}
                className={`btn btn-ghost btn-sm ${strategyRefreshing ? "animate-spin" : ""}`}
                title="Refresh strategy & adjustments"
              >
                <RotateCw size={18} />
              </button>

            </div>
          </div>
          <Adjustments
            adjustments={strategy?.versions ?? []}
            onRefresh={() => fetchStrategyData({ silent: true })}
          />
        </div>

        <hr className="border-base-300/60 mb-6" />

        <div>
          {tradeCyclesLoading ? (
            <StrategyTradeCyclesSkeleton />
          ) : (
            <TradeCycles
              id={strategyId}
              trade_cycles={trade_cycles}
              fetchTradeCycles={fetchTradeCycles}
              multiplierAllowed={strategy?.multiplier_allowed}
            />
          )}
        </div>

        {showManualAdjustment && (
          <ManualAdjustmentModal
            strategyId={strategyId}
            onClose={() => setShowManualAdjustment(false)}
            onSuccess={() => fetchStrategyData({ silent: true })}
          />
        )}

        {showOptionChainModal && strategy && (
          <StrategyOptionChainModal
            strategyId={strategyId}
            strategyName={strategy.name}
            exchange={strategy.exchange ?? "NFO"}
            underlyingNames={strategy.underlying_names ?? []}
            underlyingInstrumentTokens={strategy.underlying_instrument_tokens ?? {}}
            onClose={() => setShowOptionChainModal(false)}
          />
        )}
      </div>
    </div>
  );
}
