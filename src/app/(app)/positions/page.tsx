"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import TradeCycleWithPositionsCard from "@/components/TradeCyclePositions";
import TradeCyclePositionsSkeleton from "@/components/skeletons/TradeCyclePositionsSkeleton";
import { authFetch } from "@/utils/api";
import { formatMoneyIN } from "@/utils/formatNumber";
import useAlert from "@/hooks/useAlert";
import { RotateCw, Briefcase, ArrowRight, TrendingUp } from "lucide-react";

type TradeCycle = {
  id: string;
  name: string;
  description: string;
  state: "NEW" | "PENDING" | "COMPLETED" | "STOPPED";
  sub_state: string;
  created_at: string;
  updated_at: string;
};

type PnlSummary = {
  month: string;
  m2m: number;
  realised: number;
  pnl: number;
  ytd_pnl: number;
};

function signedClass(value: number): string {
  if (value > 0) return "text-success";
  if (value < 0) return "text-error";
  return "text-base-content/75";
}

export default function PositionsPage() {
  const alert = useAlert();
  const [tradeCycles, setTradeCycles] = useState<TradeCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pnlSummary, setPnlSummary] = useState<PnlSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  async function getAllTradeCycles() {
    try {
      const res = await authFetch("trade-cycles/");
      if (!res.ok) throw new Error("Failed to fetch trade cycles");
      const data = await res.json();
      setTradeCycles(data.results);
    } catch (error) {
      console.error("Error fetching trade cycles:", error);
    }
  }

  const fetchPnlSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const res = await authFetch("positions/pnl/summary/");
      if (!res.ok) {
        setPnlSummary(null);
        return;
      }
      const data = await res.json();
      setPnlSummary(data);
    } catch (error) {
      console.error("Error fetching PnL summary:", error);
      setPnlSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  async function reloadPositions() {
    setRefreshing(true);
    try {
      alert.success("Positions refresh started");
      const res = await authFetch("positions/pnl/refresh/trades/async/", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to refresh positions");
      }

      const taskId = data.task_id as string | undefined;
      if (!taskId) {
        throw new Error("Refresh task not started");
      }

      const maxAttempts = 30;
      let completed = false;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const statusRes = await authFetch(`tasks/status/${taskId}/`);
        const statusData = await statusRes.json();

        if (!statusRes.ok) {
          throw new Error(statusData.detail || "Failed to check refresh status");
        }

        if (statusData.status === "SUCCESS") {
          completed = true;
          break;
        }
        if (statusData.status === "FAILURE") {
          throw new Error(statusData.result || "Refresh failed");
        }
      }

      if (!completed) {
        alert.success("Refresh running in background");
        return;
      }

      alert.success("Positions refreshed successfully");
      await getAllTradeCycles();
      await fetchPnlSummary();
    } catch (err: unknown) {
      console.error("Error refreshing positions:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to refresh positions";
      alert.error(errorMessage);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([getAllTradeCycles(), fetchPnlSummary()]);
      setLoading(false);
    })();
  }, [fetchPnlSummary]);

  const cycleCount = tradeCycles.length;

  return (
    <div className="relative min-h-screen">
 
      <div className="relative mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
        <h1 className="sr-only">Positions</h1>

        {/* PnL summary — positions/pnl/summary/ (cycles scoped by total_updated_at on backend) */}
        <section className="mb-8" aria-labelledby="positions-summary-heading">
            {/* <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" /> */}
            <h2
              id="positions-summary-heading"
              className="m-0 mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-base-content/70"
            >
              Summary
            </h2>

            {loadingSummary ? (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-24 animate-pulse rounded-2xl border border-base-300/40 bg-base-100/70"
                  />
                ))}
              </div>
            ) : pnlSummary ? (
              <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-base-100/80 p-4">
                  <dt className="mb-1 text-xs font-medium uppercase tracking-wider text-base-content/70">YTD</dt>
                  <dd className={`m-0 text-lg font-bold tabular-nums leading-tight md:text-xl ${signedClass(pnlSummary.ytd_pnl)}`}>
                    {formatMoneyIN(pnlSummary.ytd_pnl)}
                  </dd>
                  <dd className="m-0 mt-1 text-[11px] text-base-content/70">FY to date</dd>
                </div>
                <div className="rounded-2xl border border-base-300/60 bg-base-200/35 p-4">
                  <dt className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-base-content/70">
                    <TrendingUp className="h-3.5 w-3.5 shrink-0 text-primary/80" aria-hidden />
                    Monthly P&amp;L
                  </dt>
                  <dd className={`m-0 text-lg font-semibold tabular-nums leading-tight md:text-xl ${signedClass(pnlSummary.pnl)}`}>
                    {formatMoneyIN(pnlSummary.pnl)}
                  </dd>
                  <dd className="m-0 mt-1 text-[11px] text-base-content/70">{pnlSummary.month}</dd>
                </div>
                <div className="rounded-2xl border border-base-300/60 bg-base-200/35 p-4">
                  <dt className="mb-1 text-xs font-medium uppercase tracking-wider text-base-content/70">Realised</dt>
                  <dd className={`m-0 text-lg font-semibold tabular-nums leading-tight md:text-xl ${signedClass(pnlSummary.realised)}`}>
                    {formatMoneyIN(pnlSummary.realised)}
                  </dd>
                  <dd className="m-0 mt-1 text-[11px] text-base-content/70">{pnlSummary.month}</dd>
                </div>
                <div className="rounded-2xl border border-base-300/60 bg-base-200/35 p-4">
                  <dt className="mb-1 text-xs font-medium uppercase tracking-wider text-base-content/70">M2M</dt>
                  <dd className={`m-0 text-lg font-semibold tabular-nums leading-tight md:text-xl ${signedClass(pnlSummary.m2m)}`}>
                    {formatMoneyIN(pnlSummary.m2m)}
                  </dd>
                  <dd className="m-0 mt-1 text-[11px] text-base-content/70">{pnlSummary.month}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-base-content/70">Summary unavailable.</p>
            )}
        </section>

        <section className="space-y-6" aria-labelledby="strategy-positions-heading">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" aria-hidden />
                <h2
                  id="strategy-positions-heading"
                  className="text-xl font-semibold tracking-tight text-base-content md:text-2xl"
                >
                  Strategy-wise Positions
                </h2>
              </div>
              <p className="text-sm text-base-content/70">
                Open positions and orders grouped per trade cycle
                {!loading && cycleCount > 0 ? (
                  <span className="text-base-content/70">
                    {" "}
                    · {cycleCount} cycle{cycleCount === 1 ? "" : "s"}
                  </span>
                ) : null}
              </p>
            </div>
            <div
              className="tooltip tooltip-bottom sm:tooltip-left before:max-w-[14rem] before:text-left before:whitespace-normal before:px-3 before:py-2"
              data-tip="Reload positions from your broker. Fetches the latest fills and holdings."
            >
              <button
                type="button"
                onClick={() => void reloadPositions()}
                disabled={refreshing}
                aria-busy={refreshing}
                className="btn btn-circle btn-ghost shrink-0 self-start min-h-11 min-w-11 border border-base-300/70 bg-base-100/80 hover:border-primary/35 hover:bg-base-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:self-auto"
                aria-label={refreshing ? "Reloading positions" : "Reload positions"}
              >
                <RotateCw
                  className={`h-5 w-5 text-base-content/90 ${refreshing ? "animate-spin" : ""}`}
                  aria-hidden
                />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6">
              {[...Array(3)].map((_, i) => (
                <TradeCyclePositionsSkeleton key={i} />
              ))}
            </div>
          ) : tradeCycles.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {tradeCycles.map((cycle) => (
                <TradeCycleWithPositionsCard key={cycle.id} tradeCycle={cycle} />
              ))}
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-2xl border border-dashed border-base-300/70 bg-base-100/40 px-6 py-16 text-center backdrop-blur-sm md:px-12">
              <div
                className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/5 blur-2xl"
                aria-hidden
              />
              <div className="relative mx-auto max-w-md">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-base-300/60 bg-base-200/50">
                  <Briefcase className="h-7 w-7 text-primary/80" aria-hidden />
                </div>
                <h3 className="text-lg font-semibold text-base-content">No trade cycles yet</h3>
                <p className="mt-2 text-sm leading-relaxed text-base-content/70">
                  When you have active cycles, positions will show here. You can also try reloading after syncing your broker.
                </p>
                <Link href="/home" className="btn btn-primary btn-sm mt-6 gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100">
                  Go to home
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
