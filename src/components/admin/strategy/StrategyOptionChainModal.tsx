"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Pencil, RefreshCw, X } from "lucide-react";
import { authFetch } from "@/utils/api";
import useAlert from "@/hooks/useAlert";

const TICK_BATCH = 500;

interface OptionChainRow {
  id: number;
  strike: number;
  option_type: string;
  zerodha_tradingsymbol: string;
  zerodha_instrument_token: number;
  expiry: string;
  greeks_delta: number | null;
  greeks_gamma: number | null;
  greeks_vega: number | null;
  greeks_theta: number | null;
  greeks_updated_at: string | null;
  greeks_calculated_by: string | null;
  manual_delta_spot: number | null;
  manual_delta_updated_at: string | null;
}

const REFRESH_CHAINS_GREEKS_TASK =
  "task_manager.tasks.adjustments_tasks.refresh_optionchain_greeks_for_strategy";

interface Props {
  strategyId: number;
  strategyName: string;
  exchange: string;
  underlyingNames: string[];
  /** OptionChain-style underlying symbol (from builder leg symbol/token) -> Zerodha index token */
  underlyingInstrumentTokens?: Record<string, number>;
  onClose: () => void;
}

function streamSymbol(exchange: string, underlying: string): string {
  const ex = (exchange || "NFO").toUpperCase();
  if (ex === "NFO_BFO") return `NFO:${underlying}`;
  if (ex === "BFO") return `BFO:${underlying}`;
  if (ex === "MCX") return `MCX:${underlying}`;
  return `NFO:${underlying}`;
}

type QuoteRow = { last_price?: number; instrument_token?: number; ltp?: number };

/** Resolve LTP from Kite-style `data` map (keyed by token string and/or NFO:SYMBOL). */
/** Resolve Zerodha underlying index token from API map (case-insensitive key match). */
function underlyingTokenFromMap(
  map: Record<string, number>,
  underlying: string
): number | undefined {
  const t = underlying.trim();
  if (!t) return undefined;
  const upper = t.toUpperCase();
  if (map[upper] != null) return map[upper];
  for (const [k, v] of Object.entries(map)) {
    if (k.toUpperCase() === upper) return v;
  }
  return undefined;
}

function lastPriceFromQuoteData(
  data: Record<string, QuoteRow | undefined>,
  key: string,
  tokenNum?: number
): number | null {
  const d = data[key];
  const p = d?.last_price ?? d?.ltp;
  if (typeof p === "number" && p > 0) return p;
  if (tokenNum != null) {
    const t = data[String(tokenNum)]?.last_price ?? data[String(tokenNum)]?.ltp;
    if (typeof t === "number" && t > 0) return t;
    const fromInst = Object.values(data).find(
      (q): q is QuoteRow =>
        q != null && typeof q === "object" && (q as QuoteRow).instrument_token === tokenNum
    );
    const lp = fromInst?.last_price ?? fromInst?.ltp;
    if (typeof lp === "number" && lp > 0) return lp;
  }
  return null;
}

/** Short local datetime + ISO for tooltips when the table cell is narrow. */
function formatChainDateTime(iso: string | null | undefined): { label: string; title: string } {
  if (!iso) return { label: "—", title: "No value" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { label: "—", title: "Invalid date" };
  return {
    label: d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" }),
    title: d.toISOString(),
  };
}

export default function StrategyOptionChainModal({
  strategyId,
  strategyName,
  exchange,
  underlyingNames,
  underlyingInstrumentTokens = {},
  onClose,
}: Props) {
  const alert = useAlert();
  const names = useMemo(
    () => underlyingNames.filter((n) => n && n.trim()),
    [underlyingNames]
  );
  const [tab, setTab] = useState(0);
  const underlying = names[tab] ?? "";

  const [expiries, setExpiries] = useState<string[]>([]);
  const [selectedExpiry, setSelectedExpiry] = useState<string | null>(null);
  const [rows, setRows] = useState<OptionChainRow[]>([]);
  const [ticks, setTicks] = useState<Record<string, { last_price?: number }>>({});
  const [underlyingLtp, setUnderlyingLtp] = useState<number | null>(null);
  const [streamNote, setStreamNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [draftDelta, setDraftDelta] = useState<Record<number, string>>({});
  const [draftGamma, setDraftGamma] = useState<Record<number, string>>({});
  const [draftSource, setDraftSource] = useState<Record<number, string>>({});
  const [draftManualSpot, setDraftManualSpot] = useState<Record<number, string>>({});
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [refreshingChains, setRefreshingChains] = useState(false);
  const [greeksTaskLoading, setGreeksTaskLoading] = useState(false);

  /** Keep latest rows for pollLive without putting `rows` in useCallback deps (avoids new pollLive on every loadChain → interval churn). */
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  /** Always use latest selected expiry in async (avoids race with setState and overlapping chain fetches). */
  const selectedExpiryRef = useRef<string | null>(null);
  selectedExpiryRef.current = selectedExpiry;

  /** Latest chain `authFetch` for applying `setRows` (incl. user expiry changes). */
  const chainRequestIdRef = useRef(0);
  /**
   * Separate from chainRequestIdRef: user can fetch chain rows while a bootstrap is in flight.
   * Only bootstrap start/end may clear the main table `loading` overlay.
   */
  const tableBootstrapIdRef = useRef(0);

  const clearRowDrafts = useCallback((rowId: number) => {
    setDraftDelta((d) => {
      const next = { ...d };
      delete next[rowId];
      return next;
    });
    setDraftGamma((d) => {
      const next = { ...d };
      delete next[rowId];
      return next;
    });
    setDraftSource((d) => {
      const next = { ...d };
      delete next[rowId];
      return next;
    });
    setDraftManualSpot((d) => {
      const next = { ...d };
      delete next[rowId];
      return next;
    });
  }, []);

  const startEditRow = useCallback(
    (rowId: number) => {
      setEditingRowId((prev) => {
        if (prev !== null && prev !== rowId) clearRowDrafts(prev);
        return rowId;
      });
    },
    [clearRowDrafts]
  );

  const cancelEditRow = useCallback(() => {
    if (editingRowId != null) clearRowDrafts(editingRowId);
    setEditingRowId(null);
  }, [editingRowId, clearRowDrafts]);

  /**
   * Fetch one option chain for the current `underlying` and optional `expiry`.
   * `expiryOverride` = explicit expiry string (avoids stale selectedExpiry in flight).
   * Stale in-flight results are dropped via chainRequestIdRef.
   */
  const loadChain = useCallback(
    async (options?: {
      silent?: boolean;
      expiryOverride?: string | null;
      /** When set (e.g. from bootstrap/refresh), reuse this id so it stays the latest request. */
      requestId?: number;
    }) => {
      if (!underlying) return;
      const silent = options?.silent === true;
      const exp =
        options?.expiryOverride !== undefined
          ? options?.expiryOverride
          : selectedExpiryRef.current;
      const myId =
        options?.requestId !== undefined
          ? options.requestId
          : ++chainRequestIdRef.current;
      if (!silent) setLoading(true);
      try {
        const qp: Record<string, string> = {
          underlying_symbol: underlying,
        };
        if (exp) qp.expiry = exp;
        const res = await authFetch("optionchain/", {}, qp);
        const data = await res.json();
        if (myId !== chainRequestIdRef.current) return;
        setRows(Array.isArray(data) ? data : []);
      } catch {
        if (myId === chainRequestIdRef.current) setRows([]);
      } finally {
        if (!silent && myId === chainRequestIdRef.current) setLoading(false);
      }
    },
    [underlying, exchange]
  );

  const refreshOptionChains = useCallback(async () => {
    if (!underlying) {
      return;
    }
    setEditingRowId(null);
    setDraftDelta({});
    setDraftGamma({});
    setDraftSource({});
    setDraftManualSpot({});
    setRefreshingChains(true);
    try {
      const exRes = await authFetch("optionchain/expiries/", {}, {
        underlying_symbol: underlying,
        exchange: exchange || "NFO",
      });
      const exData = await exRes.json();
      const list: string[] = Array.isArray(exData.expiries) ? exData.expiries : [];
      setExpiries(list);
      const prev = selectedExpiryRef.current;
      const nextExp = prev && list.includes(prev) ? prev : list[0] ?? null;
      setSelectedExpiry(nextExp);
      // Allocate a fresh id right before the chain call. Do not hold an id from the start
      // of this handler: any other `loadChain()` (expiry change, save, etc.) can bump
      // chainRequestIdRef while expiries is in flight, and we would otherwise bail with
      // `if (oldId !== ref) return` and never fire optionchain/ — no backend request.
      const chainRid = ++chainRequestIdRef.current;
      await loadChain({ silent: true, expiryOverride: nextExp, requestId: chainRid });
    } catch {
      setExpiries([]);
      setRows([]);
    } finally {
      setRefreshingChains(false);
    }
  }, [loadChain, underlying, exchange]);

  const queueRefreshChainGreeks = useCallback(async () => {
    if (!Number.isFinite(strategyId) || strategyId <= 0) {
      alert.error("Invalid strategy");
      return;
    }
    setGreeksTaskLoading(true);
    try {
      const res = await authFetch("tasks/start", {
        method: "POST",
        body: JSON.stringify({
          task_name: REFRESH_CHAINS_GREEKS_TASK,
          args: [strategyId],
        }),
      });
      const data = (await res.json()) as {
        task_id?: string;
        status?: string;
        message?: string;
      };
      if (res.ok) {
        if (data.status === "already_running") {
          alert.error(data.message || "That task is already running");
        } else {
          alert.success(
            data.task_id
              ? `Greeks refresh queued (task ${data.task_id.slice(0, 8)}…)`
              : "Greeks refresh queued"
          );
          void loadChain({
            silent: true,
            expiryOverride: selectedExpiryRef.current,
          });
        }
      } else {
        alert.error(data.message || "Failed to queue greeks refresh");
      }
    } catch {
      alert.error("Failed to queue greeks refresh");
    } finally {
      setGreeksTaskLoading(false);
    }
  }, [alert, strategyId, loadChain]);

  const pollLive = useCallback(async () => {
    if (!underlying) return;
    const underInstr = streamSymbol(exchange, underlying);

    try {
      const res = await authFetch("market/quotes/", {}, { instruments: underInstr });
      let ltp: number | null = null;
      if (res.ok) {
        const payload = (await res.json()) as { data?: Record<string, QuoteRow> };
        ltp = lastPriceFromQuoteData(payload?.data ?? {}, underInstr, undefined);
      }
      if (ltp == null) {
        const utok = underlyingTokenFromMap(underlyingInstrumentTokens, underlying);
        if (utok != null && utok > 0) {
          const res2 = await authFetch("market/quotes/", {}, { instruments: String(utok) });
          if (res2.ok) {
            const p2 = (await res2.json()) as { data?: Record<string, QuoteRow> };
            ltp = lastPriceFromQuoteData(p2?.data ?? {}, String(utok), utok);
          }
        }
      }
      if (ltp != null) {
        setUnderlyingLtp(ltp);
        setStreamNote(null);
      } else {
        setUnderlyingLtp(null);
        if (!res.ok) {
          setStreamNote("Could not load underlying LTP (quotes).");
        } else {
          setStreamNote("No LTP in quote for this symbol.");
        }
      }
    } catch {
      setUnderlyingLtp(null);
      setStreamNote("Quotes unavailable.");
    }

    const currentRows = rowsRef.current;
    const tokens = currentRows
      .map((r) => r.zerodha_instrument_token)
      .filter((t): t is number => typeof t === "number" && t > 0);
    const merged: Record<string, { last_price?: number }> = {};
    for (let i = 0; i < tokens.length; i += TICK_BATCH) {
      const chunk = tokens.slice(i, i + TICK_BATCH);
      try {
        const res = await authFetch(
          "market/quotes/",
          {},
          { instruments: chunk.map((t) => String(t)).join(",") }
        );
        if (!res.ok) continue;
        const payload = (await res.json()) as { data?: Record<string, QuoteRow> };
        const data = payload?.data ?? {};
        for (const tok of chunk) {
          const lp = lastPriceFromQuoteData(data, String(tok), tok);
          if (lp != null) {
            merged[String(tok)] = { last_price: lp };
          }
        }
      } catch {
        /* ignore batch errors */
      }
    }
    setTicks(merged);
  }, [underlying, exchange, underlyingInstrumentTokens]);

  /* One serialized bootstrap per underlying/tab: expiries then chain (no racing dual effects). */
  useEffect(() => {
    if (!underlying) {
      setExpiries([]);
      setSelectedExpiry(null);
      setRows([]);
      return;
    }
    const bootId = ++tableBootstrapIdRef.current;
    setLoading(true);
    (async () => {
      let chainRid: number | undefined;
      try {
        const exRes = await authFetch("optionchain/expiries/", {}, {
          underlying_symbol: underlying,
          exchange: exchange || "NFO",
        });
        const exData = await exRes.json();
        const list: string[] = Array.isArray(exData.expiries) ? exData.expiries : [];
        if (bootId !== tableBootstrapIdRef.current) return;
        setExpiries(list);
        const prev = selectedExpiryRef.current;
        const nextExp = prev && list.includes(prev) ? prev : list[0] ?? null;
        setSelectedExpiry(nextExp);
        if (bootId !== tableBootstrapIdRef.current) return;
        chainRid = ++chainRequestIdRef.current;
        await loadChain({ silent: true, expiryOverride: nextExp, requestId: chainRid });
      } catch {
        if (bootId === tableBootstrapIdRef.current) {
          setExpiries([]);
          setRows([]);
        }
      } finally {
        if (bootId === tableBootstrapIdRef.current) {
          setLoading(false);
        }
      }
    })();
  }, [underlying, exchange, tab, loadChain]);

  useEffect(() => {
    setEditingRowId(null);
    setDraftDelta({});
    setDraftGamma({});
    setDraftSource({});
    setDraftManualSpot({});
  }, [underlying, selectedExpiry, tab]);

  useEffect(() => {
    if (rows.length === 0) return;
    void pollLive();
    const id = setInterval(() => void pollLive(), 60000); // 1 minute
    return () => clearInterval(id);
  }, [rows, pollLive]);

  async function saveGreeksRow(row: OptionChainRow) {
    const rawD =
      draftDelta[row.id] !== undefined
        ? draftDelta[row.id]
        : row.greeks_delta != null
          ? String(row.greeks_delta)
          : "";
    if (rawD.trim() === "") {
      alert.error("Enter a delta value");
      return;
    }
    const deltaVal = Number(rawD);
    if (!Number.isFinite(deltaVal)) {
      alert.error("Invalid delta");
      return;
    }

    const rawG = draftGamma[row.id] ?? (row.greeks_gamma != null ? String(row.greeks_gamma) : "");
    let gammaPayload: number | null;
    if (rawG.trim() === "") {
      gammaPayload = null;
    } else {
      const g = Number(rawG);
      if (!Number.isFinite(g)) {
        alert.error("Invalid gamma");
        return;
      }
      gammaPayload = g;
    }

    const src =
      (draftSource[row.id] ?? row.greeks_calculated_by ?? "MANUAL").trim().toUpperCase();
    if (src !== "AUTO" && src !== "MANUAL") {
      alert.error("Source must be AUTO or MANUAL");
      return;
    }

    const rawSpot =
      draftManualSpot[row.id] !== undefined
        ? draftManualSpot[row.id]
        : row.manual_delta_spot != null
          ? String(row.manual_delta_spot)
          : "";
    let spotPayload: number | null;
    if (rawSpot.trim() === "") {
      spotPayload = null;
    } else {
      const s = Number(rawSpot);
      if (!Number.isFinite(s) || s <= 0) {
        alert.error("Invalid δ spot (must be a positive number, or leave empty to clear)");
        return;
      }
      spotPayload = s;
    }

    setSavingId(row.id);
    try {
      const body: Record<string, unknown> = {
        greeks_delta: deltaVal,
        greeks_gamma: gammaPayload,
        greeks_calculated_by: src,
        manual_delta_spot_set: true,
        manual_delta_spot: spotPayload,
      };
      const res = await authFetch(`optionchain/rows/${row.id}/greeks/`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        alert.success("Greeks saved");
        clearRowDrafts(row.id);
        setEditingRowId(null);
        void loadChain({
          silent: true,
          expiryOverride: selectedExpiryRef.current,
        });
      } else {
        alert.error(data.message || "Save failed");
      }
    } catch {
      alert.error("Save failed");
    } finally {
      setSavingId(null);
    }
  }

  if (names.length === 0) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col bg-base-100">
        <header className="flex items-center justify-between border-b border-base-300 px-4 py-3 shrink-0">
          <h2 className="text-lg font-semibold">Option chains — {strategyName}</h2>
          <button type="button" className="btn btn-ghost btn-sm btn-circle" onClick={onClose} aria-label="Close">
            <X className="size-5" />
          </button>
        </header>
        <div className="flex-1 flex items-center justify-center p-8 text-base-content/60">
          No underlyings on this strategy.
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-base-100 text-base-content">
      <header className="flex flex-wrap items-center gap-3 border-b border-base-300 px-4 py-3 shrink-0 bg-base-200/80">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold truncate">Option chains — {strategyName}</h2>
          <p className="text-sm text-base-content/60 tabular-nums">
            Live LTP:{" "}
            {underlyingLtp != null ? underlyingLtp.toFixed(2) : "—"}
            {streamNote && <span className="ml-2 text-warning">{streamNote}</span>}
          </p>
        </div>
        {names.length > 1 && (
          <div className="tabs tabs-boxed shrink-0">
            {names.map((n, i) => (
              <button
                key={n}
                type="button"
                className={`tab tab-sm ${i === tab ? "tab-active" : ""}`}
                onClick={() => setTab(i)}
              >
                {n}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 shrink-0">
          <label className="text-sm text-base-content/70 whitespace-nowrap">Expiry</label>
          <select
            className="select select-bordered select-sm max-w-[11rem]"
            value={selectedExpiry ?? ""}
            onChange={(e) => {
              const v = e.target.value || null;
              setSelectedExpiry(v);
              void loadChain({ silent: true, expiryOverride: v });
            }}
          >
            {expiries.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-outline btn-sm gap-1"
            onClick={() => void queueRefreshChainGreeks()}
            disabled={loading || refreshingChains || greeksTaskLoading}
            title="Recompute AUTO greeks on OptionChain for open positions in the master book (Celery)"
          >
            {greeksTaskLoading ? (
              <span className="loading loading-spinner loading-xs" />
            ) : null}
            Refresh AUTO greeks
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-circle"
            onClick={() => void refreshOptionChains()}
            disabled={loading || refreshingChains || greeksTaskLoading}
            aria-label="Refresh option chains"
            title="Refresh expiries and option chain from server"
          >
            <RefreshCw className={`size-5 ${refreshingChains ? "animate-spin" : ""}`} />
          </button>
          <button type="button" className="btn btn-ghost btn-sm btn-circle" onClick={onClose} aria-label="Close">
            <X className="size-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-base-300">
            <table className="table table-sm table-zebra">
              <thead>
                <tr>
                  <th>Strike</th>
                  <th>Type</th>
                  <th>LTP</th>
                  <th title="net ÷ qty (per 1 instrument quantity)">Delta</th>
                  <th title="net ÷ qty (per 1 instrument quantity)">Gamma</th>
                  <th title="net ÷ qty (per 1 instrument quantity)">Vega</th>
                  <th title="net ÷ qty (per 1 instrument quantity)">Theta</th>
                  <th>Source</th>
                  <th title="Recorded underlying spot for manual δ; editable in row edit mode">δ spot</th>
                  <th title="Last staff manual greeks/spot save (hover for UTC ISO)">δ saved at</th>
                  <th title="When Greeks on this row were last written (AUTO or manual)">Greeks updated</th>
                  <th className="w-24">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const tok = String(r.zerodha_instrument_token);
                  const ltp = ticks[tok]?.last_price;
                  const isEditing = editingRowId === r.id;
                  const displayDelta =
                    draftDelta[r.id] !== undefined
                      ? draftDelta[r.id]
                      : r.greeks_delta != null
                        ? String(r.greeks_delta)
                        : "";
                  const displayGamma =
                    draftGamma[r.id] !== undefined
                      ? draftGamma[r.id]
                      : r.greeks_gamma != null
                        ? String(r.greeks_gamma)
                        : "";
                  const displaySource =
                    draftSource[r.id] !== undefined
                      ? draftSource[r.id]
                      : r.greeks_calculated_by ?? "MANUAL";
                  const displaySpot =
                    draftManualSpot[r.id] !== undefined
                      ? draftManualSpot[r.id]
                      : r.manual_delta_spot != null
                        ? String(r.manual_delta_spot)
                        : "";
                  const manualDeltaSaved = formatChainDateTime(r.manual_delta_updated_at);
                  const greeksUpdated = formatChainDateTime(r.greeks_updated_at);
                  return (
                    <tr key={`${r.id}-${r.option_type}`}>
                      <td className="font-mono tabular-nums">{r.strike}</td>
                      <td>{r.option_type}</td>
                      <td className="tabular-nums">{ltp != null ? ltp.toFixed(2) : "—"}</td>
                      <td className="tabular-nums text-sm">
                        {isEditing ? (
                          <input
                            type="number"
                            inputMode="decimal"
                            step={0.000001}
                            className="input input-bordered input-xs w-28 font-mono"
                            placeholder="δ"
                            title="Delta per 1 qty (net_delta ÷ quantity)"
                            value={displayDelta}
                            onChange={(e) =>
                              setDraftDelta((d) => ({ ...d, [r.id]: e.target.value }))
                            }
                          />
                        ) : (
                          <span className="font-mono">{r.greeks_delta != null ? r.greeks_delta : "—"}</span>
                        )}
                      </td>
                      <td className="tabular-nums text-sm">
                        {isEditing ? (
                          <input
                            type="number"
                            inputMode="decimal"
                            step={0.000001}
                            className="input input-bordered input-xs w-24 font-mono"
                            placeholder="γ"
                            title="Gamma per 1 qty; leave empty to clear"
                            value={displayGamma}
                            onChange={(e) =>
                              setDraftGamma((d) => ({ ...d, [r.id]: e.target.value }))
                            }
                          />
                        ) : (
                          <span className="font-mono">{r.greeks_gamma != null ? r.greeks_gamma : "—"}</span>
                        )}
                      </td>
                      <td className="tabular-nums text-sm">{r.greeks_vega ?? "—"}</td>
                      <td className="tabular-nums text-sm">{r.greeks_theta ?? "—"}</td>
                      <td className="text-xs">
                        {isEditing ? (
                          <select
                            className="select select-bordered select-xs max-w-[6.5rem] font-mono text-xs"
                            title="AUTO or MANUAL"
                            value={displaySource}
                            onChange={(e) =>
                              setDraftSource((d) => ({ ...d, [r.id]: e.target.value }))
                            }
                          >
                            <option value="MANUAL">MANUAL</option>
                            <option value="AUTO">AUTO</option>
                          </select>
                        ) : (
                          <span>{r.greeks_calculated_by ?? "—"}</span>
                        )}
                      </td>
                      <td className="tabular-nums text-xs font-mono">
                        {isEditing ? (
                          <div className="flex flex-wrap items-center gap-1 max-w-[11rem]">
                            <input
                              type="number"
                              inputMode="decimal"
                              step={0.01}
                              className="input input-bordered input-xs w-24 font-mono"
                              placeholder="Spot"
                              title="Underlying spot for manual δ; empty clears stored value"
                              value={displaySpot}
                              onChange={(e) =>
                                setDraftManualSpot((d) => ({ ...d, [r.id]: e.target.value }))
                              }
                            />
                            {underlyingLtp != null && underlyingLtp > 0 && (
                              <button
                                type="button"
                                className="btn btn-ghost btn-xs whitespace-nowrap"
                                title="Fill with live underlying LTP"
                                onClick={() =>
                                  setDraftManualSpot((d) => ({
                                    ...d,
                                    [r.id]: String(underlyingLtp),
                                  }))
                                }
                              >
                                LTP
                              </button>
                            )}
                          </div>
                        ) : r.manual_delta_spot != null ? (
                          r.manual_delta_spot.toFixed(2)
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="text-xs align-top min-w-[5.5rem] max-w-[9rem]">
                        <span
                          className={
                            r.manual_delta_updated_at
                              ? "whitespace-normal break-words leading-tight block"
                              : "text-base-content/50"
                          }
                          title={manualDeltaSaved.title}
                        >
                          {manualDeltaSaved.label}
                        </span>
                      </td>
                      <td className="text-xs align-top min-w-[5.5rem] max-w-[9rem]">
                        <span
                          className={
                            r.greeks_updated_at
                              ? "whitespace-normal break-words leading-tight block"
                              : "text-base-content/50"
                          }
                          title={greeksUpdated.title}
                        >
                          {greeksUpdated.label}
                        </span>
                      </td>
                      <td className="p-1">
                        {isEditing ? (
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              className="btn btn-primary btn-xs btn-square"
                              disabled={savingId === r.id}
                              title="Save"
                              aria-label="Save row"
                              onClick={() => saveGreeksRow(r)}
                            >
                              {savingId === r.id ? (
                                <span className="loading loading-spinner loading-xs" />
                              ) : (
                                <Check className="size-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs btn-square"
                              disabled={savingId === r.id}
                              title="Cancel"
                              aria-label="Cancel edit"
                              onClick={cancelEditRow}
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs btn-square"
                            title="Edit Greeks"
                            aria-label="Edit row"
                            onClick={() => startEditRow(r.id)}
                          >
                            <Pencil className="size-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length === 0 && !loading && (
              <p className="p-6 text-center text-base-content/60">No option chain rows for this selection.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
