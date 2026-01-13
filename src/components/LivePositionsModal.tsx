"use client";

import React from "react";
import { LivePosition, LivePositionsData } from "@/types/positions";

interface LivePositionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  positions: LivePositionsData | null;
  brokerName?: string;
  title?: string;
}

export default function LivePositionsModal({
  isOpen,
  onClose,
  positions,
  brokerName,
  title,
}: LivePositionsModalProps) {
  if (!isOpen) return null;

  const positionsList = positions?.data?.net || [];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-base-200 rounded-lg p-6 max-w-6xl w-full max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">
            {title || `Live Positions${brokerName ? ` - ${brokerName}` : ""}`}
          </h3>
          <button
            onClick={onClose}
            className="btn btn-sm btn-circle"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {positionsList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Instrument</th>
                  <th>Qty</th>
                  <th>Buy Qty</th>
                  <th>Sell Qty</th>
                  <th>Avg Price</th>
                  <th>LTP</th>
                  <th>Realised Total</th>
                  <th>Unrealised Total</th>
                  <th>P&L</th>
                </tr>
              </thead>
              <tbody>
                {positionsList.map((position: LivePosition, index: number) => (
                  <tr key={index}>
                    <td className="font-medium">{position.tradingsymbol}</td>
                    <td>{position.quantity}</td>
                    <td>{position.buy_quantity ?? "-"}</td>
                    <td>{position.sell_quantity ?? "-"}</td>
                    <td>
                      {position.average_price
                        ? `₹${position.average_price.toFixed(2)}`
                        : "-"}
                    </td>
                    <td>
                      {position.last_price
                        ? `₹${position.last_price.toFixed(2)}`
                        : "-"}
                    </td>
                    <td>
                      {position.realised_total !== undefined
                        ? `₹${position.realised_total.toFixed(2)}`
                        : "-"}
                    </td>
                    <td>
                      {position.unrealised_total !== undefined
                        ? `₹${position.unrealised_total.toFixed(2)}`
                        : "-"}
                    </td>
                    <td
                      className={
                        position.pnl && position.pnl >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }
                    >
                      {position.pnl !== undefined
                        ? `₹${position.pnl.toFixed(2)}`
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-400 py-8">No positions found</p>
        )}
      </div>
    </div>
  );
}

