"use client";

// components/TradeCycleWithPositionsCard.tsx

import React, { JSX, useState, useEffect, useCallback } from "react";
import { Clock, CheckCircle, XCircle, TrendingUp, TrendingDown, RotateCw } from "lucide-react";
import { authFetch } from "@/utils/api";
import useAlert from "@/hooks/useAlert";
import TradeCyclePositionsSkeleton from "./skeletons/TradeCyclePositionsSkeleton";


interface Position {
  id: number;
  instrument: string;
  buy_quantity: number;
  average_buy_price: number;
  sell_quantity: number;
  average_sell_price: number;
  quantity: number;
  realised_total: number;
  realised_today: number;
  unrealised: number;
  pnl: number;
}

interface UnmappedOrder {
  id: number;
  instrument: string;
  action: string;
  quantity: number;
  price: number;
  status: string;
  order_type: string;
}


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
      setUnmappedOrders(data.unmapped_orders)
      setPositions(data.positions);
      setHasMorePositions(data.has_more_positions || false);
      setHasMoreOrders(data.has_more_orders || false);
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

      if (!res.ok) {
        throw new Error(data.detail || "Failed to refresh positions");
      }

      alert.success("Positions refreshed successfully");
      
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

  // Calculate totals
  const totalPnl = positions.reduce((acc, pos) => acc + pos.pnl, 0);
  const realisedPnl = positions.reduce((acc, pos) => acc + pos.realised_total, 0);
  const realisedToday = positions.reduce((acc, pos) => acc + pos.realised_today, 0);
  const unrealisedPnl = positions.reduce((acc, pos) => acc + pos.unrealised, 0);
  const totalBuyQty = positions.reduce((acc, pos) => acc + pos.buy_quantity, 0);
  const totalSellQty = positions.reduce((acc, pos) => acc + pos.sell_quantity, 0);

  const totalPnlColor = totalPnl >= 0 ? "text-success" : "text-error";

  if (loading) {
    return <TradeCyclePositionsSkeleton />;
  }

  return (
     <div className="card bg-base-100 border border-base-300 rounded-xl w-full hover:shadow-sm transition-shadow">
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
        {positions.length > 0 && (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-3 p-3 bg-base-200 rounded-lg">
            <div className="text-center">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total PnL</div>
              <div className={`text-base font-bold flex items-center justify-center gap-1 ${totalPnlColor}`}>
                {totalPnl >= 0 ? (
                  <TrendingUp width={14} />
                ) : (
                  <TrendingDown width={14} />
                )}
                ₹{totalPnl.toFixed(2)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Realised Total</div>
              <div className="text-base font-semibold">₹{(realisedPnl+realisedToday).toFixed(2)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Realised Today</div>
              <div className="text-base font-semibold">₹{realisedToday.toFixed(2)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Unrealised</div>
              <div className="text-base font-semibold">₹{unrealisedPnl.toFixed(2)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Buy Qty</div>
              <div className="text-base font-semibold">{totalBuyQty}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Sell Qty</div>
              <div className="text-base font-semibold">{totalSellQty}</div>
            </div>
          </div>
        )}

        {/* POSITIONS */}
        {positions?.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-3">No positions yet.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase">
                    <th>Instrument</th>
                    <th>Net</th>
                    <th>Buy</th>
                    <th>Buy Avg</th>
                    <th>Sell</th>
                    <th>Sell Avg</th>
                    <th>Realised</th>
                    <th>Unrealised</th>
                    <th>PnL</th>
                  </tr>
                </thead>
                <tbody>
                  {positions?.map((pos) => {
                    const pnlColor = pos.pnl >= 0 ? "text-success" : "text-error";
                    return (
                      <tr key={pos.id} className="hover:bg-base-200">
                        <td className="font-semibold">{pos.instrument}</td>
                        <td>{pos.quantity}</td>
                        <td>{pos.buy_quantity || '-'}</td>
                        <td>{pos.average_buy_price ? `₹${pos.average_buy_price.toFixed(2)}` : '-'}</td>
                        <td>{pos.sell_quantity || '-'}</td>
                        <td>{pos.average_sell_price ? `₹${pos.average_sell_price.toFixed(2)}` : '-'}</td>
                        <td>₹{(pos.realised_total+pos.realised_today).toFixed(2)}</td>
                        <td>₹{pos.unrealised.toFixed(2)}</td>
                        <td className={pnlColor}>
                          <div className="flex items-center gap-1 font-semibold">
                            {pos.pnl >= 0 ? (
                              <TrendingUp width={12} />
                            ) : (
                              <TrendingDown width={12} />
                            )}
                            ₹{pos.pnl.toFixed(2)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
          </>
        )}

        {/* UNMAPPED ORDERS */}
        {unmappedOrders?.length > 0 && (
          <div className="mt-3 pt-3 border-t border-base-300">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-500 uppercase">Unmapped Orders</h4>
              <span className="badge badge-sm badge-warning">{unmappedOrders.length}</span>
            </div>
            <div className="space-y-2">
              {unmappedOrders?.map((ord) => {
                const isBuy = ord.action === "BUY";

                return (
                  <div
                    key={ord.id}
                    className="bg-base-200 p-2 rounded text-sm flex justify-between items-center"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{ord.instrument}</span>
                      <span className={`badge badge-sm ${isBuy ? 'badge-success' : 'badge-error'}`}>
                        {ord.action}
                      </span>
                    </div>
                    <div className="text-gray-500">
                      {ord.quantity} @ ₹{ord.price} • {ord.status}
                    </div>
                  </div>
                );
              })}
            </div>
            {hasMoreOrders && !allLoaded && (
              <button
                className="btn btn-ghost btn-sm mt-2 self-start"
                onClick={loadAllPositions}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>Loading...</>
                ) : (
                  <>Load More Orders</>
                )}
              </button>
            )}
          </div>
        )}

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