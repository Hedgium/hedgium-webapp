"use client";

// components/TradeCycleWithPositionsCard.tsx

import React, { JSX, useState, useEffect, useCallback } from "react";
import { Clock, CheckCircle, XCircle, RotateCw } from "lucide-react";
import { authFetch } from "@/utils/api";
import useAlert from "@/hooks/useAlert";
import TradeCyclePositionsSkeleton from "./skeletons/TradeCyclePositionsSkeleton";
import PositionsTable, { Position } from "./positions/PositionsTable";
import UnmappedOrdersTable, { UnmappedOrder } from "./positions/UnmappedOrdersTable";
import PositionsSummary from "./positions/PositionsSummary";


interface TradeCycle {
  id: string;
  name: string;
  description: string;
  state: "NEW" | "ACTIVATED" | "ADJUSTED" | "PENDING" | "COMPLETED" | "STOPPED";
  sub_state: string;
  created_at: string;
}

interface Props {
  tradeCycle: TradeCycle;
}

const TradeCycleWithPositionsCard: React.FC<Props> = ({ tradeCycle }) => {
  const alert = useAlert();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [unmappedOrders, setUnmappedOrders] = useState<UnmappedOrder[]>([])
  const [hasMorePositions, setHasMorePositions] = useState(false);
  const [hasMoreOrders, setHasMoreOrders] = useState(false);
  const [allLoaded, setAllLoaded] = useState(false);
  const [totals, setTotals] = useState<{
    total_pnl: number;
    realised_total: number;
    realised_today: number;
    unrealised_total: number;
    unrealised_today: number;
    unrealised: number;
    total_buy_qty: number;
    total_sell_qty: number;
  } | null>(null);

  const getTradeCyclePositions = useCallback(async (id: string, loadAll: boolean = false) => {
    if (loadAll) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    try {
      const url = loadAll 
        ? `trade-cycles/${tradeCycle.id}/details?load_all=true`
        : `trade-cycles/${tradeCycle.id}/details`;
      const res = await authFetch(url);
      const data = await res.json();
      console.log("data", data);
      setUnmappedOrders(data.unmapped_orders)
      setPositions(data.positions);
      setHasMorePositions(data.has_more_positions || false);
      setHasMoreOrders(data.has_more_orders || false);
      setTotals(data.totals || null);
      if (loadAll) {
        setAllLoaded(true);
      }
    } catch (error) {
      console.error("Error fetching positions:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [tradeCycle.id]);

  async function loadAllPositions() {
    await getTradeCyclePositions(tradeCycle.id, true);
  }

  /** 🔄 Refresh positions from broker */
  async function refreshPositions() {
    setRefreshing(true);
    try {
      const res = await authFetch(`positions/pnl/refresh/${tradeCycle.id}/`);
      const data = await res.json();

      // console.log("data", data);

      if (!res.ok) {
        throw new Error(data.detail || "Failed to refresh positions");
      }

      alert.success("Positions refreshed successfully");
      
      // Reset allLoaded since we're refreshing and might have new positions
      setAllLoaded(false);
      
      // Refetch positions after refresh
      await getTradeCyclePositions(tradeCycle.id);
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
    if (tradeCycle) getTradeCyclePositions(tradeCycle?.id);
  }, [tradeCycle, getTradeCyclePositions]);

  const statusMap: Record<string, JSX.Element> = {
    NEW: <Clock width={14} className="text-warning" />,
    PENDING: <Clock width={14} className="text-warning" />,
    COMPLETED: <CheckCircle width={14} className="text-success" />,
    STOPPED: <XCircle width={14} className="text-error" />,
  };

  if (loading) {
    return <TradeCyclePositionsSkeleton />;
  }

  return (
     <div id={tradeCycle.id} className="card bg-base-100 border border-base-300 rounded-xl w-full hover:shadow-sm transition-shadow">
      <div className="card-body p-4 flex flex-col flex-1">
        {/* Header */}
        <div className="flex justify-between items-start mb-3 pb-3 border-b border-base-300">
          <div className="flex items-center gap-2">
            <h3 className="card-title text-lg font-bold m-0">{tradeCycle.name}</h3>
            <span className="badge gap-1 badge-sm badge-outline">
              {statusMap[tradeCycle.state]} {tradeCycle.state}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {(tradeCycle?.state === "ACTIVATED" || tradeCycle?.state === "ADJUSTED") && <button
              onClick={refreshPositions}
              disabled={refreshing}
              className={`btn btn-ghost btn-sm ${refreshing ? "animate-spin" : ""}`}
              title="Refresh positions from broker"
            >
              <RotateCw size={16} />
            </button>}

            <div className="text-xs text-gray-500 flex flex-col items-end">
              <span>ID: {tradeCycle.id}</span>
              <span>Created: {new Date(tradeCycle.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* TOTALS SUMMARY */}
        <PositionsSummary positions={positions} totals={totals} />

        {/* POSITIONS */}
        <PositionsTable positions={positions} />
        {hasMorePositions && !allLoaded && (
          <button
            className="btn btn-ghost btn-sm mt-2 self-start"
            onClick={loadAllPositions}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <>Loading...</>
            ) : (
              <>Load More Positions</>
            )}
          </button>
        )}

        {/* UNMAPPED ORDERS */}
        <UnmappedOrdersTable
          orders={unmappedOrders}
          variant="card"
          showLoadMore={hasMoreOrders && !allLoaded}
          onLoadMore={loadAllPositions}
          loadingMore={loadingMore}
        />

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-base-300">
          <div className="flex-1"></div>
          {tradeCycle.state === "PENDING" && (
            <button className="btn btn-error btn-sm">Close Cycle</button>
          )}
        </div>
      </div>
    </div>

  );
};

export default TradeCycleWithPositionsCard;