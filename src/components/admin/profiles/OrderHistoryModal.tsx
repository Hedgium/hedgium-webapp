"use client";

import { useCallback, useEffect, useState } from "react";
import { History, RefreshCw, X } from "lucide-react";
import { formatMoneyIN } from "@/utils/formatNumber";
import { getOrderHistory } from "@/services/liveTradingActions";
import type { LiveOrderHistoryRow } from "@/types/orders";

export interface OrderHistoryModalProps {
  profileId: string;
  orderId: string;
  tradingsymbol?: string;
  open: boolean;
  onClose: () => void;
}

function historyApiError(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const payload = data as Record<string, unknown>;
  for (const key of ["message", "error_message", "detail"]) {
    const value = payload[key];
    if (typeof value !== "string") continue;
    const text = value.trim();
    if (text && text.toLowerCase() !== "success" && text.toLowerCase() !== "ok") {
      return text;
    }
  }
  return fallback;
}

function formatDateTimeCell(value: string | Date | null | undefined): string {
  if (value == null || value === "") return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function statusBadgeClass(status: string | undefined): string {
  const upper = (status || "").toUpperCase();
  if (["COMPLETE", "FILLED"].includes(upper)) return "badge-success";
  if (["CANCELLED", "CANCELED", "REJECTED"].includes(upper)) return "badge-error";
  return "badge-warning";
}

function formatMoneyOrDash(value: number | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return formatMoneyIN(Number(value));
}

export default function OrderHistoryModal({
  profileId,
  orderId,
  tradingsymbol,
  open,
  onClose,
}: OrderHistoryModalProps) {
  const [rows, setRows] = useState<LiveOrderHistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getOrderHistory(profileId, orderId);
      if (data.status === "success") {
        setRows(Array.isArray(data.data) ? data.data : []);
        return;
      }
      setRows([]);
      setError(historyApiError(data, "Failed to fetch order history"));
    } catch (err) {
      setRows([]);
      setError(historyApiError(err, "Error fetching order history"));
    } finally {
      setLoading(false);
    }
  }, [profileId, orderId]);

  useEffect(() => {
    if (!open) return;
    void fetchHistory();
  }, [open, fetchHistory]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal modal-open" role="dialog" aria-modal="true" aria-labelledby="order-history-title">
      <div className="modal-box w-11/12 max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 id="order-history-title" className="flex items-center gap-2 text-lg font-bold">
              <History size={18} />
              Order history
            </h3>
            <p className="truncate font-mono text-sm text-base-content/70" title={orderId}>
              {orderId}
              {tradingsymbol ? ` · ${tradingsymbol}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => void fetchHistory()}
              disabled={loading}
              title="Refresh history"
              aria-label="Refresh order history"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClose}
              aria-label="Close order history"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {loading && rows.length === 0 ? (
          <div className="py-10 text-center">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : error ? (
          <p className="py-8 text-center text-error">{error}</p>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-base-content/60">No history found for this order</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th className="whitespace-nowrap">Time</th>
                  <th>Status</th>
                  <th>Type</th>
                  <th>Side</th>
                  <th>Qty</th>
                  <th>Filled</th>
                  <th>Pending</th>
                  <th>Price</th>
                  <th>Avg</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const reason = (row.rejection_reason || row.status_message || "").trim();
                  return (
                    <tr key={`${row.order_id ?? orderId}-${row.status ?? "row"}-${index}`}>
                      <td className="whitespace-nowrap text-xs text-base-content/80">
                        {formatDateTimeCell(row.order_timestamp ?? row.exchange_timestamp)}
                      </td>
                      <td>
                        <span className={`badge ${statusBadgeClass(row.status)}`}>
                          {row.status || "—"}
                        </span>
                      </td>
                      <td className="text-xs">{row.order_type || "—"}</td>
                      <td>
                        <span
                          className={
                            (row.transaction_type || "").toUpperCase() === "BUY"
                              ? "text-green-400"
                              : (row.transaction_type || "").toUpperCase() === "SELL"
                                ? "text-red-400"
                                : ""
                          }
                        >
                          {row.transaction_type || "—"}
                        </span>
                      </td>
                      <td>{row.quantity ?? "—"}</td>
                      <td>{row.filled_quantity ?? "—"}</td>
                      <td>{row.pending_quantity ?? "—"}</td>
                      <td>{formatMoneyOrDash(row.price)}</td>
                      <td>{formatMoneyOrDash(row.average_price)}</td>
                      <td className="max-w-[14rem] truncate text-xs text-base-content/70" title={reason || undefined}>
                        {reason || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="modal-action">
          <button type="button" className="btn btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
