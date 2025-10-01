"use client";

import React, { JSX, useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useParams } from "next/navigation";
import { myFetch } from "@/utils/api";

// New Position type
type Position = {
  id: number;
  symbol: string;

  buy_quantity: number;
  average_buy_price: number;

  sell_quantity: number;
  average_sell_price: number;

  quantity: number; // net quantity

  realised_total: number;
  realised_today: number;
  unrealised: number;
  pnl: number; // total pnl = realised_total + realised_today + unrealised
};

type TradeCycle = {
  id: string;
  name: string;
  description: string;
  state: "NEW" | "PENDING" | "COMPLETED" | "STOPPED";
  sub_state: string;
  created_at: string;
  updated_at: string;
};

export default function TradeCycleDetailPage() {
  const params = useParams<{ id: string }>();
  const { id } = params;

  const [tradeCycle, setTradeCycle] = useState<TradeCycle | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);

  async function getTradeCycle(id: string) {
    const res = await myFetch(`trade-cycles/${id}/`);
    const data: TradeCycle = await res.json();
    setTradeCycle(data);
  }

  async function getTradeCyclePositions(id: string) {
    const res = await myFetch(
      `positions/?page=1&page_size=10&trade_cycle_id=${id}`
    );
    const data: { results: Position[] } = await res.json();
    setPositions(data.results);
  }

  useEffect(() => {
    if (id) {
      getTradeCycle(id);
      getTradeCyclePositions(id);
    }
  }, [id]);

  const statusMap: Record<string, JSX.Element> = {
    NEW: <Icon icon="lucide:clock" width={16} className="text-warning" />,
    PENDING: <Icon icon="lucide:clock" width={16} className="text-warning" />,
    COMPLETED: <Icon icon="lucide:check-circle" width={16} className="text-success" />,
    STOPPED: <Icon icon="lucide:x-circle" width={16} className="text-error" />,
  };

  const totalPnl = positions.reduce((acc, pos) => acc + pos.pnl, 0);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="card bg-base-100 shadow-md mb-6">
        <div className="card-body">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="card-title text-2xl">{tradeCycle?.name}</h2>
              <p className="text-sm text-gray-500 mt-1">{tradeCycle?.description}</p>
              <div className="flex gap-2 mt-2">
                <span className="badge">{tradeCycle?.sub_state}</span>
                <span className="badge gap-1">
                  {statusMap[tradeCycle?.state] ?? <Icon icon="lucide:clock" width={16} />}
                  {tradeCycle?.state}
                </span>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Created: {new Date(tradeCycle?.created_at).toLocaleDateString("en-IN")}
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="stats shadow mb-6 w-full">
        <div className="stat">
          <div className="stat-title">Total Positions</div>
          <div className="stat-value">{positions.length}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Total PnL</div>
          <div className={`stat-value text-lg ${totalPnl >= 0 ? "text-success" : "text-error"}`}>
            {totalPnl >= 0 ? (
              <Icon icon="lucide:arrow-up-right" width={16} className="inline mr-1" />
            ) : (
              <Icon icon="lucide:arrow-down-right" width={16} className="inline mr-1" />
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
            {positions.map((pos) => {
              const pnlColor = pos.pnl >= 0 ? "text-success" : "text-error";
              return (
                <div key={pos.id} className="flex justify-between items-center bg-base-200 rounded-lg p-3">
                  <div>
                    <div className="font-medium">{pos.symbol}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Net Qty: {pos.quantity} | Buy: {pos.buy_quantity} @ ₹{pos.average_buy_price} | Sell: {pos.sell_quantity} @ ₹{pos.average_sell_price}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Realised Total: ₹{pos.realised_total} | Realised Today: ₹{pos.realised_today} | Unrealised: ₹{pos.unrealised}
                    </div>
                  </div>
                  <div className={`text-right font-semibold flex items-center gap-1 ${pnlColor}`}>
                    {pos.pnl >= 0 ? (
                      <Icon icon="lucide:trending-up" width={14} />
                    ) : (
                      <Icon icon="lucide:trending-down" width={14} />
                    )}
                    ₹{pos.pnl.toFixed(2)}
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
        <Link href={`/hedgium/trade-cycle/${tradeCycle?.id}/edit`} className="btn btn-primary">
          Modify
        </Link>
      </div>
    </div>
  );
}
