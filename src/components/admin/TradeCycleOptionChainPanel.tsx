"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { authFetch } from "@/utils/api";
import { formatMoneyIN } from "@/utils/formatNumber";
import { useVisibilityAwareInterval } from "@/hooks/useVisibilityAwareInterval";
import type { PositionOrderIntent } from "@/services/tradeCycles";

const TICK_POLL_MS = 90_000;
const STRIKE_WINDOW = 5;

export interface CycleUnderlyingMarket {
  symbol: string;
  spot: number | null;
  strike_step: number | null;
  atm: number | null;
}

export interface OptionChainApiRow {
  id: number;
  strike: number;
  option_type: string;
  zerodha_tradingsymbol: string;
  zerodha_instrument_token: number;
  shoonya_tradingsymbol?: string | null;
  kotakneo_tradingsymbol?: string | null;
  iifl_tradingsymbol?: string | null;
  expiry: string;
  lot_size: number;
  exchange: string;
  atm_strike?: number | null;
  strike_distance?: number | null;
}

export type ChainOrderRequest = {
  instrument: string;
  exchange: string;
  lot_size: number;
  intent: Extract<PositionOrderIntent, "buy" | "sell">;
  label: string;
};

type QuoteRow = { last_price?: number; instrument_token?: number; ltp?: number };

type StrikeBoardRow = {
  strike: number;
  isAtm: boolean;
  ce: OptionChainApiRow | null;
  pe: OptionChainApiRow | null;
};

interface TradeCycleOptionChainPanelProps {
  underlyings: CycleUnderlyingMarket[];
  exchange?: string | null;
  brokerName?: string | null;
  onBuySell: (req: ChainOrderRequest) => void;
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
  }
  return null;
}

function instrumentForBroker(row: OptionChainApiRow, brokerName?: string | null): string {
  const b = (brokerName || "ZERODHA").toUpperCase();
  if (b === "SHOONYA" || b === "PROSTOCKS") {
    return (row.shoonya_tradingsymbol || row.zerodha_tradingsymbol || "").trim();
  }
  if (b === "KOTAKNEO") {
    return (row.kotakneo_tradingsymbol || row.zerodha_tradingsymbol || "").trim();
  }
  if (b === "IIFLCAPITAL") {
    return (row.iifl_tradingsymbol || row.zerodha_tradingsymbol || "").trim();
  }
  return (row.zerodha_tradingsymbol || "").trim();
}

function buildBoard(
  rows: OptionChainApiRow[],
  atm: number | null,
  strikeStep: number | null
): StrikeBoardRow[] {
  const byStrike = new Map<number, { ce: OptionChainApiRow | null; pe: OptionChainApiRow | null }>();
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
      ? Math.min(...strikes.slice(1).map((s, i) => Math.abs(s - strikes[i])).filter((d) => d > 0))
      : null;
  const step =
    strikeStep && strikeStep > 0
      ? strikeStep
      : stepFromRows && stepFromRows > 0
        ? stepFromRows
        : null;

  let centerAtm = atm != null && Number.isFinite(atm) ? atm : null;
  if (centerAtm == null) {
    const fromRow = rows.find((r) => r.atm_strike != null)?.atm_strike;
    centerAtm = fromRow != null && Number.isFinite(Number(fromRow)) ? Number(fromRow) : null;
  }
  if (centerAtm == null) {
    const mid = strikes[Math.floor(strikes.length / 2)];
    centerAtm = mid;
  }

  let atmStrike = strikes.reduce((best, s) =>
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

export default function TradeCycleOptionChainPanel({
  underlyings,
  exchange,
  brokerName,
  onBuySell,
}: TradeCycleOptionChainPanelProps) {
  const names = useMemo(
    () => underlyings.map((u) => u.symbol.trim()).filter(Boolean),
    [underlyings]
  );
  const [tab, setTab] = useState(0);
  const underlying = names[tab] ?? "";
  const market = underlyings.find(
    (u) => u.symbol.trim().toUpperCase() === underlying.toUpperCase()
  );
  const chainExchange = (exchange || "NFO").trim() || "NFO";

  const [expiries, setExpiries] = useState<string[]>([]);
  const [selectedExpiry, setSelectedExpiry] = useState<string | null>(null);
  const [rows, setRows] = useState<OptionChainApiRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [ticks, setTicks] = useState<Record<string, { last_price?: number }>>({});
  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const selectedExpiryRef = useRef(selectedExpiry);
  selectedExpiryRef.current = selectedExpiry;
  const requestIdRef = useRef(0);

  const board = useMemo(
    () => buildBoard(rows, market?.atm ?? null, market?.strike_step ?? null),
    [rows, market?.atm, market?.strike_step]
  );

  const loadChain = useCallback(
    async (expiryOverride?: string | null) => {
      if (!underlying) return;
      const exp = expiryOverride !== undefined ? expiryOverride : selectedExpiryRef.current;
      const myId = ++requestIdRef.current;
      setLoading(true);
      try {
        const qp: Record<string, string> = {
          underlying_symbol: underlying,
          view_mode: "full",
          exchange: chainExchange,
        };
        if (exp) qp.expiry = exp;
        const res = await authFetch("optionchain/", {}, qp);
        const data = await res.json();
        if (myId !== requestIdRef.current) return;
        setRows(Array.isArray(data) ? data : []);
      } catch {
        if (myId === requestIdRef.current) setRows([]);
      } finally {
        if (myId === requestIdRef.current) setLoading(false);
      }
    },
    [underlying, chainExchange]
  );

  const bootstrap = useCallback(async () => {
    if (!underlying) {
      setExpiries([]);
      setSelectedExpiry(null);
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const exRes = await authFetch(
        "optionchain/expiries/",
        {},
        {
          underlying_symbol: underlying,
          exchange: chainExchange,
          view_mode: "full",
        }
      );
      const exData = await exRes.json();
      const list: string[] = Array.isArray(exData.expiries) ? exData.expiries : [];
      setExpiries(list);
      const prev = selectedExpiryRef.current;
      const nextExp = prev && list.includes(prev) ? prev : list[0] ?? null;
      setSelectedExpiry(nextExp);
      await loadChain(nextExp);
    } catch {
      setExpiries([]);
      setRows([]);
      setLoading(false);
    }
  }, [underlying, chainExchange, loadChain]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const pollTicks = useCallback(async () => {
    const current = rowsRef.current;
    const tokens = current
      .map((r) => r.zerodha_instrument_token)
      .filter((t): t is number => typeof t === "number" && t > 0);
    if (tokens.length === 0) {
      setTicks({});
      return;
    }
    const merged: Record<string, { last_price?: number }> = {};
    try {
      const res = await authFetch(
        "market/quotes/",
        {},
        { instruments: tokens.map((t) => String(t)).join(",") }
      );
      if (!res.ok) return;
      const payload = (await res.json()) as { data?: Record<string, QuoteRow> };
      const data = payload?.data ?? {};
      for (const tok of tokens) {
        const lp = lastPriceFromQuoteData(data, String(tok), tok);
        if (lp != null) merged[String(tok)] = { last_price: lp };
      }
      setTicks(merged);
    } catch {
      /* ignore */
    }
  }, []);

  useVisibilityAwareInterval(pollTicks, TICK_POLL_MS, {
    enabled: board.length > 0,
    runImmediately: true,
  });

  function ltpFor(row: OptionChainApiRow | null): number | null {
    if (!row) return null;
    const tok = row.zerodha_instrument_token;
    const lp = ticks[String(tok)]?.last_price;
    return typeof lp === "number" ? lp : null;
  }

  function fireOrder(row: OptionChainApiRow, intent: "buy" | "sell") {
    const instrument = instrumentForBroker(row, brokerName);
    if (!instrument) return;
    const lot = row.lot_size && row.lot_size > 0 ? row.lot_size : 1;
    onBuySell({
      instrument,
      exchange: (row.exchange || chainExchange || "NFO").trim() || "NFO",
      lot_size: lot,
      intent,
      label: `${row.option_type} ${row.strike}`,
    });
  }

  if (names.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-base-content/60">
        No underlyings on this strategy.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {names.length > 1 ? (
            <div className="tabs tabs-boxed tabs-sm">
              {names.map((n, i) => (
                <button
                  key={n}
                  type="button"
                  className={`tab ${i === tab ? "tab-active" : ""}`}
                  onClick={() => setTab(i)}
                >
                  {n}
                </button>
              ))}
            </div>
          ) : (
            <span className="text-sm font-medium">{underlying}</span>
          )}
          {market?.spot != null ? (
            <span className="text-xs text-base-content/60 tabular-nums">
              Spot {formatMoneyIN(market.spot)}
              {market.atm != null ? ` · ATM ${formatMoneyIN(market.atm)}` : ""}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <select
            className="select select-bordered select-sm max-w-[11rem]"
            value={selectedExpiry ?? ""}
            onChange={(e) => {
              const v = e.target.value || null;
              setSelectedExpiry(v);
              void loadChain(v);
            }}
            disabled={loading || expiries.length === 0}
          >
            {expiries.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            title="Refresh option chain"
            disabled={loading}
            onClick={() => void bootstrap()}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {loading && board.length === 0 ? (
        <div className="flex justify-center py-10">
          <span className="loading loading-spinner loading-md" />
        </div>
      ) : board.length === 0 ? (
        <p className="py-8 text-center text-sm text-base-content/60">
          No option chain rows for this selection.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-base-300">
          <table className="table table-sm w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-base-content/60">
                <th className="text-right">CE LTP</th>
                <th className="text-center">CE</th>
                <th className="text-center">Strike</th>
                <th className="text-center">PE</th>
                <th className="text-left">PE LTP</th>
              </tr>
            </thead>
            <tbody>
              {board.map((row) => {
                const ceLtp = ltpFor(row.ce);
                const peLtp = ltpFor(row.pe);
                return (
                  <tr
                    key={row.strike}
                    className={row.isAtm ? "bg-primary/10 font-medium" : undefined}
                  >
                    <td className="text-right tabular-nums">
                      {ceLtp != null ? formatMoneyIN(ceLtp) : "—"}
                    </td>
                    <td className="text-center whitespace-nowrap">
                      {row.ce ? (
                        <div className="inline-flex gap-1">
                          <button
                            type="button"
                            className="btn btn-xs btn-square btn-outline btn-success font-semibold"
                            title="Buy CE"
                            onClick={() => fireOrder(row.ce!, "buy")}
                          >
                            B
                          </button>
                          <button
                            type="button"
                            className="btn btn-xs btn-square btn-outline btn-error font-semibold"
                            title="Sell CE"
                            onClick={() => fireOrder(row.ce!, "sell")}
                          >
                            S
                          </button>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td
                      className={`text-center tabular-nums ${
                        row.isAtm ? "text-primary font-semibold" : ""
                      }`}
                    >
                      {row.strike}
                    </td>
                    <td className="text-center whitespace-nowrap">
                      {row.pe ? (
                        <div className="inline-flex gap-1">
                          <button
                            type="button"
                            className="btn btn-xs btn-square btn-outline btn-success font-semibold"
                            title="Buy PE"
                            onClick={() => fireOrder(row.pe!, "buy")}
                          >
                            B
                          </button>
                          <button
                            type="button"
                            className="btn btn-xs btn-square btn-outline btn-error font-semibold"
                            title="Sell PE"
                            onClick={() => fireOrder(row.pe!, "sell")}
                          >
                            S
                          </button>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="text-left tabular-nums">
                      {peLtp != null ? formatMoneyIN(peLtp) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
