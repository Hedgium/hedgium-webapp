"use client";

import React, { useEffect, useId, useRef } from "react";
import { LivePosition, LivePositionsData } from "@/types/positions";
import { formatMoneyIN } from "@/utils/formatNumber";

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
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const positionsList = positions?.data?.net || [];
  const modalTitle = title || `Live Positions${brokerName ? ` - ${brokerName}` : ""}`;

  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        className="relative z-10 bg-base-200 rounded-lg p-6 max-w-6xl w-full max-h-[80vh] overflow-auto mx-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id={titleId} className="text-xl font-bold">
            {modalTitle}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-circle min-h-11 min-w-11"
            aria-label="Close"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        {positionsList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <caption className="sr-only">Live broker positions</caption>
              <thead>
                <tr>
                  <th scope="col">Instrument</th>
                  <th scope="col">Qty</th>
                  <th scope="col">Buy Qty</th>
                  <th scope="col">Sell Qty</th>
                  <th scope="col">Avg Price</th>
                  <th scope="col">LTP</th>
                  <th scope="col">Realised Total</th>
                  <th scope="col">Unrealised Total</th>
                  <th scope="col">P&amp;L</th>
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
                        ? formatMoneyIN(position.average_price)
                        : "-"}
                    </td>
                    <td>
                      {position.last_price
                        ? formatMoneyIN(position.last_price)
                        : "-"}
                    </td>
                    <td>
                      {position.realised_total !== undefined
                        ? formatMoneyIN(position.realised_total)
                        : "-"}
                    </td>
                    <td>
                      {position.unrealised_total !== undefined
                        ? formatMoneyIN(position.unrealised_total)
                        : "-"}
                    </td>
                    <td
                      className={
                        position.pnl && position.pnl >= 0
                          ? "text-success"
                          : "text-error"
                      }
                    >
                      {position.pnl !== undefined
                        ? formatMoneyIN(position.pnl)
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-base-content/70 py-8">No positions found</p>
        )}
      </div>
    </div>
  );
}
