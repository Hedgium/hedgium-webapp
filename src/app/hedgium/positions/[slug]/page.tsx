// app/hedgium/trade-cycle/[id]/page.tsx
"use client";

import React, { JSX } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

// Types
type Position = {
  id: number;
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  side: "BUY" | "SELL";
  status: string;
};

type TradeCycle = {
  id: number;
  name: string;
  description: string;
  state: "NEW" | "PENDING" | "COMPLETED" | "STOPPED";
  sub_state: string;
  created_at: string;
  positions: Position[];
};

// Dummy fetcher (replace with real API call)
function getTradeCycle(id: string): TradeCycle | null {
  const dummy: TradeCycle = {
    id: 1,
    name: "NIFTY Option Strategy",
    description: "Intraday Iron Fly with hedges",
    state: "PENDING",
    sub_state: "RUNNING",
    created_at: "2025-09-01T10:30:00Z",
    positions: [
      {
        id: 101,
        symbol: "NIFTY23SEP18000CE",
        quantity: 50,
        entryPrice: 120,
        currentPrice: 135,
        side: "SELL",
        status: "OPEN",
      },
      {
        id: 102,
        symbol: "NIFTY23SEP18200PE",
        quantity: 50,
        entryPrice: 110,
        currentPrice: 95,
        side: "BUY",
        status: "OPEN",
      },
    ],
  };

  if (String(dummy.id) !== id) return null;
  return dummy;
}

export default function TradeCycleDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const tradeCycle = getTradeCycle("1");

  if (!tradeCycle) {
    // Redirect to 404 if not found
    router.push("/404");
    return null;
  }

  const statusMap: Record<string, JSX.Element> = {
    NEW: <Clock size={16} className="text-warning" />,
    PENDING: <Clock size={16} className="text-warning" />,
    COMPLETED: <CheckCircle size={16} className="text-success" />,
    STOPPED: <XCircle size={16} className="text-error" />,
  };

  const totalPnl = tradeCycle.positions.reduce((acc, pos) => {
    const pnl =
      pos.side === "BUY"
        ? (pos.currentPrice - pos.entryPrice) * pos.quantity
        : (pos.entryPrice - pos.currentPrice) * pos.quantity;
    return acc + pnl;
  }, 0);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="card bg-base-100 shadow-md mb-6">
        <div className="card-body">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="card-title text-2xl">{tradeCycle.name}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {tradeCycle.description}
              </p>
              <div className="flex gap-2 mt-2">
                <span className="badge">{tradeCycle.sub_state}</span>
                <span className="badge gap-1">
                  {statusMap[tradeCycle.state] ?? <Clock size={16} />}
                  {tradeCycle.state}
                </span>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Created:{" "}
              {new Date(tradeCycle.created_at).toLocaleDateString("en-IN")}
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="stats shadow mb-6 w-full">
        <div className="stat">
          <div className="stat-title">Total Positions</div>
          <div className="stat-value">{tradeCycle.positions.length}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Total PnL</div>
          <div
            className={`stat-value text-lg ${
              totalPnl >= 0 ? "text-success" : "text-error"
            }`}
          >
            {totalPnl >= 0 ? (
              <ArrowUpRight className="inline mr-1" />
            ) : (
              <ArrowDownRight className="inline mr-1" />
            )}
            ₹{totalPnl.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Positions */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h3 className="card-title text-lg mb-4">Positions</h3>
          <div className="space-y-3">
            {tradeCycle.positions.map((pos) => {
              const pnl =
                pos.side === "BUY"
                  ? (pos.currentPrice - pos.entryPrice) * pos.quantity
                  : (pos.entryPrice - pos.currentPrice) * pos.quantity;
              return (
                <div
                  key={pos.id}
                  className="flex justify-between items-center bg-base-200 rounded-lg p-3"
                >
                  <div>
                    <div className="font-medium">{pos.symbol}</div>
                    <div className="text-xs text-gray-500">
                      {pos.side} | Qty: {pos.quantity}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">
                      Entry: ₹{pos.entryPrice} | Current: ₹{pos.currentPrice}
                    </div>
                    <div
                      className={`font-semibold ${
                        pnl >= 0 ? "text-success" : "text-error"
                      }`}
                    >
                      {pnl >= 0 ? "+" : ""}
                      ₹{pnl.toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-end gap-3">
        <button className="btn btn-outline btn-error">Close Trade Cycle</button>
        <Link
          href={`/hedgium/trade-cycle/${tradeCycle.id}/edit`}
          className="btn btn-primary"
        >
          Modify
        </Link>
      </div>
    </div>
  );
}
