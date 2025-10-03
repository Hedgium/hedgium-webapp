"use client";

// components/TradeCycleWithPositionsCard.tsx

import React, { JSX, useState, useEffect } from "react";
import { Clock, CheckCircle, XCircle, TrendingUp, TrendingDown, ChevronUp, ChevronDown } from "lucide-react";
import Link from "next/link";
import { myFetch } from "@/utils/api";

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

interface TradeCycle {
  id: string;
  name: string;
  description: string;
  state: "NEW" | "PENDING" | "COMPLETED" | "STOPPED";
  sub_state: string;
  created_at: string;
}

interface Props {
  tradeCycle: TradeCycle;
}

const TradeCycleWithPositionsCard: React.FC<Props> = ({ tradeCycle }) => {
  const [expanded, setExpanded] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);

  async function getTradeCyclePositions(id: string) {
    const res = await myFetch(
      `positions/?page=1&page_size=10&trade_cycle_id=${id}`
    );
    const data: { results: Position[] } = await res.json();
    console.log(data);
    setPositions(data.results);
  }

  useEffect(() => {
    if (tradeCycle) getTradeCyclePositions(tradeCycle?.id);
  }, [tradeCycle]);

  const statusMap: Record<string, JSX.Element> = {
    NEW: <Clock width={14} className="text-warning" />,
    PENDING: <Clock width={14} className="text-warning" />,
    COMPLETED: <CheckCircle width={14} className="text-success" />,
    STOPPED: <XCircle width={14} className="text-error" />,
  };

  return (
    <div className="card bg-base-200 shadow-md w-[90%] md:w-[60%] snap-start shrink-0">
      <div className="card-body p-4 flex flex-col flex-1">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="card-title text-lg">{tradeCycle?.name}</h3>
            <div className="flex gap-2 items-center mt-1">
              <span className="badge">{tradeCycle?.sub_state}</span>
              <span className="badge gap-1">
                {statusMap[tradeCycle?.state]} {tradeCycle?.state}
              </span>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {new Date(tradeCycle?.created_at).toLocaleDateString()}
          </div>
        </div>

        {/* Positions */}
        <h4 className="font-semibold mb-2">Positions</h4>
        <div className="space-y-2">
          {positions.slice(0, expanded ? undefined : 2).map((pos) => {
            const pnlColor = pos.pnl >= 0 ? "text-success" : "text-error";

            return (
              <div
                key={pos.id}
                className="bg-base-200 p-3 rounded-lg flex justify-between items-center"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{pos.symbol}</span>
                    <span className="text-xs text-gray-500">
                      Net Qty: {pos.quantity}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Buy: {pos.buy_quantity} @ ₹{pos.average_buy_price} | 
                    Sell: {pos.sell_quantity} @ ₹{pos.average_sell_price}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Realised Total: ₹{pos.realised_total} | Realised Today: ₹{pos.realised_today} | Unrealised: ₹{pos.unrealised}
                  </div>
                </div>
                <div className={`font-semibold flex items-center gap-1 ${pnlColor}`}>
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

        {/* Expand toggle */}
        {positions.length > 2 && (
          <button
            className="btn btn-ghost btn-sm mt-2 self-start"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp width={16} className="mr-1" /> Show Less
              </>
            ) : (
              <>
                <ChevronDown width={16} className="mr-1" /> Show All{" "}
                {positions.length} Positions
              </>
            )}
          </button>
        )}

        {/* Actions at bottom */}
        <div className="flex-1"></div>
        <div className="card-actions justify-end mt-4">
          <Link
            href={`/hedgium/positions/${tradeCycle.id}`}
            className="btn btn-outline btn-sm"
          >
            View Details
          </Link>
          {tradeCycle.state === "PENDING" && (
            <button className="btn btn-error btn-sm">Close Cycle</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TradeCycleWithPositionsCard;