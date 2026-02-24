"use client";

import React, { useState } from "react";

// ----------------------------------------------------
import { useParams } from "next/navigation";
import { authFetch } from "@/utils/api";
import Adjustments from "@/components/admin/Adjustments";
import Link from "next/link";
import TradeCycles from "@/components/admin/TradeCycles";
import { formatDateOnly } from "@/utils/formatDate";
import useAlert from "@/hooks/useAlert";
import { CheckCircle } from "lucide-react";
import StrategyAdjustmentsSkeleton from "@/components/skeletons/StrategyAdjustmentsSkeleton";
import StrategyTradeCyclesSkeleton from "@/components/skeletons/StrategyTradeCyclesSkeleton";


export default function StrategyDetail() {

  const [strategy, setStrategy] = useState<any>(null);
  const [trade_cycles, setTradeCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tradeCyclesLoading, setTradeCyclesLoading] = useState(false);
  const [completingStrategy, setCompletingStrategy] = useState(false);
  const alert = useAlert();

  const params = useParams<{ id: string }>();
  const { id } = params;
  const strategyId = Number(id);


  async function fetchStrategyData() {
    setLoading(true);
    try {
      const res = await authFetch(`myadmin/strategies/${id}/`);
      const data = await res.json();
      setStrategy(data);
    } catch (error) {
      console.error("Error fetching strategy data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTradeCycles() {
    try {
      setTradeCyclesLoading(true);
      const res = await authFetch(`myadmin/trade-cycles/${id}/?page=1&page_size=100`);
      const data = await res.json();

      // console.log("Fetched trade cycles data:", data);
      // console.log("Fetched trade cycles data:", data);
      setTradeCycles(data.results);

    } catch (error) {
      console.error("Error fetching strategy data:", error);
    } finally {
      setTradeCyclesLoading(false);
    }
  }


  async function completeStrategy() {
    if (!confirm("Are you sure you want to mark this strategy as completed? This will close all associated trade cycles.")) {
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
        // Refresh strategy data
        await fetchStrategyData();
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

  React.useEffect(() => {
    // Reset selections when strategy changes (if applicable)
    fetchStrategyData();
    fetchTradeCycles();
  }, [id]);


  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-6 bg-base-300 rounded w-32 mb-2 animate-pulse" />
        <div className="h-8 bg-base-300 rounded w-64 mb-4 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 mb-4 animate-pulse">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="stat bg-base-200 rounded-lg shadow">
              <div className="h-4 bg-base-300 rounded w-20 mb-2" />
              <div className="h-6 bg-base-300 rounded w-16" />
            </div>
          ))}
        </div>
        <StrategyAdjustmentsSkeleton />
        <StrategyTradeCyclesSkeleton />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">

      <Link href="/admin/strategy" className="btn btn-sm btn-outline btn-ghost mb-2">
        {`← Back`}
      </Link>
      {/* HEADER */}
      <div className="space-y-2">
        <div className="py-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">{strategy.name}</h3>
              <p className="mt-1 text-sm opacity-80">{strategy.description}</p>

              <p className="text-xs mt-1">
                <b>Validity:</b> {formatDateOnly(strategy.validity_start)}

                {strategy.source && (
                <span className="text-xs opacity-70">Source: {strategy.source}</span>
              )}

              </p>
            </div>
            {!strategy.completed && (
              <button
                onClick={completeStrategy}
                disabled={completingStrategy}
                className="btn btn-primary btn-sm"
                title="Mark strategy as completed and close all trade cycles"
              >
                {completingStrategy ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Mark As Complete
                  </>
                )}
              </button>
            )}
            {strategy.completed && (
              <div className="badge badge-success badge-lg gap-2">
                <CheckCircle size={16} />
                Completed
              </div>
            )}
          </div>
          
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
          <div className="stat bg-base-200 rounded-lg shadow">
            <div className="stat-title">Adjustments</div>
            <div className="stat-value text-2xl">
              {Array.isArray(strategy.versions) ? strategy.versions.length : 0}
            </div>
          </div>

          <div className="stat bg-base-200 rounded-lg shadow">
            <div className="stat-title">Trade Cycles</div>
            <div className="stat-value text-2xl">{strategy.trade_cycle_count ?? 0}</div>
          </div>
          
          <div className="stat bg-base-200 rounded-lg shadow">
            <div className="stat-title">Total PnL</div>
            <div className={`stat-value text-2xl ${
              strategy.total_pnl !== null && strategy.total_pnl !== undefined
                ? strategy.total_pnl > 0 
                  ? "text-green-400" 
                  : strategy.total_pnl < 0 
                    ? "text-red-400" 
                    : ""
                : ""
            }`}>
              {strategy.total_pnl !== null && strategy.total_pnl !== undefined
                ? `₹${Number(strategy.total_pnl).toFixed(2)}`
                : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* LEGS TABLE */}
      <div>
        <h4 className="text-lg font-semibold mb-2">Strategy Adjustments</h4>
        <Adjustments adjustments={strategy.versions} onRefresh={fetchStrategyData} />
      </div>

      <hr className="border-base-300" />


      {/* TRADE CYCLES TABLE */}
      <div>
        {tradeCyclesLoading ? (
          <StrategyTradeCyclesSkeleton />
        ) : (
          <TradeCycles
            id={strategyId}
            trade_cycles={trade_cycles}
            fetchTradeCycles={fetchTradeCycles}
            multiplierAllowed={strategy.multiplier_allowed}
          />
        )}
      </div>

    </div>
  );
}
