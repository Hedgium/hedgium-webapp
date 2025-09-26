// components/TradeCycleWithPositionsCard.tsx
"use client";

import React, { JSX, useState } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";


interface Position {
  id: number;
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  side: "BUY" | "SELL";
  status: "OPEN" | "CLOSED";
}

interface TradeCycle {
  id: number;
  name: string;
  description: string;
  state: "NEW" | "PENDING" | "COMPLETED" | "STOPPED";
  sub_state: string;
  created_at: string;
  positions: Position[];
}

interface Props {
  tradeCycle: TradeCycle;
}

const TradeCycleWithPositionsCard: React.FC<Props> = ({ tradeCycle }) => {
  const [expanded, setExpanded] = useState(false);

  const statusMap: Record<string, JSX.Element> = {
    NEW: <Icon icon="lucide:clock" width={14} className="text-warning" />,
    PENDING: <Icon icon="lucide:clock" width={14} className="text-warning" />,
    COMPLETED: <Icon icon="lucide:check-circle" width={14} className="text-success" />,
    STOPPED: <Icon icon="lucide:x-circle" width={14} className="text-error" />,
  };

  return (
    <div className="card bg-base-100 shadow-md w-[90%] md:w-[60%] snap-start shrink-0">
      <div className="card-body p-4 flex flex-col flex-1">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="card-title text-lg">{tradeCycle.name}</h3>
            <div className="flex gap-2 items-center mt-1">
              <span className="badge">{tradeCycle.sub_state}</span>
              <span className="badge gap-1">
                {statusMap[tradeCycle.state]} {tradeCycle.state}
              </span>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {new Date(tradeCycle.created_at).toLocaleDateString()}
          </div>
        </div>

        {/* Positions */}
        <h4 className="font-semibold mb-2">Positions</h4>
        <div className="space-y-2">
          {tradeCycle.positions.slice(0, expanded ? undefined : 2).map((pos) => {
            const pnl =
              pos.side === "BUY"
                ? (pos.currentPrice - pos.entryPrice) * pos.quantity
                : (pos.entryPrice - pos.currentPrice) * pos.quantity;

            const pnlColor = pnl >= 0 ? "text-success" : "text-error";

            return (
              <div
                key={pos.id}
                className="bg-base-200 p-3 rounded-lg flex justify-between items-center"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-semibold ${
                        pos.side === "BUY" ? "text-success" : "text-error"
                      }`}
                    >
                      {pos.side}
                    </span>
                    <span className="text-sm">{pos.symbol}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Qty: {pos.quantity} | Entry: ₹{pos.entryPrice} | Now: ₹
                    {pos.currentPrice}
                  </div>
                </div>
                <div className={`font-semibold flex items-center gap-1 ${pnlColor}`}>
                  {pnl >= 0 ? (
                    <Icon icon="lucide:trending-up" width={14} />
                  ) : (
                    <Icon icon="lucide:trending-down" width={14} />
                  )}
                  ₹{pnl.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Expand toggle */}
        {tradeCycle.positions.length > 2 && (
          <button
            className="btn btn-ghost btn-sm mt-2 self-start"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <Icon icon="lucide:chevron-up" width={16} className="mr-1" /> Show Less
              </>
            ) : (
              <>
                <Icon icon="lucide:chevron-down" width={16} className="mr-1" /> Show All{" "}
                {tradeCycle.positions.length} Positions
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
