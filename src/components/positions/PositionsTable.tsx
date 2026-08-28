"use client";

import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatMoneyIN } from "@/utils/formatNumber";
import PositionGreeksCell from "@/components/admin/PositionGreeksCell";
import type { PositionGreeksSnapshot } from "@/types/positions";

export interface Position extends PositionGreeksSnapshot {
  id: number;
  instrument: string;
  exchange?: string | null;
  lot_size?: number | null;
  buy_quantity: number;
  average_buy_price: number;
  sell_quantity: number;
  average_sell_price: number;
  quantity: number;
  realised_total: number;
  unrealised_total?: number;
  pnl: number;
  /** Operator or system note (e.g. broker vs trades reconciliation) */
  note?: string | null;
  orders?: Array<{ id: number }>;
}

export type PositionOrderIntent = "exit" | "increase" | "decrease";

interface PositionsTableProps {
  positions: Position[];
  showOrdersCount?: boolean;
  /** Staff-only: show a control to inspect stored trades for this position (admin UI). */
  showAdminTradesAction?: boolean;
  onAdminViewTrades?: (position: Position) => void;
  /** Staff-only: increase / decrease / exit via LIMIT + modify loop (admin UI). */
  showAdminExitAction?: boolean;
  onAdminPositionOrder?: (position: Position, intent: PositionOrderIntent) => void;
  showGreeks?: boolean;
  /** Staff-only: operator/system note (e.g. broker vs trades reconciliation). */
  showNote?: boolean;
  className?: string;
}

export default function PositionsTable({
  positions,
  showOrdersCount = false,
  showAdminTradesAction = false,
  onAdminViewTrades,
  showAdminExitAction = false,
  onAdminPositionOrder,
  showGreeks = false,
  showNote = false,
  className = "",
}: PositionsTableProps) {
  const showActions = showAdminTradesAction || showAdminExitAction;
  const getPnLColor = (pnl: number) => {
    return pnl >= 0 ? "text-success" : "text-error";
  };

  if (positions.length === 0) {
    return (
      <p className="text-sm text-base-content/70 text-center py-3">No positions yet.</p>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="table w-full text-sm">
        <caption className="sr-only">Open positions</caption>
        <thead>
          <tr className="text-xs text-base-content/70 uppercase">
            <th scope="col">Instrument</th>
            <th scope="col">Qty(B/S)</th>
            <th scope="col">Buy Avg</th>
            <th scope="col">Sell Avg</th>
            <th scope="col">Unrealised</th>
            <th scope="col">Realised</th>
            <th scope="col">PnL</th>
            {showGreeks && <th scope="col">Greeks</th>}
            {showNote && <th scope="col" className="min-w-[8rem] max-w-[14rem]">Note</th>}
            {showOrdersCount && <th scope="col">Orders</th>}
            {showActions && <th scope="col" className="w-56">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {positions.map((pos) => {
            const pnlColor = getPnLColor(pos.pnl);
            const unrealisedValue = pos.unrealised_total ?? 0;
            const realisedValue = pos.realised_total ?? 0;

            return (
              <tr key={pos.id} className="hover:bg-base-200">
                <td className="font-semibold">{pos.instrument}</td>
                <td>
                  {pos.quantity} ({pos.buy_quantity}/{pos.sell_quantity})
                </td>
                <td>
                  {pos.average_buy_price
                    ? formatMoneyIN(pos.average_buy_price)
                    : "-"}
                </td>
                <td>
                  {pos.average_sell_price
                    ? formatMoneyIN(pos.average_sell_price)
                    : "-"}
                </td>
                <td>{formatMoneyIN(unrealisedValue)}</td>
                <td>{formatMoneyIN(realisedValue)}</td>
                <td className={pnlColor}>
                  <div className="flex items-center gap-1 font-semibold">
                    {pos.pnl >= 0 ? (
                      <TrendingUp width={12} aria-hidden="true" />
                    ) : (
                      <TrendingDown width={12} aria-hidden="true" />
                    )}
                    {formatMoneyIN(pos.pnl)}
                  </div>
                </td>
                {showGreeks && (
                  <td>
                    <PositionGreeksCell greeks={pos} compact />
                  </td>
                )}
                {showNote && (
                  <td
                    className="max-w-[14rem] truncate text-xs text-base-content/80"
                  >
                    {pos.note?.trim() ? pos.note.trim() : "—"}
                  </td>
                )}
                {showOrdersCount && (
                  <td className="text-right">
                    {pos.orders?.length ?? 0}
                  </td>
                )}
                {showActions && (
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {showAdminTradesAction && onAdminViewTrades ? (
                        <button
                          type="button"
                          className="btn btn-xs btn-outline"
                          onClick={() => onAdminViewTrades(pos)}
                        >
                          Trades
                        </button>
                      ) : null}
                      {showAdminExitAction && onAdminPositionOrder && pos.quantity !== 0 ? (
                        <>
                          <button
                            type="button"
                            className="btn btn-xs btn-outline"
                            onClick={() => onAdminPositionOrder(pos, "increase")}
                          >
                            Increase
                          </button>
                          <button
                            type="button"
                            className="btn btn-xs btn-outline"
                            onClick={() => onAdminPositionOrder(pos, "decrease")}
                          >
                            Decrease
                          </button>
                          <button
                            type="button"
                            className="btn btn-xs btn-outline btn-error"
                            onClick={() => onAdminPositionOrder(pos, "exit")}
                          >
                            Exit
                          </button>
                        </>
                      ) : null}
                    </div>
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
