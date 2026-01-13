"use client";

import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export interface Position {
  id: number;
  instrument: string;
  buy_quantity: number;
  average_buy_price: number;
  sell_quantity: number;
  average_sell_price: number;
  quantity: number;
  realised_total: number;
  realised_today?: number;
  unrealised?: number;
  unrealised_total?: number;
  pnl: number;
  orders?: Array<{ id: number }>;
}

interface PositionsTableProps {
  positions: Position[];
  showOrdersCount?: boolean;
  className?: string;
}

export default function PositionsTable({
  positions,
  showOrdersCount = false,
  className = "",
}: PositionsTableProps) {
  const getPnLColor = (pnl: number) => {
    return pnl >= 0 ? "text-success" : "text-error";
  };

  if (positions.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-3">No positions yet.</p>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="table table-zebra w-full text-sm">
        <thead>
          <tr className="text-xs text-gray-500 uppercase">
            <th>Instrument</th>
            <th>Qty(B/S)</th>
            <th>Buy Avg</th>
            <th>Sell Avg</th>
            <th>Unrealised</th>
            <th>Realised</th>
            <th>PnL</th>
            {showOrdersCount && <th>Orders</th>}
          </tr>
        </thead>
        <tbody>
          {positions.map((pos) => {
            const pnlColor = getPnLColor(pos.pnl);
            const unrealisedValue = pos.unrealised_total ?? pos.unrealised ?? 0;
            const realisedValue = pos.realised_total + (pos.realised_today ?? 0);

            return (
              <tr key={pos.id} className="hover:bg-base-200">
                <td className="font-semibold">{pos.instrument}</td>
                <td>
                  {pos.quantity} ({pos.buy_quantity}/{pos.sell_quantity})
                </td>
                <td>
                  {pos.average_buy_price
                    ? `₹${pos.average_buy_price.toFixed(2)}`
                    : "-"}
                </td>
                <td>
                  {pos.average_sell_price
                    ? `₹${pos.average_sell_price.toFixed(2)}`
                    : "-"}
                </td>
                <td>₹{unrealisedValue.toFixed(2)}</td>
                <td>₹{realisedValue.toFixed(2)}</td>
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
                {showOrdersCount && (
                  <td className="text-right">
                    {pos.orders?.length ?? 0}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
