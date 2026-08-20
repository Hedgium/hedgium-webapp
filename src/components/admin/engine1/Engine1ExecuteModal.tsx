"use client";

import { useState } from "react";
import { PieChart } from "lucide-react";
import useAlert from "@/hooks/useAlert";
import { formatMoneyIN } from "@/utils/formatNumber";
import { executeEngine1, previewEngine1 } from "@/services/engine1";
import {
  ENGINE1_HOLDING_PERIOD_LABELS,
  ENGINE1_HOLDING_PERIODS,
  ENGINE1_RISK_LABELS,
  type Engine1Execute,
  type Engine1ExecuteResultRow,
  type Engine1HoldingPeriod,
  type Engine1Preview,
  type Engine1Risk,
} from "@/types/engine1";

function asRisk(value: string | undefined): Engine1Risk {
  const upper = (value || "").toUpperCase();
  if (upper === "LOW" || upper === "MEDIUM" || upper === "HIGH") return upper;
  return "MEDIUM";
}

function skipLabel(reason: string | null): string {
  if (!reason) return "";
  if (reason === "class_zero") return "Class 0%";
  if (reason === "no_quote") return "No quote";
  if (reason === "qty_zero") return "Qty 0";
  return reason;
}

interface Engine1ExecuteModalProps {
  profileId: string;
  riskProfile?: string | null;
  open: boolean;
  onClose: () => void;
  onExecuted: () => void;
}

export default function Engine1ExecuteModal({
  profileId,
  riskProfile,
  open,
  onClose,
  onExecuted,
}: Engine1ExecuteModalProps) {
  const alert = useAlert();
  const risk = asRisk(riskProfile ?? undefined);
  const [holdingPeriod, setHoldingPeriod] = useState<Engine1HoldingPeriod>("Y3_PLUS");
  const [allocationAmount, setAllocationAmount] = useState("");
  const [preview, setPreview] = useState<Engine1Preview | null>(null);
  const [executeResult, setExecuteResult] = useState<Engine1Execute | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [executing, setExecuting] = useState(false);

  if (!open) return null;

  const handlePreview = async () => {
    const amount = Number(allocationAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      alert.error("Enter an allocation amount greater than 0");
      return;
    }
    setLoadingPreview(true);
    setExecuteResult(null);
    try {
      const data = await previewEngine1(profileId, {
        holding_period: holdingPeriod,
        allocation_amount: amount,
      });
      setPreview(data);
    } catch (e) {
      setPreview(null);
      alert.error(e instanceof Error ? e.message : "Preview failed");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleExecute = async () => {
    const amount = Number(allocationAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      alert.error("Enter an allocation amount greater than 0");
      return;
    }
    const tradable = preview?.instruments.filter((row) => row.quantity > 0 && !row.skip_reason) ?? [];
    if (tradable.length === 0) {
      alert.error("Nothing to place — preview first");
      return;
    }
    if (
      !confirm(
        `Place ${tradable.length} CNC LIMIT BUY order${tradable.length === 1 ? "" : "s"} for this profile?`
      )
    ) {
      return;
    }
    setExecuting(true);
    try {
      const data = await executeEngine1(profileId, {
        holding_period: holdingPeriod,
        allocation_amount: amount,
      });
      setExecuteResult(data);
      setPreview(data);
      const failed = data.results.filter((row) => row.status === "error").length;
      const placed = data.results.filter((row) => row.status === "success").length;
      if (failed > 0) {
        alert.error(`Placed ${placed}, ${failed} failed`);
      } else {
        alert.success(`Placed ${placed} order${placed === 1 ? "" : "s"}`);
      }
      onExecuted();
    } catch (e) {
      alert.error(e instanceof Error ? e.message : "Execute failed");
    } finally {
      setExecuting(false);
    }
  };

  const resultBySymbol = new Map<string, Engine1ExecuteResultRow>();
  for (const row of executeResult?.results ?? []) {
    resultBySymbol.set(`${row.exchange}:${row.tradingsymbol}`, row);
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <PieChart size={18} />
              Engine 1
            </h3>
            <p className="text-sm text-base-content/70">
              Risk from profile: {ENGINE1_RISK_LABELS[risk]}
              {riskProfile ? "" : " (default Medium)"}
            </p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} disabled={executing}>
            Close
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="form-control">
            <span className="label-text mb-1 text-sm">Holding period</span>
            <select
              className="select select-bordered select-sm h-9 w-full"
              value={holdingPeriod}
              onChange={(e) => {
                setHoldingPeriod(e.target.value as Engine1HoldingPeriod);
                setPreview(null);
                setExecuteResult(null);
              }}
            >
              {ENGINE1_HOLDING_PERIODS.map((period) => (
                <option key={period} value={period}>
                  {ENGINE1_HOLDING_PERIOD_LABELS[period]}
                </option>
              ))}
            </select>
          </label>
          <label className="form-control">
            <span className="label-text mb-1 text-sm">Allocation (gross)</span>
            <input
              type="number"
              min="1"
              step="1"
              className="input input-bordered input-sm h-9 w-full"
              value={allocationAmount}
              onChange={(e) => {
                setAllocationAmount(e.target.value);
                setPreview(null);
                setExecuteResult(null);
              }}
              placeholder="e.g. 2750000"
            />
          </label>
          <div className="flex items-end">
            <button
              type="button"
              className="btn btn-outline btn-sm h-9 w-full"
              onClick={handlePreview}
              disabled={loadingPreview || executing}
            >
              {loadingPreview ? <span className="loading loading-spinner loading-xs" /> : "Preview"}
            </button>
          </div>
        </div>

        {preview && (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-base-200 p-3 sm:grid-cols-4">
              <div>
                <div className="text-xs uppercase text-base-content/50">Cash reserve</div>
                <div className="font-semibold tabular-nums">
                  {formatMoneyIN(preview.cash_reserve)} ({preview.cash_reserve_pct}%)
                </div>
              </div>
              <div>
                <div className="text-xs uppercase text-base-content/50">Allocatable</div>
                <div className="font-semibold tabular-nums">{formatMoneyIN(preview.allocatable)}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-base-content/50">Unallocated</div>
                <div className="font-semibold tabular-nums">{formatMoneyIN(preview.unallocated_cash)}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-base-content/50">Risk / period</div>
                <div className="font-semibold">
                  {ENGINE1_RISK_LABELS[asRisk(preview.risk_profile)]} /{" "}
                  {ENGINE1_HOLDING_PERIOD_LABELS[preview.holding_period as Engine1HoldingPeriod] ??
                    preview.holding_period}
                </div>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Instrument</th>
                    <th>Class</th>
                    <th className="text-right">Weight</th>
                    <th className="text-right">Amount</th>
                    <th className="text-right">Price</th>
                    <th className="text-right">Qty</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.instruments.map((row) => {
                    const result = resultBySymbol.get(`${row.exchange}:${row.tradingsymbol}`);
                    return (
                      <tr key={`${row.exchange}-${row.tradingsymbol}`}>
                        <td className="font-medium">{row.tradingsymbol}</td>
                        <td className="text-xs">{row.asset_class_name}</td>
                        <td className="text-right tabular-nums">{row.portfolio_weight_pct.toFixed(2)}%</td>
                        <td className="text-right tabular-nums">{formatMoneyIN(row.amount)}</td>
                        <td className="text-right tabular-nums">
                          {row.price != null ? formatMoneyIN(row.price) : "—"}
                        </td>
                        <td className="text-right tabular-nums">{row.quantity}</td>
                        <td>
                          {result ? (
                            <span
                              className={`badge badge-sm ${
                                result.status === "success"
                                  ? "badge-success"
                                  : result.status === "error"
                                    ? "badge-error"
                                    : "badge-ghost"
                              }`}
                            >
                              {result.status}
                              {result.error ? ` · ${result.error}` : ""}
                            </span>
                          ) : row.skip_reason ? (
                            <span className="badge badge-ghost badge-sm">{skipLabel(row.skip_reason)}</span>
                          ) : (
                            <span className="badge badge-outline badge-sm">Ready</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="modal-action">
              <button type="button" className="btn btn-sm" onClick={onClose} disabled={executing}>
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleExecute}
                disabled={executing || loadingPreview}
              >
                {executing ? <span className="loading loading-spinner loading-xs" /> : "Execute all"}
              </button>
            </div>
          </>
        )}
      </div>
      <div className="modal-backdrop" onClick={() => !executing && onClose()} />
    </div>
  );
}
