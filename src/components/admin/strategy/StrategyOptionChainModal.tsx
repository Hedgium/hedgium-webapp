"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, RefreshCw, X } from "lucide-react";
import { authFetch } from "@/utils/api";
import useAlert from "@/hooks/useAlert";
import { useVisibilityAwareInterval } from "@/hooks/useVisibilityAwareInterval";

const TICK_BATCH = 500;
const OPTION_CHAIN_LIVE_POLL_MS = 90_000;
const STRIKE_WINDOW = 5;

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
  atm_strike?: number | null;
}

type StrikeBoardRow = {
  strike: number;
  isAtm: boolean;
  ce: OptionChainRow | null;
  pe: OptionChainRow | null;
};

function buildStrikeBoard(
  rows: OptionChainRow[],
  atmHint: number | null
): StrikeBoardRow[] {
  const byStrike = new Map<number, { ce: OptionChainRow | null; pe: OptionChainRow | null }>();
  for (const row of rows) {
    const strike = Number(row.strike);
    if (!Number.isFinite(strike)) continue;
    const bucket = byStrike.get(strike) ?? { ce: null, pe: null };
    const ot = (row.option_type || "").toUpperCase();
    if (ot === "CE" || ot === "CALL") bucket.ce = row;
    else if (ot === "PE" || ot === "PUT") bucket.pe = row;
    byStrike.set(strike, bucket);
  }

  const strikes = [...byStrike.keys()].sort((a, b) => a - b);
  if (strikes.length === 0) return [];

  const stepFromRows =
    strikes.length >= 2
      ? Math.min(
          ...strikes
            .slice(1)
            .map((s, i) => Math.abs(s - strikes[i]))
            .filter((d) => d > 0)
        )
      : null;
  const step = stepFromRows && stepFromRows > 0 ? stepFromRows : null;

  let centerAtm = atmHint != null && Number.isFinite(atmHint) ? atmHint : null;
  if (centerAtm == null) {
    const fromRow = rows.find((r) => r.atm_strike != null)?.atm_strike;
    centerAtm = fromRow != null && Number.isFinite(Number(fromRow)) ? Number(fromRow) : null;
  }
  if (centerAtm == null) {
    centerAtm = strikes[Math.floor(strikes.length / 2)];
  }

  const atmStrike = strikes.reduce((best, s) =>
    Math.abs(s - centerAtm!) < Math.abs(best - centerAtm!) ? s : best
  );

  let filtered = strikes;
  if (step && step > 0) {
    const lo = atmStrike - STRIKE_WINDOW * step;
    const hi = atmStrike + STRIKE_WINDOW * step;
    filtered = strikes.filter((s) => s >= lo - 1e-9 && s <= hi + 1e-9);
    if (filtered.length === 0) filtered = strikes;
  } else {
    const idx = strikes.indexOf(atmStrike);
    const start = Math.max(0, idx - STRIKE_WINDOW);
    const end = Math.min(strikes.length, idx + STRIKE_WINDOW + 1);
    filtered = strikes.slice(start, end);
  }

  return filtered.map((strike) => {
    const bucket = byStrike.get(strike)!;
    return {
      strike,
      isAtm: Math.abs(strike - atmStrike) < 1e-9,
      ce: bucket.ce,
      pe: bucket.pe,
    };
  });
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
  if (ex === "NCO") return `NCO:${underlying}`;
  if (ex === "MCX_NCO") return "";
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
  const [draftSource, setDraftSource] = useState<Record<number, string>>({});
  const [draftManualSpot, setDraftManualSpot] = useState<Record<number, string>>({});
  const [editingRow, setEditingRow] = useState<OptionChainRow | null>(null);
  const [refreshingChains, setRefreshingChains] = useState(false);
  const [greeksTaskLoading, setGreeksTaskLoading] = useState(false);
  /** ``auto`` = same subset as ``run_mystream --mode auto`` (book expiries + strike_distance window); ``full`` = all DB rows. */
  const [chainViewMode, setChainViewMode] = useState<"auto" | "full">("auto");
  const [autoMeta, setAutoMeta] = useState<{ max_abs_strike_distance: number | null; position_expiry_count: number } | null>(null);

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

  const board = useMemo(
    () => buildStrikeBoard(rows, underlyingLtp),
    [rows, underlyingLtp]
  );

  const startEditRow = useCallback(
    (row: OptionChainRow) => {
      setEditingRow((prev) => {
        if (prev !== null && prev.id !== row.id) clearRowDrafts(prev.id);
        return row;
      });
      setDraftDelta((d) => ({
        ...d,
        [row.id]: row.greeks_delta != null ? String(row.greeks_delta) : "",
      }));
      setDraftSource((d) => ({
        ...d,
        [row.id]: row.greeks_calculated_by ?? "MANUAL",
      }));
      setDraftManualSpot((d) => ({
        ...d,
        [row.id]: row.manual_delta_spot != null ? String(row.manual_delta_spot) : "",
      }));
    },
    [clearRowDrafts]
  );

  const cancelEditRow = useCallback(() => {
    if (editingRow != null) clearRowDrafts(editingRow.id);
    setEditingRow(null);
  }, [editingRow, clearRowDrafts]);

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
          view_mode: chainViewMode,
        };
        if (exp) qp.expiry = exp;
        if (exchange) qp.exchange = exchange;
        if (chainViewMode === "auto" && Number.isFinite(strategyId) && strategyId > 0) {
          qp.strategy_id = String(strategyId);
        }
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
    [underlying, exchange, chainViewMode, strategyId]
  );

  const refreshOptionChains = useCallback(async () => {
    if (!underlying) {
      return;
    }
    setEditingRow(null);
    setDraftDelta({});
    setDraftSource({});
    setDraftManualSpot({});
    setRefreshingChains(true);
    try {
      const exQp: Record<string, string> = {
        underlying_symbol: underlying,
        exchange: exchange || "NFO",
        view_mode: chainViewMode,
      };
      if (chainViewMode === "auto" && Number.isFinite(strategyId) && strategyId > 0) {
        exQp.strategy_id = String(strategyId);
      }
      const exRes = await authFetch("optionchain/expiries/", {}, exQp);
      const exData = await exRes.json();
      const list: string[] = Array.isArray(exData.expiries) ? exData.expiries : [];
      const meta = exData?.meta;
      if (chainViewMode === "auto" && meta && typeof meta === "object") {
        setAutoMeta({
          max_abs_strike_distance:
            typeof meta.max_abs_strike_distance === "number"
              ? meta.max_abs_strike_distance
              : null,
          position_expiry_count:
            typeof meta.position_expiry_count === "number"
              ? meta.position_expiry_count
              : 0,
        });
      } else {
        setAutoMeta(null);
      }
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
      setAutoMeta(null);
      setExpiries([]);
      setRows([]);
    } finally {
      setRefreshingChains(false);
    }
  }, [loadChain, underlying, exchange, chainViewMode, strategyId]);

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
      let ltp: number | null = null;
      let quoteOk = true;
      if (underInstr) {
        const res = await authFetch("market/quotes/", {}, { instruments: underInstr });
        quoteOk = res.ok;
        if (res.ok) {
          const payload = (await res.json()) as { data?: Record<string, QuoteRow> };
          ltp = lastPriceFromQuoteData(payload?.data ?? {}, underInstr, undefined);
        }
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
        if (!quoteOk) {
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
        const exQp: Record<string, string> = {
          underlying_symbol: underlying,
          exchange: exchange || "NFO",
          view_mode: chainViewMode,
        };
        if (chainViewMode === "auto" && Number.isFinite(strategyId) && strategyId > 0) {
          exQp.strategy_id = String(strategyId);
        }
        const exRes = await authFetch("optionchain/expiries/", {}, exQp);
        const exData = await exRes.json();
        const list: string[] = Array.isArray(exData.expiries) ? exData.expiries : [];
        const meta = exData?.meta;
        if (chainViewMode === "auto" && meta && typeof meta === "object") {
          setAutoMeta({
            max_abs_strike_distance:
              typeof meta.max_abs_strike_distance === "number"
                ? meta.max_abs_strike_distance
                : null,
            position_expiry_count:
              typeof meta.position_expiry_count === "number"
                ? meta.position_expiry_count
                : 0,
          });
        } else {
          setAutoMeta(null);
        }
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
          setAutoMeta(null);
          setExpiries([]);
          setRows([]);
        }
      } finally {
        if (bootId === tableBootstrapIdRef.current) {
          setLoading(false);
        }
      }
    })();
  }, [underlying, exchange, tab, loadChain, chainViewMode, strategyId]);

  useEffect(() => {
    setEditingRow(null);
    setDraftDelta({});
    setDraftSource({});
    setDraftManualSpot({});
  }, [underlying, selectedExpiry, tab, chainViewMode]);

  /** Fingerprint of tokens currently in the table — changes on expiry/tab/view switches. */
  const optionTokensKey = useMemo(() => {
    return rows
      .map((r) => r.zerodha_instrument_token)
      .filter((t): t is number => typeof t === "number" && t > 0)
      .slice()
      .sort((a, b) => a - b)
      .join(",");
  }, [rows]);

  /**
   * Quotes poll only every 90s and does not restart when `rows.length` stays > 0.
   * Re-fetch LTP immediately whenever the displayed option tokens change (e.g. expiry).
   */
  useEffect(() => {
    if (!optionTokensKey) {
      setTicks({});
      return;
    }
    setTicks({});
    void pollLive();
  }, [optionTokensKey, pollLive]);

  useVisibilityAwareInterval(
    () => void pollLive(),
    OPTION_CHAIN_LIVE_POLL_MS,
    {
      enabled: rows.length > 0,
      // Token-key effect above handles the first fetch when rows appear / change.
      runImmediately: false,
    }
  );

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
        // Preserve stored gamma; this UI no longer edits γ/ν/θ.
        greeks_gamma: row.greeks_gamma,
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
        setEditingRow(null);
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
        <div className="flex flex-1 justify-end items-center gap-2 shrink-0 flex-wrap">
          <div
            className="join join-horizontal"
            title="Auto: expiries and strikes aligned with run_mystream --mode auto (open book, strike_distance window ±(max_abs+10)). Full: all expiries/strikes in DB."
          >
            <button
              type="button"
              className={`btn btn-xs join-item ${chainViewMode === "auto" ? "btn-active" : "btn-ghost"}`}
              onClick={() => setChainViewMode("auto")}
            >
              Auto
            </button>
            <button
              type="button"
              className={`btn btn-xs join-item ${chainViewMode === "full" ? "btn-active" : "btn-ghost"}`}
              onClick={() => setChainViewMode("full")}
            >
              Full
            </button>
          </div>

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
            Refresh greeks
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

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex justify-center py-16">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : board.length === 0 ? (
            <p className="p-6 text-center text-base-content/60">
              No option chain rows for this selection.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-base-300">
              <table className="table table-sm w-full">
                <thead>
                  <tr className="bg-base-200/60 text-[10px] uppercase tracking-wide text-base-content/55">
                    <th className="text-right font-semibold text-success/80" colSpan={5}>
                      CALLS
                    </th>
                    <th className="text-center" />
                    <th className="text-left font-semibold text-error/80" colSpan={5}>
                      PUTS
                    </th>
                  </tr>
                  <tr className="text-[10px] uppercase text-base-content/55">
                    <th className="text-right">Theta</th>
                    <th className="text-right">Vega</th>
                    <th className="text-right">Gamma</th>
                    <th className="text-right">Delta</th>
                    <th className="text-right">LTP</th>
                    <th className="text-center">Strike</th>
                    <th className="text-left">LTP</th>
                    <th className="text-left">Delta</th>
                    <th className="text-left">Gamma</th>
                    <th className="text-left">Vega</th>
                    <th className="text-left">Theta</th>
                  </tr>
                </thead>
                <tbody>
                  {board.map((row) => {
                    const fmt = (v: number | null | undefined) =>
                      v == null || !Number.isFinite(Number(v)) ? "—" : String(v);
                    const sideCells = (side: OptionChainRow | null, mirror: boolean) => {
                      if (!side) {
                        return mirror ? (
                          <>
                            <td className="text-left text-base-content/35">—</td>
                            <td className="text-left text-base-content/35">—</td>
                            <td className="text-left text-base-content/35">—</td>
                            <td className="text-left text-base-content/35">—</td>
                            <td className="text-left text-base-content/35">—</td>
                          </>
                        ) : (
                          <>
                            <td className="text-right text-base-content/35">—</td>
                            <td className="text-right text-base-content/35">—</td>
                            <td className="text-right text-base-content/35">—</td>
                            <td className="text-right text-base-content/35">—</td>
                            <td className="text-right text-base-content/35">—</td>
                          </>
                        );
                      }
                      const tok = String(side.zerodha_instrument_token);
                      const ltp = ticks[tok]?.last_price;
                      const selected = editingRow?.id === side.id;
                      const cellClass = `tabular-nums font-mono text-xs cursor-pointer hover:bg-base-200/80 ${
                        selected ? "bg-primary/15 ring-1 ring-inset ring-primary/30" : ""
                      }`;
                      const open = () => startEditRow(side);
                      const ltpTd = (
                        <td
                          className={`${cellClass} ${mirror ? "text-left" : "text-right"} font-semibold`}
                          onClick={open}
                          title={`${side.option_type} ${side.strike} — click to edit`}
                        >
                          {ltp != null ? ltp.toFixed(2) : "—"}
                        </td>
                      );
                      const greeks = (
                        <>
                          <td
                            className={`${cellClass} ${mirror ? "text-left" : "text-right"}`}
                            onClick={open}
                          >
                            {fmt(side.greeks_delta)}
                          </td>
                          <td
                            className={`${cellClass} ${mirror ? "text-left" : "text-right"}`}
                            onClick={open}
                          >
                            {fmt(side.greeks_gamma)}
                          </td>
                          <td
                            className={`${cellClass} ${mirror ? "text-left" : "text-right"}`}
                            onClick={open}
                          >
                            {fmt(side.greeks_vega)}
                          </td>
                          <td
                            className={`${cellClass} ${mirror ? "text-left" : "text-right"}`}
                            onClick={open}
                          >
                            {fmt(side.greeks_theta)}
                          </td>
                        </>
                      );
                      return mirror ? (
                        <>
                          {ltpTd}
                          {greeks}
                        </>
                      ) : (
                        <>
                          <td className={`${cellClass} text-right`} onClick={open}>
                            {fmt(side.greeks_theta)}
                          </td>
                          <td className={`${cellClass} text-right`} onClick={open}>
                            {fmt(side.greeks_vega)}
                          </td>
                          <td className={`${cellClass} text-right`} onClick={open}>
                            {fmt(side.greeks_gamma)}
                          </td>
                          <td className={`${cellClass} text-right`} onClick={open}>
                            {fmt(side.greeks_delta)}
                          </td>
                          {ltpTd}
                        </>
                      );
                    };

                    return (
                      <tr
                        key={row.strike}
                        className={row.isAtm ? "bg-warning/15" : "odd:bg-base-200/20"}
                      >
                        {sideCells(row.ce, false)}
                        <td
                          className={`text-center tabular-nums text-sm ${
                            row.isAtm
                              ? "bg-warning/25 font-bold text-base-content"
                              : "font-semibold text-base-content/80"
                          }`}
                        >
                          {row.strike}
                        </td>
                        {sideCells(row.pe, true)}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {editingRow ? (
          <aside
            className="flex w-full max-w-sm shrink-0 flex-col border-l border-base-300 bg-base-100"
            aria-label="Edit option greeks"
          >
            <div className="flex items-start justify-between gap-2 border-b border-base-300 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {editingRow.option_type} {editingRow.strike}
                </p>
                <p className="truncate font-mono text-xs text-base-content/60">
                  {editingRow.zerodha_tradingsymbol}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-xs btn-square"
                onClick={cancelEditRow}
                aria-label="Close editor"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-2 text-xs tabular-nums text-base-content/70">
                <div>
                  Gamma{" "}
                  <span className="font-mono text-base-content">{editingRow.greeks_gamma ?? "—"}</span>
                </div>
                <div>
                  Vega{" "}
                  <span className="font-mono text-base-content">{editingRow.greeks_vega ?? "—"}</span>
                </div>
                <div>
                  Theta{" "}
                  <span className="font-mono text-base-content">{editingRow.greeks_theta ?? "—"}</span>
                </div>
                <div>
                  LTP{" "}
                  <span className="font-mono text-base-content">
                    {ticks[String(editingRow.zerodha_instrument_token)]?.last_price != null
                      ? ticks[String(editingRow.zerodha_instrument_token)]!.last_price!.toFixed(2)
                      : "—"}
                  </span>
                </div>
              </div>

              <label className="form-control w-full">
                <span className="label-text text-xs">Delta (per 1 qty)</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step={0.000001}
                  className="input input-bordered input-sm w-full font-mono"
                  value={
                    draftDelta[editingRow.id] !== undefined
                      ? draftDelta[editingRow.id]
                      : editingRow.greeks_delta != null
                        ? String(editingRow.greeks_delta)
                        : ""
                  }
                  onChange={(e) =>
                    setDraftDelta((d) => ({ ...d, [editingRow.id]: e.target.value }))
                  }
                />
              </label>

              <label className="form-control w-full">
                <span className="label-text text-xs">Source</span>
                <select
                  className="select select-bordered select-sm w-full"
                  value={
                    draftSource[editingRow.id] !== undefined
                      ? draftSource[editingRow.id]
                      : editingRow.greeks_calculated_by ?? "MANUAL"
                  }
                  onChange={(e) =>
                    setDraftSource((d) => ({ ...d, [editingRow.id]: e.target.value }))
                  }
                >
                  <option value="MANUAL">MANUAL</option>
                  <option value="AUTO">AUTO</option>
                </select>
              </label>

              <label className="form-control w-full">
                <span className="label-text text-xs">Delta spot</span>
                <div className="flex gap-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    step={0.01}
                    className="input input-bordered input-sm w-full font-mono"
                    value={
                      draftManualSpot[editingRow.id] !== undefined
                        ? draftManualSpot[editingRow.id]
                        : editingRow.manual_delta_spot != null
                          ? String(editingRow.manual_delta_spot)
                          : ""
                    }
                    onChange={(e) =>
                      setDraftManualSpot((d) => ({
                        ...d,
                        [editingRow.id]: e.target.value,
                      }))
                    }
                  />
                  {underlyingLtp != null && underlyingLtp > 0 && (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      title="Fill with live underlying LTP"
                      onClick={() =>
                        setDraftManualSpot((d) => ({
                          ...d,
                          [editingRow.id]: String(underlyingLtp),
                        }))
                      }
                    >
                      LTP
                    </button>
                  )}
                </div>
              </label>
            </div>
            <div className="flex gap-2 border-t border-base-300 p-4">
              <button type="button" className="btn btn-ghost flex-1" onClick={cancelEditRow}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary flex-1 gap-1"
                disabled={savingId === editingRow.id}
                onClick={() => void saveGreeksRow(editingRow)}
              >
                {savingId === editingRow.id ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <Check className="size-4" />
                )}
                Save
              </button>
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
