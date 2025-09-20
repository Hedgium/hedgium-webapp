// components/PositionCard.tsx
"use client";

import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";


interface Position {
  id: string;
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercentage: number;
  strategyId: string;
  strategyName: string;
  type: 'long' | 'short';
  assetType: string;
  side: "BUY" | "SELL"; // trade direction
  status: "OPEN" | "CLOSED";
}

interface Props {
  position: Position;
}

const PositionCard: React.FC<Props> = ({ position }) => {
  const { symbol, quantity, entryPrice, currentPrice, side, status } = position;

  const pnl =
    side === "BUY"
      ? (currentPrice - entryPrice) * quantity
      : (entryPrice - currentPrice) * quantity;

  const pnlColor = pnl >= 0 ? "text-success" : "text-error";

  return (
    <div className="card bg-base-100 shadow-md w-[85%] sm:w-[60%] md:w-[40%] snap-start shrink-0">
      <div className="card-body p-4 flex flex-col flex-1">
        {/* Header */}
        <div className="flex justify-between items-start">
          <h3 className="card-title text-lg">{symbol}</h3>
          <span
            className={`badge ${
              status === "OPEN" ? "badge-success" : "badge-ghost"
            }`}
          >
            {status}
          </span>
        </div>

        {/* Trade Info */}
        <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
          <div>
            <div className="text-gray-500">Side</div>
            <div
              className={`font-semibold ${
                side === "BUY" ? "text-success" : "text-error"
              }`}
            >
              {side}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Quantity</div>
            <div className="font-semibold">{quantity}</div>
          </div>
          <div>
            <div className="text-gray-500">Entry Price</div>
            <div className="font-semibold">₹{entryPrice}</div>
          </div>
          <div>
            <div className="text-gray-500">Current Price</div>
            <div className="font-semibold">₹{currentPrice}</div>
          </div>
        </div>

        {/* PnL */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-gray-500">PnL</span>
          <span
            className={`font-semibold flex items-center gap-1 ${pnlColor}`}
          >
            {pnl >= 0 ? (
              <TrendingUp size={16} />
            ) : (
              <TrendingDown size={16} />
            )}
            ₹{pnl.toFixed(2)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex-1"></div>
        <div className="card-actions justify-end mt-4">
          {status === "OPEN" ? (
            <button className="btn btn-outline btn-error btn-sm">
              Close Position
            </button>
          ) : (
            <button className="btn btn-outline btn-sm">View History</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PositionCard;
