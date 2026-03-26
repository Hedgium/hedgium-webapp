"use client";

// components/TradeCycleWithPositionsCard.tsx

import React, { JSX, useState, useEffect, useCallback } from "react";
import { Clock, CheckCircle, XCircle } from "lucide-react";
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

type FetchFn = (path: string) => Promise<Response>;

interface Props {
  tradeCycle: TradeCycle;
  fetchFn?: FetchFn;
}

const TradeCycleWithPositionsCard: React.FC<Props> = ({ tradeCycle, fetchFn }) => {
  const alert = useAlert();
  const doFetch = fetchFn ?? authFetch;
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
    unrealised_total: number;
    total_buy_qty: number;
    total_sell_qty: number;
  } | null>(null);

  const getTradeCyclePositions = useCallback(async (id: string, loadAll: boolean = false) => {
    if (loadAll) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setAllLoaded(false);
    }
    try {
      const url = loadAll 
        ? `trade-cycles/${tradeCycle.id}/details?load_all=true`
        : `trade-cycles/${tradeCycle.id}/details`;
      const res = await doFetch(url);
      const data = await res.json();
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
    <div
      id={tradeCycle.id}
      className="group relative w-full overflow-hidden rounded-2xl border border-base-300/70 bg-base-100/80 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20"
    >
      {/* <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
        aria-hidden
      /> */}
      <div className="card-body flex flex-1 flex-col p-4 md:p-6">
        <div className="mb-4 flex flex-col gap-3 border-b border-base-300/60 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <h3 className="text-lg font-semibold leading-snug tracking-tight text-base-content md:text-xl">
              {tradeCycle.name}
            </h3>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-base-300/70 bg-base-200/50 px-2.5 py-0.5 text-xs font-medium text-base-content/85">
              {statusMap[tradeCycle.state]} {tradeCycle.state}
            </span>
          </div>
          <div className="shrink-0 text-right text-[11px] tabular-nums text-base-content/45">
            <div>#{tradeCycle.id}</div>
            <div className="mt-0.5">{new Date(tradeCycle.created_at).toLocaleDateString()}</div>
          </div>
        </div>

        {/* TOTALS SUMMARY */}
        <PositionsSummary positions={positions} totals={totals} />

        {/* POSITIONS */}
        <PositionsTable positions={positions} />
        {hasMorePositions && !allLoaded && (
          <button
            type="button"
            className="btn btn-ghost btn-sm mt-3 self-start rounded-full font-medium normal-case text-base-content/80 hover:bg-base-200/80"
            onClick={loadAllPositions}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <>Loading…</>
            ) : (
              <>Load more positions</>
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
      </div>
    </div>

  );
};

export default TradeCycleWithPositionsCard;