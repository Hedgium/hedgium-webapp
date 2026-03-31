"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TradeCycleWithPositionsCard from "@/components/TradeCyclePositions";
import TradeCyclePositionsSkeleton from "@/components/skeletons/TradeCyclePositionsSkeleton";
import SandboxPageShell from "@/components/sandbox/SandboxPageShell";
import { sandboxFetch } from "@/utils/sandboxApi";
import { formatMoneyIN } from "@/utils/formatNumber";
import useAlert from "@/hooks/useAlert";
import { RotateCw, Briefcase, TrendingUp, ArrowRight } from "lucide-react";
import { useSandboxStore } from "@/store/sandboxStore";

type TradeCycle = {
  id: number;
  name: string;
  description: string;
  state: string;
  sub_state: string;
  created_at: string;
  updated_at?: string;
};

type PnlSummary = {
  month: string;
  m2m: number;
  realised: number;
  pnl: number;
  ytd_m2m: number;
  ytd_realised: number;
  ytd_pnl: number;
};

function signedClass(value: number): string {
  if (value > 0) return "text-success";
  if (value < 0) return "text-error";
  return "text-base-content/75";
}

export default function SandboxPositionsPage() {
  const router = useRouter();
  const { sandboxPlan } = useSandboxStore();
  const alert = useAlert();
  const [tradeCycles, setTradeCycles] = useState<TradeCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pnlSummary, setPnlSummary] = useState<PnlSummary | null>(null);
  const [loadingPnlSummary, setLoadingPnlSummary] = useState(true);

  useEffect(() => {
    if (!sandboxPlan) {
      router.replace("/sandbox");
      return;
    }
  }, [sandboxPlan, router]);

  async function getAllTradeCycles() {
    if (!sandboxPlan) return;
    try {
      const res = await sandboxFetch("trade-cycles/", sandboxPlan);
      if (!res.ok) throw new Error("Failed to fetch trade cycles");
      const data = await res.json();
      setTradeCycles(data.results || []);
    } catch (error) {
      console.error("Error fetching trade cycles:", error);
    }
  }

  async function fetchPnlSummary() {
    if (!sandboxPlan) return;
    setLoadingPnlSummary(true);
    try {
      const res = await sandboxFetch("positions-pnl-summary/", sandboxPlan);
      if (!res.ok) throw new Error("Failed to fetch PnL summary");
      const data = await res.json();
      setPnlSummary(data);
    } catch (error) {
      console.error("Error fetching PnL summary:", error);
    } finally {
      setLoadingPnlSummary(false);
    }
  }

  async function refreshAllPositions() {
    if (!sandboxPlan) return;
    setRefreshing(true);
    try {
      await getAllTradeCycles();
      await fetchPnlSummary();
      alert.success("Data refreshed");
    } catch (err) {
      alert.error("Failed to refresh");
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (sandboxPlan) {
      (async () => {
        setLoading(true);
        await getAllTradeCycles();
        await fetchPnlSummary();
        setLoading(false);
      })();
    }
  }, [sandboxPlan]);

  if (!sandboxPlan) return null;

  const fetchFn = (path: string) => sandboxFetch(path, sandboxPlan);
  const cycleCount = tradeCycles.length;

  return (
    <SandboxPageShell maxWidth="6xl">
      <section className="mb-8">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-base-content/45">
          Summary
        </p>
        {loadingPnlSummary ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-2xl border border-base-300/40 bg-base-100/70"
              />
            ))}
          </div>
        ) : pnlSummary ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-base-100/80 p-4">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-base-content/50">YTD</p>
              <p
                className={`text-lg font-bold tabular-nums leading-tight md:text-xl ${signedClass(pnlSummary.ytd_pnl)}`}
              >
                {formatMoneyIN(pnlSummary.ytd_pnl)}
              </p>
              <p className="mt-1 text-[11px] text-base-content/45">FY to date (sample)</p>
            </div>
            <div className="rounded-2xl border border-base-300/60 bg-base-200/35 p-4">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-base-content/50">
                <TrendingUp className="h-3.5 w-3.5 shrink-0 text-primary/80" aria-hidden />
                Monthly P&amp;L
              </div>
              <p
                className={`text-lg font-semibold tabular-nums leading-tight md:text-xl ${signedClass(pnlSummary.pnl)}`}
              >
                {formatMoneyIN(pnlSummary.pnl)}
              </p>
              <p className="mt-1 text-[11px] text-base-content/45">{pnlSummary.month}</p>
            </div>
            <div className="rounded-2xl border border-base-300/60 bg-base-200/35 p-4">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-base-content/50">Realised</p>
              <p
                className={`text-lg font-semibold tabular-nums leading-tight md:text-xl ${signedClass(pnlSummary.realised)}`}
              >
                {formatMoneyIN(pnlSummary.realised)}
              </p>
              <p className="mt-1 text-[11px] text-base-content/45">{pnlSummary.month}</p>
            </div>
            <div className="rounded-2xl border border-base-300/60 bg-base-200/35 p-4">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-base-content/50">M2M</p>
              <p
                className={`text-lg font-semibold tabular-nums leading-tight md:text-xl ${signedClass(pnlSummary.m2m)}`}
              >
                {formatMoneyIN(pnlSummary.m2m)}
              </p>
              <p className="mt-1 text-[11px] text-base-content/45">{pnlSummary.month}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-base-content/55">Summary unavailable.</p>
        )}
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" aria-hidden />
              <h2 className="text-xl font-semibold tracking-tight text-base-content md:text-2xl">
                Strategy-wise positions
              </h2>
            </div>
            <p className="text-sm text-base-content/55">
              Open positions grouped per trade cycle (sandbox sample)
              {!loading && cycleCount > 0 ? (
                <span className="text-base-content/40">
                  {" "}
                  · {cycleCount} cycle{cycleCount === 1 ? "" : "s"}
                </span>
              ) : null}
            </p>
          </div>
          <div
            className="tooltip tooltip-bottom sm:tooltip-left before:max-w-[14rem] before:text-left before:whitespace-normal before:px-3 before:py-2"
            data-tip="Refresh sandbox positions and summary from the server."
          >
            <button
              type="button"
              onClick={() => void refreshAllPositions()}
              disabled={refreshing}
              className="btn btn-circle btn-ghost shrink-0 self-start border border-base-300/70 bg-base-100/80 hover:border-primary/35 hover:bg-base-200/60 sm:self-auto"
              aria-label={refreshing ? "Refreshing" : "Refresh data"}
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
              <h3 className="text-lg font-semibold text-base-content">No trade cycles</h3>
              <p className="mt-2 text-sm leading-relaxed text-base-content/60">
                No sandbox positions for this plan. Try another plan or open strategies on the home tab.
              </p>
              <Link href="/sandbox/home" className="btn btn-primary btn-sm mt-6 gap-2 rounded-full">
                Go to sandbox home
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        )}
      </section>
    </SandboxPageShell>
  );
}
