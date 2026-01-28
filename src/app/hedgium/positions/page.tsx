"use client";

import React, { useEffect, useState } from "react";
import TradeCycleWithPositionsCard from "@/components/TradeCyclePositions";
import TradeCyclePositionsSkeleton from "@/components/skeletons/TradeCyclePositionsSkeleton";
// import LivePositionsModal from "@/components/LivePositionsModal";
import { LivePositionsData } from "@/types/positions";
import { authFetch } from "@/utils/api";
import useAlert from "@/hooks/useAlert";
import { RotateCw } from "lucide-react";

type TradeCycle = {
  id: string;
  name: string;
  description: string;
  state: "NEW" | "PENDING" | "COMPLETED" | "STOPPED";
  sub_state: string;
  created_at: string;
  updated_at: string;
};

type MonthlyPnlSummary = {
  month: string;
  m2m: number;
  realised: number;
  pnl: number;
};

export default function TradeCyclesPage() {
  const alert = useAlert();
  const [tradeCycles, setTradeCycles] = useState<TradeCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [monthlySummary, setMonthlySummary] = useState<MonthlyPnlSummary | null>(null);
  const [loadingMonthlySummary, setLoadingMonthlySummary] = useState(false);
  // const [showLivePositionsModal, setShowLivePositionsModal] = useState(false);
  // const [livePositions, setLivePositions] = useState<LivePositionsData | null>(null);
  // const [loadingLivePositions, setLoadingLivePositions] = useState(false);

  // Fetch trade cycles
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

  async function fetchMonthlySummary() {
    setLoadingMonthlySummary(true);
    try {
      const res = await authFetch("positions/pnl/monthly-summary/");
      if (!res.ok) {
        throw new Error("Failed to fetch monthly summary");
      }
      const data = await res.json();
      setMonthlySummary(data);
    } catch (error) {
      console.error("Error fetching monthly summary:", error);
    } finally {
      setLoadingMonthlySummary(false);
    }
  }

  // Global refresh positions from broker
  async function refreshAllPositions() {
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

      // Refetch all trade cycles to update positions
      await getAllTradeCycles();
      await fetchMonthlySummary();
    } catch (err: unknown) {
      console.error("Error refreshing positions:", err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : "Failed to refresh positions";
      alert.error(errorMessage);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    
    (async () => {
      await refreshAllPositions();
    })();
  }, []);

  useEffect(() => {
    
    (async () => {
      setLoading(true);
      await getAllTradeCycles();
      setLoading(false);
    })();
  }, []);

  return (
    <div className="p-4 md:px-8 bg-base-200 min-h-screen">
      <div className="mx-auto space-y-8">
        {/* --- Trade Cycles Section --- */}

        
        <section>
          <div className="bg-base-100 rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-2">Current Month Summary</h3>
            {loadingMonthlySummary ? (
              <div className="text-sm opacity-60">Loading monthly summary...</div>
            ) : monthlySummary ? (
              <div className="text-sm opacity-80">
                {monthlySummary.month} · PnL ₹{monthlySummary.pnl.toFixed(2)} · Realised ₹
                {monthlySummary.realised.toFixed(2)} · M2M ₹{monthlySummary.m2m.toFixed(2)}
              </div>
            ) : (
              <div className="text-sm opacity-60">Monthly summary unavailable</div>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-semibold">Positions</h2>
            </div>
            
            <button
              onClick={refreshAllPositions}
              disabled={refreshing}
              className={`btn btn-ghost btn-sm ${refreshing ? "animate-spin" : ""}`}
              title="Refresh all positions from broker"
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
                  tradeCycle={cycle}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-base-100 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-2">
                No Active Trade Cycles
              </h3>
              <p className="text-gray-600">
                {`You don't have any active trade cycles currently.`}
              </p>
            </div>
          )}
        </section>

      </div>

      <br />
      <br />

      {/* Live Positions Modal */}
      {/* <LivePositionsModal
        isOpen={showLivePositionsModal}
        onClose={() => setShowLivePositionsModal(false)}
        positions={livePositions}
        title="Live Positions"
      /> */}
    </div>
  );
}
