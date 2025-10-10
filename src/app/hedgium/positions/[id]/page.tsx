"use client";

import React, { JSX, useEffect, useState } from "react";
import {
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { authFetch } from "@/utils/api";

import { formatDateOnly } from "@/utils/formatDate";

type Position = {
  id: number;
  symbol: string;
  buy_quantity: number;
  average_buy_price: number;
  sell_quantity: number;
  average_sell_price: number;
  quantity: number;
  realised_total: number;
  realised_today: number;
  unrealised: number;
  pnl: number;
};

type UnmappedOrder = {
  id: number;
  instrument: string;
  action: string;
  quantity: number;
  price: number;
  status: string;
  order_type: string;
};

type TradeCycle = {
  id: string;
  name: string;
  description: string;
  state: "NEW" | "PENDING" | "COMPLETED" | "STOPPED" | "ACTIVATED";
  sub_state: string;
  created_at: string;
  updated_at: string;
};

type TradeCycleDetailResponse = {
  trade_cycle: TradeCycle;
  positions: Position[];
  unmapped_orders: UnmappedOrder[];
};

export default function TradeCycleDetailPage() {
  const params = useParams<{ id: string }>();
  const { id } = params;

  const [tradeCycleDetail, setTradeCycleDetail] =
    useState<TradeCycleDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchTradeCycleDetails() {
    setLoading(true);
    const res = await authFetch(`trade-cycles/${id}/details`);
    const data = await res.json();
    setTradeCycleDetail(data);
    console.log(data);
    setLoading(false);
  }

  useEffect(() => {
    if (id) fetchTradeCycleDetails();
  }, [id]);

  const statusMap: Record<string, JSX.Element> = {
    NEW: <Clock width={16} className="text-warning" />,
    PENDING: <Clock width={16} className="text-warning" />,
    COMPLETED: <CheckCircle width={16} className="text-success" />,
    STOPPED: <XCircle width={16} className="text-error" />,
    ACTIVATED: <Clock width={16} className="text-info" />,
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="loading loading-spinner text-primary"></span>
      </div>
    );

  if (!tradeCycleDetail)
    return <p className="text-center mt-10">No trade cycle found.</p>;

  const { trade_cycle, positions, unmapped_orders } = tradeCycleDetail;

  const totalPnl = positions.reduce((acc, pos) => acc + pos.pnl, 0);
  const realisedPnl = positions.reduce((acc, pos) => acc + pos.realised_total, 0);
  const unrealisedPnl = positions.reduce((acc, pos) => acc + pos.unrealised, 0);

  const totalBuyQty = positions.reduce((acc, pos) => acc + pos.buy_quantity, 0);
  const totalSellQty = positions.reduce((acc, pos) => acc + pos.sell_quantity, 0);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="card-title text-2xl">{trade_cycle.name}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {trade_cycle.description}
              </p>
              <div className="flex gap-2 mt-2">
                <span className="badge">{trade_cycle.sub_state}</span>
                <span className="badge gap-1">
                  {statusMap[trade_cycle.state]} {trade_cycle.state}
                </span>
              </div>
            </div>
            <div className="text-sm text-gray-500 text-right">
              <div>
                Created:{" "}
                {formatDateOnly(trade_cycle.created_at)}
              </div>
              <div>
                Updated:{" "}
                {new Date(trade_cycle.updated_at).toLocaleDateString("en-IN")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PERFORMANCE SUMMARY */}
      <div className="stats shadow w-full bg-base-200">
        <div className="stat">
          <div className="stat-title">Total Positions</div>
          <div className="stat-value">{positions.length}</div>
        </div>

        <div className="stat">
          <div className="stat-title">Total PnL</div>
          <div
            className={`stat-value text-lg ${
              totalPnl >= 0 ? "text-success" : "text-error"
            }`}
          >
            {totalPnl >= 0 ? (
              <ArrowUpRight width={16} className="inline mr-1" />
            ) : (
              <ArrowDownRight width={16} className="inline mr-1" />
            )}
            ₹{totalPnl.toFixed(2)}
          </div>
        </div>

        <div className="stat">
          <div className="stat-title">Realised PnL</div>
          <div className="stat-value text-success">₹{realisedPnl.toFixed(2)}</div>
        </div>

        <div className="stat">
          <div className="stat-title">Unrealised PnL</div>
          <div className="stat-value text-info">₹{unrealisedPnl.toFixed(2)}</div>
        </div>

        <div className="stat">
          <div className="stat-title">Buy vs Sell</div>
          <div className="stat-value text-primary">
            {totalBuyQty} / {totalSellQty}
          </div>
        </div>
      </div>

      {/* POSITIONS */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <div className="flex justify-between items-center mb-3">
            <h3 className="card-title text-lg">Positions</h3>
            <button
              className="btn btn-sm btn-ghost flex items-center gap-1"
              onClick={fetchTradeCycleDetails}
            >
              <RefreshCw width={14} /> Refresh
            </button>
          </div>

          {positions.length === 0 ? (
            <p className="text-sm text-gray-500">No positions yet.</p>
          ) : (
            <div className="space-y-3">
              {positions.map((pos) => {
                const pnlColor = pos.pnl >= 0 ? "text-success" : "text-error";
                return (
                  <div
                    key={pos.id}
                    className="flex justify-between items-center bg-base-200 rounded-lg p-3"
                  >
                    <div>
                      <div className="font-medium">{pos.symbol}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Net Qty: {pos.quantity} | Buy: {pos.buy_quantity} @ ₹
                        {pos.average_buy_price} | Sell: {pos.sell_quantity} @ ₹
                        {pos.average_sell_price}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Realised Total: ₹{pos.realised_total} | Realised Today: ₹
                        {pos.realised_today} | Unrealised: ₹{pos.unrealised}
                      </div>
                    </div>
                    <div
                      className={`text-right font-semibold flex items-center gap-1 ${pnlColor}`}
                    >
                      {pos.pnl >= 0 ? (
                        <TrendingUp width={14} />
                      ) : (
                        <TrendingDown width={14} />
                      )}
                      ₹{pos.pnl.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* UNMAPPED ORDERS */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h3 className="card-title text-lg mb-3">Unmapped Orders</h3>
          {unmapped_orders.length === 0 ? (
            <p className="text-sm text-gray-500">No unmapped orders.</p>
          ) : (
            <div className="space-y-3">
              {unmapped_orders.map((ord) => {
                const isBuy = ord.action === "BUY";
                const actionColor = isBuy ? "text-success" : "text-error";
                return (
                  <div
                    key={ord.id}
                    className="flex justify-between items-center bg-base-200 rounded-lg p-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{ord.instrument}</span>
                        <span
                          className={`text-xs font-semibold ${actionColor}`}
                        >
                          {ord.action}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Qty: {ord.quantity} @ ₹{ord.price} ({ord.order_type})
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Status: {ord.status}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ACTIONS */}
      <div className="mt-6 flex justify-end gap-3">
        {trade_cycle.state === "PENDING" && (
          <button className="btn btn-outline btn-error">Close Trade Cycle</button>
        )}
        <Link
          href={`/hedgium/trade-cycle/${trade_cycle.id}/edit`}
          className="btn btn-primary"
        >
          Modify
        </Link>
      </div>
    </div>
  );
}
