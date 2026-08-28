"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { BarChart3, Check, Pencil, PieChart, Play, Trash2, X } from "lucide-react";
import useAlert from "@/hooks/useAlert";
import { formatMoneyIN } from "@/utils/formatNumber";
import { executeEngine1, previewEngine1 } from "@/services/engine1";
import {
  ENGINE1_HOLDING_PERIOD_LABELS,
  ENGINE1_HOLDING_PERIODS,
  ENGINE1_RISK_LABELS,
  ENGINE1_RISKS,
  type Engine1Execute,
  type Engine1ExecuteOverride,
  type Engine1ExecutePayload,
  type Engine1ExecuteResultRow,
  type Engine1HoldingPeriod,
  type Engine1Preview,
  type Engine1PreviewInstrumentRow,
  type Engine1Risk,
} from "@/types/engine1";

const MarketDepthModal = dynamic(() => import("@/components/market/MarketDepthModal"), {
  ssr: false,
});

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

function defaultAllocation(margin: number | null | undefined): string {
  if (margin == null || !Number.isFinite(margin) || margin <= 0) return "";
  return String(Math.round(margin));
}

function rowKey(row: { exchange: string; tradingsymbol: string }): string {
  return `${row.exchange}:${row.tradingsymbol}`;
}

function isReady(row: Engine1PreviewInstrumentRow): boolean {
  return row.quantity > 0 && row.price != null && !row.skip_reason;
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function roundPct(n: number): number {
  return Math.round(n * 100) / 100;
}

function weightsFromNotional(notional: number, allocatable: number) {
  const money = roundMoney(Math.max(notional, 0));
  return {
    amount: money,
    notional: money,
    portfolio_weight_pct: allocatable > 0 ? roundPct((money / allocatable) * 100) : 0,
  };
}

function mergeResults(prev: Engine1Execute | null, next: Engine1Execute): Engine1Execute {
  const byKey = new Map<string, Engine1ExecuteResultRow>();
  for (const row of prev?.results ?? []) {
    byKey.set(rowKey(row), row);
  }
  for (const row of next.results) {
    byKey.set(rowKey(row), row);
  }
  return { ...next, results: Array.from(byKey.values()) };
}

interface Engine1ExecuteModalProps {
  profileId: string;
  riskProfile?: string | null;
  marginEquity?: number | null;
  open: boolean;
  onClose: () => void;
  onExecuted: () => void;
}

export default function Engine1ExecuteModal({
  profileId,
  riskProfile,
  marginEquity,
  open,
  onClose,
  onExecuted,
}: Engine1ExecuteModalProps) {
  const alert = useAlert();
  const [risk, setRisk] = useState<Engine1Risk>(() => asRisk(riskProfile ?? undefined));
  const marginDefault = defaultAllocation(marginEquity);
  const [holdingPeriod, setHoldingPeriod] = useState<Engine1HoldingPeriod>("Y3_PLUS");
  const [allocationAmount, setAllocationAmount] = useState(marginDefault);
  const [preview, setPreview] = useState<Engine1Preview | null>(null);
  const [rows, setRows] = useState<Engine1PreviewInstrumentRow[]>([]);
  const [executeResult, setExecuteResult] = useState<Engine1Execute | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [executing, setExecuting] = useState<"all" | number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQty, setEditQty] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [depthSymbol, setDepthSymbol] = useState<string | null>(null);
  const originalByIdRef = useRef<Map<number, Engine1PreviewInstrumentRow>>(new Map());

  useEffect(() => {
    if (!riskProfile) return;
    setRisk(asRisk(riskProfile));
  }, [riskProfile]);

  useEffect(() => {
    const next = defaultAllocation(marginEquity);
    if (!next) return;
    setAllocationAmount((current) => (current === "" ? next : current));
  }, [marginEquity]);

  if (!open) return null;

  const busy = executing !== null || loadingPreview;
  const usingMarginDefault = marginDefault !== "" && allocationAmount === marginDefault;

  const resultBySymbol = new Map<string, Engine1ExecuteResultRow>();
  for (const row of executeResult?.results ?? []) {
    resultBySymbol.set(rowKey(row), row);
  }

  const remaining = rows.filter((row) => {
    const result = resultBySymbol.get(rowKey(row));
    return isReady(row) && result?.status !== "success";
  });
  const allocatable = preview?.allocatable ?? 0;
  const weightSum = rows.reduce((acc, row) => acc + row.portfolio_weight_pct, 0);
  const amountSum = rows.reduce((acc, row) => acc + row.amount, 0);
  const notionalSum = rows.reduce((acc, row) => acc + row.notional, 0);
  const liveUnallocated = roundMoney(allocatable - notionalSum);

  const resetBasket = () => {
    setPreview(null);
    setRows([]);
    setExecuteResult(null);
    setEditingId(null);
    originalByIdRef.current = new Map();
  };

  const overridesFor = (instrumentIds: number[]): Engine1ExecuteOverride[] => {
    const overrides: Engine1ExecuteOverride[] = [];
    const byId = new Map(rows.map((row) => [row.instrument_id, row]));
    for (const id of instrumentIds) {
      const row = byId.get(id);
      const orig = originalByIdRef.current.get(id);
      if (!row || !orig) continue;
      const override: Engine1ExecuteOverride = { instrument_id: id };
      let changed = false;
      if (row.quantity !== orig.quantity) {
        override.quantity = row.quantity;
        changed = true;
      }
      if (row.price !== orig.price && row.price != null) {
        override.price = row.price;
        changed = true;
      }
      if (changed) overrides.push(override);
    }
    return overrides;
  };

  const handlePreview = async () => {
    const amount = Number(allocationAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      alert.error("Enter an allocation amount greater than 0");
      return;
    }
    setLoadingPreview(true);
    setExecuteResult(null);
    setEditingId(null);
    try {
      const data = await previewEngine1(profileId, {
        holding_period: holdingPeriod,
        allocation_amount: amount,
        risk_profile: risk,
      });
      originalByIdRef.current = new Map(data.instruments.map((row) => [row.instrument_id, { ...row }]));
      setPreview(data);
      setRows(data.instruments.map((row) => ({ ...row })));
    } catch (e) {
      resetBasket();
      alert.error(e instanceof Error ? e.message : "Preview failed");
    } finally {
      setLoadingPreview(false);
    }
  };

  const placeOrders = async (instrumentIds: number[]) => {
    const amount = Number(allocationAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      alert.error("Enter an allocation amount greater than 0");
      return;
    }
    if (instrumentIds.length === 0) {
      alert.error("Nothing to place — preview first");
      return;
    }
    const payload: Engine1ExecutePayload = {
      holding_period: holdingPeriod,
      allocation_amount: amount,
      risk_profile: risk,
      instrument_ids: instrumentIds,
    };
    const overrides = overridesFor(instrumentIds);
    if (overrides.length > 0) payload.overrides = overrides;
    try {
      const data = await executeEngine1(profileId, payload);
      setExecuteResult((prev) => mergeResults(prev, data));
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
    }
  };

  const handleExecuteAll = async () => {
    if (remaining.length === 0) {
      alert.error("Nothing to place — preview first");
      return;
    }
    if (
      !confirm(
        `Place ${remaining.length} CNC LIMIT BUY order${remaining.length === 1 ? "" : "s"} for this profile?`
      )
    ) {
      return;
    }
    setExecuting("all");
    try {
      await placeOrders(remaining.map((row) => row.instrument_id));
    } finally {
      setExecuting(null);
    }
  };

  const handleExecuteOne = async (row: Engine1PreviewInstrumentRow) => {
    if (!isReady(row)) {
      alert.error("Edit quantity and price before placing this instrument");
      return;
    }
    const priceLabel = row.price != null ? formatMoneyIN(row.price) : "—";
    if (
      !confirm(
        `Place CNC LIMIT BUY for ${row.tradingsymbol}: ${row.quantity} @ ${priceLabel}?`
      )
    ) {
      return;
    }
    setExecuting(row.instrument_id);
    try {
      await placeOrders([row.instrument_id]);
    } finally {
      setExecuting(null);
    }
  };

  const startEdit = (row: Engine1PreviewInstrumentRow) => {
    setEditingId(row.instrument_id);
    setEditQty(String(row.quantity));
    setEditPrice(row.price != null ? String(row.price) : "");
  };

  const saveEdit = (row: Engine1PreviewInstrumentRow) => {
    const qty = Number(editQty);
    const price = Number(editPrice);
    const lot = Math.max(row.lot_size || 1, 1);
    if (!Number.isInteger(qty) || qty <= 0) {
      alert.error("Quantity must be a positive integer");
      return;
    }
    if (qty % lot !== 0) {
      alert.error(`Quantity must be a multiple of lot size ${lot}`);
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      alert.error("Price must be greater than 0");
      return;
    }
    const derived = weightsFromNotional(price * qty, allocatable);
    setRows((prev) =>
      prev.map((item) =>
        item.instrument_id === row.instrument_id
          ? {
              ...item,
              quantity: qty,
              price,
              skip_reason: null,
              ...derived,
            }
          : item
      )
    );
    setEditingId(null);
  };

  const deleteRow = (row: Engine1PreviewInstrumentRow) => {
    if (!confirm(`Remove ${row.tradingsymbol} from this basket?`)) return;
    setRows((prev) => prev.filter((item) => item.instrument_id !== row.instrument_id));
    if (editingId === row.instrument_id) setEditingId(null);
  };

  return (
    <>
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-6xl max-h-[90vh] overflow-y-auto rounded-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <PieChart size={18} />
              Engine 1
            </h3>
            <p className="text-sm text-base-content/70">
              Risk defaults from the profile. Changing it here does not update the profile.
            </p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} disabled={executing !== null}>
            Close
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="form-control">
            <span className="label-text mb-1 text-sm">Risk</span>
            <select
              className="select select-bordered select-sm h-9 w-full"
              value={risk}
              onChange={(e) => {
                setRisk(e.target.value as Engine1Risk);
                resetBasket();
              }}
            >
              {ENGINE1_RISKS.map((value) => (
                <option key={value} value={value}>
                  {ENGINE1_RISK_LABELS[value]}
                  {asRisk(riskProfile ?? undefined) === value ? " (profile)" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="form-control">
            <span className="label-text mb-1 text-sm">Holding period</span>
            <select
              className="select select-bordered select-sm h-9 w-full"
              value={holdingPeriod}
              onChange={(e) => {
                setHoldingPeriod(e.target.value as Engine1HoldingPeriod);
                resetBasket();
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
                resetBasket();
              }}
              placeholder="e.g. 2750000"
            />
            
          </label>
          <div className="flex items-end">
            <button
              type="button"
              className="btn btn-outline btn-sm h-9 w-full"
              onClick={handlePreview}
              disabled={busy}
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
                <div className="font-semibold tabular-nums">{formatMoneyIN(liveUnallocated)}</div>
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
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center text-sm text-base-content/60">
                        No instruments in this basket. Preview again to restore.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => {
                      const result = resultBySymbol.get(rowKey(row));
                      const placed = result?.status === "success";
                      const isEditing = editingId === row.instrument_id;
                      const rowBusy = executing === row.instrument_id;
                      return (
                        <tr key={`${row.exchange}-${row.tradingsymbol}`}>
                          <td className="font-medium">{row.tradingsymbol}</td>
                          <td className="text-xs">{row.asset_class_name}</td>
                          <td className="text-right tabular-nums">{row.portfolio_weight_pct.toFixed(2)}%</td>
                          <td className="text-right tabular-nums">{formatMoneyIN(row.amount)}</td>
                          <td className="text-right tabular-nums">
                            {isEditing ? (
                              <input
                                type="number"
                                min="0.05"
                                step="0.05"
                                className="input input-bordered input-xs w-24 text-right"
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                disabled={busy}
                                aria-label={`${row.tradingsymbol} price`}
                              />
                            ) : row.price != null ? (
                              formatMoneyIN(row.price)
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="text-right tabular-nums">
                            {isEditing ? (
                              <input
                                type="number"
                                min="1"
                                step={Math.max(row.lot_size || 1, 1)}
                                className="input input-bordered input-xs w-20 text-right"
                                value={editQty}
                                onChange={(e) => setEditQty(e.target.value)}
                                disabled={busy}
                                aria-label={`${row.tradingsymbol} quantity`}
                              />
                            ) : (
                              row.quantity
                            )}
                          </td>
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
                          <td className="text-right">
                            {isEditing ? (
                              <div className="flex justify-end gap-1">
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-xs gap-1"
                                  onClick={() => setDepthSymbol(row.tradingsymbol)}
                                  disabled={busy}
                                  title="See depth"
                                  aria-label={`See depth for ${row.tradingsymbol}`}
                                >
                                  <BarChart3 size={14} />
                                  Depth
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-xs"
                                  onClick={() => saveEdit(row)}
                                  disabled={busy}
                                  aria-label={`Save ${row.tradingsymbol}`}
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-xs"
                                  onClick={() => setEditingId(null)}
                                  disabled={busy}
                                  aria-label={`Cancel edit ${row.tradingsymbol}`}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-1">
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-xs"
                                  onClick={() => handleExecuteOne(row)}
                                  disabled={busy || placed || !isReady(row)}
                                  title="Execute"
                                  aria-label={`Execute ${row.tradingsymbol}`}
                                >
                                  {rowBusy ? (
                                    <span className="loading loading-spinner loading-xs" />
                                  ) : (
                                    <Play size={14} />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-xs"
                                  onClick={() => startEdit(row)}
                                  disabled={busy || placed}
                                  title="Edit"
                                  aria-label={`Edit ${row.tradingsymbol}`}
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-xs text-error"
                                  onClick={() => deleteRow(row)}
                                  disabled={busy || placed}
                                  title="Delete"
                                  aria-label={`Remove ${row.tradingsymbol}`}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {rows.length > 0 ? (
                  <tfoot>
                    <tr className="font-semibold">
                      <td colSpan={2}>Total</td>
                      <td className="text-right tabular-nums">{roundPct(weightSum).toFixed(2)}%</td>
                      <td className="text-right tabular-nums">{formatMoneyIN(amountSum)}</td>
                      <td colSpan={4} />
                    </tr>
                  </tfoot>
                ) : null}
              </table>
            </div>

            <div className="modal-action">
              <button type="button" className="btn btn-sm" onClick={onClose} disabled={executing !== null}>
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleExecuteAll}
                disabled={busy || remaining.length === 0}
              >
                {executing === "all" ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : remaining.length > 0 && remaining.length < rows.filter(isReady).length ? (
                  `Execute remaining (${remaining.length})`
                ) : (
                  "Execute all"
                )}
              </button>
            </div>
          </>
        )}
      </div>
      <div className="modal-backdrop" onClick={() => executing === null && onClose()} />
    </div>
    {depthSymbol ? (
      <MarketDepthModal
        open
        onClose={() => setDepthSymbol(null)}
        initialSymbol={depthSymbol}
        defaultInstrumentType="EQ"
      />
    ) : null}
    </>
  );
}
