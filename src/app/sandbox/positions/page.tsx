"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TradeCycleWithPositionsCard from "@/components/TradeCyclePositions";
import TradeCyclePositionsSkeleton from "@/components/skeletons/TradeCyclePositionsSkeleton";
import { sandboxFetch } from "@/utils/sandboxApi";
import { formatMoneyIN } from "@/utils/formatNumber";
import useAlert from "@/hooks/useAlert";
import { RotateCw } from "lucide-react";
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

  return (
    <div className="p-4 md:px-8 bg-base-200 min-h-screen">
      <div className="mx-auto space-y-8">
        <section>
          <div className="bg-base-100 rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-2">Summary</h3>
            {loadingPnlSummary ? (
              <div className="text-sm opacity-60">Loading summary...</div>
            ) : pnlSummary ? (
              <div className="text-sm opacity-80">
                Ytd PNL: {formatMoneyIN(pnlSummary.ytd_pnl)}, {pnlSummary.month}: PnL{" "}
                {formatMoneyIN(pnlSummary.pnl)}, Realised {formatMoneyIN(pnlSummary.realised)}, M2M{" "}
                {formatMoneyIN(pnlSummary.m2m)}
              </div>
            ) : (
              <div className="text-sm opacity-60">Summary unavailable</div>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Positions</h2>
            <button
              onClick={refreshAllPositions}
              disabled={refreshing}
              className={`btn btn-ghost btn-sm ${refreshing ? "animate-spin" : ""}`}
              title="Refresh data"
            >
              <RotateCw size={16} />
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-4">
              {[...Array(3)].map((_, i) => (
                <TradeCyclePositionsSkeleton key={i} />
              ))}
            </div>
          ) : tradeCycles.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {tradeCycles.map((cycle) => (
                <TradeCycleWithPositionsCard
                  key={cycle.id}
                  tradeCycle={{
                    ...cycle,
                    id: String(cycle.id),
                    state: cycle.state as "NEW" | "ACTIVATED" | "ADJUSTED" | "PENDING" | "COMPLETED" | "STOPPED",
                  }}
                  fetchFn={fetchFn}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-base-100 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-2">No Trade Cycles</h3>
              <p className="text-base-content/60">
                No data available for this plan.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
