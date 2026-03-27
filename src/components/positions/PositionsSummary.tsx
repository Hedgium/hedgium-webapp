"use client";

import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Position } from "./PositionsTable";
import { formatMoneyIN } from "@/utils/formatNumber";

interface PositionsSummaryProps {
  positions: Position[];
  totals?: {
    pnl_total?: number;
    realised_total?: number;
    unrealised_total?: number;
    total_buy_qty?: number;
    total_sell_qty?: number;
  } | null;
  className?: string;
}

export default function PositionsSummary({
  positions,
  totals,
  className = "",
}: PositionsSummaryProps) {
  // Use backend totals if available, otherwise calculate from displayed positions (fallback)
  const totalPnl =
    totals?.pnl_total ?? positions.reduce((acc, pos) => acc + pos.pnl, 0);
  const realisedPnl =
    totals?.realised_total ?? positions.reduce((acc, pos) => acc + pos.realised_total, 0);
  const unrealisedPnl =
    totals?.unrealised_total ?? positions.reduce((acc, pos) => acc + (pos.unrealised_total ?? 0), 0);
  const totalBuyQty =
    totals?.total_buy_qty ?? positions.reduce((acc, pos) => acc + pos.buy_quantity, 0);
  const totalSellQty =
    totals?.total_sell_qty ?? positions.reduce((acc, pos) => acc + pos.sell_quantity, 0);

  const totalPnlColor = totalPnl >= 0 ? "text-success" : "text-error";

  if (positions.length === 0) {
    return null;
  }

  return (
    <div
      className={`grid grid-cols-3 md:grid-cols-5 gap-3 mb-3 p-3 bg-base-200 rounded-lg ${className}`}
    >
      <div className="text-center">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
          Total PnL
        </div>
        <div
          className={`text-base font-bold flex items-center justify-center gap-1 ${totalPnlColor}`}
        >
          {totalPnl >= 0 ? (
            <TrendingUp width={14} />
          ) : (
            <TrendingDown width={14} />
          )}
          {formatMoneyIN(totalPnl)}
        </div>
      </div>
      <div className="text-center">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
          Realised
        </div>
        <div className="text-base font-semibold">
          {formatMoneyIN(realisedPnl)}
        </div>
      </div>
    
      <div className="text-center">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
          Unrealised
        </div>
        <div className="text-base font-semibold">{formatMoneyIN(unrealisedPnl)}</div>
      </div>
      <div className="text-center">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
          Buy Qty
        </div>
        <div className="text-base font-semibold">{totalBuyQty}</div>
      </div>
      <div className="text-center">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
          Sell Qty
        </div>
        <div className="text-base font-semibold">{totalSellQty}</div>
      </div>
    </div>
  );
}
