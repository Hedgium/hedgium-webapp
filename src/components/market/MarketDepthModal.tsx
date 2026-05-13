"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import AsyncSelect from "react-select/async";
import { authFetch } from "@/utils/api";
import { formatMoneyIN } from "@/utils/formatNumber";
import { RefreshCw, X, TrendingUp, TrendingDown } from "lucide-react";

/**
 * Reusable market-depth modal.
 *
 * Backed by `GET market/instruments/search/` (staff-only) and `GET market/quotes/`
 * (any authed user). Uses the numeric `instrument_token` as the quote key — same
 * pattern as the strategy builder leg form so we know it works for EQ/FUT/options.
 */

interface InstrumentSearchResult {
  tradingsymbol: string;
  name: string;
  instrument_token: number;
  exchange: string;
  lot_size: number;
  exists?: boolean;
}

interface InstrumentOption {
  label: string;
  value: string;
  token: string;
  exchange: string;
}

interface DepthLevel {
  price: number;
  quantity: number;
  orders: number;
}

interface QuotePayload {
  instrument_token?: number;
  last_price?: number;
  last_quantity?: number;
  buy_quantity?: number;
  sell_quantity?: number;
  volume?: number;
  average_price?: number;
  oi?: number;
  net_change?: number;
  lower_circuit_limit?: number;
  upper_circuit_limit?: number;
  ohlc?: { open?: number; high?: number; low?: number; close?: number };
  depth?: { buy?: DepthLevel[]; sell?: DepthLevel[] };
  last_trade_time?: string;
  timestamp?: string;
}

export type MarketDepthInstrumentType = "EQ" | "FUT";

export interface MarketDepthModalProps {
  open: boolean;
  onClose: () => void;
  /** Optional starting tradingsymbol — modal auto-selects exact match if found. */
  initialSymbol?: string;
  /** Default instrument_type for the underlying search. */
  defaultInstrumentType?: MarketDepthInstrumentType;
  /** Poll interval for live depth refresh while open. Default 2000ms. */
  refreshIntervalMs?: number;
}

const INSTRUMENT_TYPES: { id: MarketDepthInstrumentType; label: string }[] = [
  { id: "EQ", label: "Equity (EQ)" },
  { id: "FUT", label: "Futures (FUT)" },
];

export default function MarketDepthModal({
  open,
  onClose,
  initialSymbol,
  defaultInstrumentType = "EQ",
  refreshIntervalMs = 2000,
}: MarketDepthModalProps) {
  const [instrumentType, setInstrumentType] = useState<MarketDepthInstrumentType>(defaultInstrumentType);
  const [selected, setSelected] = useState<InstrumentOption | null>(null);
  const [quote, setQuote] = useState<QuotePayload | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const seedRanRef = useRef(false);

  useEffect(() => {
    if (!open) {
      setSelected(null);
      setQuote(null);
      setError(null);
      setLoadingQuote(false);
      seedRanRef.current = false;
    }
  }, [open]);

  const loadOptions = useCallback(
    async (inputValue: string): Promise<InstrumentOption[]> => {
      if (!inputValue || !inputValue.trim()) return [];
      try {
        const response = await authFetch(
          `market/instruments/search/?instrument_type=${instrumentType}&q=${encodeURIComponent(inputValue)}`
        );
        if (!response.ok) return [];
        const data = (await response.json()) as InstrumentSearchResult[];
        return data.map((item) => ({
          label: `${item.tradingsymbol} — ${item.name} · ${item.exchange}`,
          value: item.tradingsymbol,
          token: item.instrument_token.toString(),
          exchange: item.exchange,
        }));
      } catch (err) {
        console.error("Instrument search failed:", err);
        return [];
      }
    },
    [instrumentType]
  );

  const fetchDepth = useCallback(async (token: string) => {
    setLoadingQuote(true);
    setError(null);
    try {
      const response = await authFetch("market/quotes/", {}, { instruments: token });
      if (!response.ok) {
        setError("Failed to fetch quote");
        return;
      }
      const payload = (await response.json()) as { data?: Record<string, QuotePayload> };
      const data = payload?.data?.[token] ?? null;
      setQuote(data);
      if (!data) setError("No quote data returned for this instrument");
    } catch (err) {
      console.error("Quote fetch failed:", err);
      setError("Quote fetch error");
    } finally {
      setLoadingQuote(false);
    }
  }, []);

  useEffect(() => {
    if (!open || seedRanRef.current) return;
    if (!initialSymbol || !initialSymbol.trim()) return;
    seedRanRef.current = true;
    (async () => {
      const matches = await loadOptions(initialSymbol.trim());
      const exact = matches.find((m) => m.value.toUpperCase() === initialSymbol.trim().toUpperCase());
      const pick = exact || matches[0];
      if (pick) setSelected(pick);
    })();
  }, [open, initialSymbol, loadOptions]);

  useEffect(() => {
    if (!open || !selected?.token) return;
    fetchDepth(selected.token);
    if (!autoRefresh) return;
    const id = window.setInterval(() => fetchDepth(selected.token), refreshIntervalMs);
    return () => window.clearInterval(id);
  }, [open, selected, autoRefresh, refreshIntervalMs, fetchDepth]);

  if (!open) return null;

  const ohlc = quote?.ohlc ?? {};
  const ltp = quote?.last_price ?? null;
  const close = ohlc.close ?? null;
  const change = ltp != null && close != null ? ltp - close : null;
  const changePct = change != null && close ? (change / close) * 100 : null;
  const changeColor =
    change == null ? "text-base-content" : change >= 0 ? "text-success" : "text-error";

  const padLevels = (levels?: DepthLevel[]): DepthLevel[] =>
    Array.from({ length: 5 }, (_, idx) => levels?.[idx] ?? { price: 0, quantity: 0, orders: 0 });

  const buyLevels = padLevels(quote?.depth?.buy);
  const sellLevels = padLevels(quote?.depth?.sell);

  const totalBuyQty = buyLevels.reduce((sum, l) => sum + (l.quantity || 0), 0);
  const totalSellQty = sellLevels.reduce((sum, l) => sum + (l.quantity || 0), 0);

  return (
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">Market depth</h3>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-[160px_1fr]">
          <select
            className="select select-bordered select-sm"
            value={instrumentType}
            onChange={(e) => {
              setInstrumentType(e.target.value as MarketDepthInstrumentType);
              setSelected(null);
              setQuote(null);
            }}
          >
            {INSTRUMENT_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <AsyncSelect<InstrumentOption>
            cacheOptions
            defaultOptions
            loadOptions={loadOptions}
            value={selected}
            onChange={(option) => setSelected(option as InstrumentOption | null)}
            placeholder="Search instrument (e.g., RELIANCE, INFY, NIFTY)…"
            classNamePrefix="react-select"
          />
        </div>

        {!selected && (
          <p className="py-6 text-center text-sm text-base-content/60">
            Search and select an instrument to view its depth.
          </p>
        )}

        {selected && (
          <>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3 rounded-lg bg-base-200 p-3">
              <div>
                <p className="text-sm font-medium">{selected.value}</p>
                <p className="text-xs text-base-content/60">
                  {selected.exchange} · Token {selected.token}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`flex items-center justify-end gap-1 text-2xl font-bold tabular-nums ${changeColor}`}
                >
                  {change != null && (change >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />)}
                  {ltp != null ? formatMoneyIN(ltp) : "—"}
                </p>
                {change != null && changePct != null && (
                  <p className={`text-xs tabular-nums ${changeColor}`}>
                    {change >= 0 ? "+" : ""}
                    {formatMoneyIN(change)} ({changePct >= 0 ? "+" : ""}
                    {changePct.toFixed(2)}%)
                  </p>
                )}
              </div>
            </div>

            <div className="mb-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
              <Stat label="Open" value={ohlc.open} />
              <Stat label="High" value={ohlc.high} />
              <Stat label="Low" value={ohlc.low} />
              <Stat label="Close" value={ohlc.close} />
              <Stat label="Volume" value={quote?.volume} integer />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <DepthSide
                title="Bid (Buy)"
                totalLabel={`Total Qty: ${totalBuyQty.toLocaleString("en-IN")}`}
                levels={buyLevels}
                side="buy"
              />
              <DepthSide
                title="Ask (Sell)"
                totalLabel={`Total Qty: ${totalSellQty.toLocaleString("en-IN")}`}
                levels={sellLevels}
                side="sell"
              />
            </div>

            {error && <p className="mt-2 text-xs text-error">{error}</p>}
          </>
        )}

        <div className="modal-action mt-4 flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="toggle toggle-sm toggle-primary"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto refresh ({(refreshIntervalMs / 1000).toFixed(1)}s)
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={!selected || loadingQuote}
              onClick={() => selected && fetchDepth(selected.token)}
              title="Refresh now"
            >
              <RefreshCw size={14} className={loadingQuote ? "animate-spin" : ""} />
              Refresh
            </button>
            <button type="button" className="btn btn-sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  integer,
}: {
  label: string;
  value: number | undefined;
  integer?: boolean;
}) {
  return (
    <div className="rounded-md bg-base-200/60 px-2 py-1.5">
      <p className="text-[10px] uppercase tracking-wide text-base-content/50">{label}</p>
      <p className="font-mono text-sm tabular-nums text-base-content/90">
        {value == null ? "—" : integer ? value.toLocaleString("en-IN") : formatMoneyIN(value)}
      </p>
    </div>
  );
}

function DepthSide({
  title,
  totalLabel,
  levels,
  side,
}: {
  title: string;
  totalLabel: string;
  levels: DepthLevel[];
  side: "buy" | "sell";
}) {
  const accentColor = side === "buy" ? "text-success" : "text-error";
  return (
    <div className="rounded-lg border border-base-300 bg-base-100">
      <div className="flex items-center justify-between border-b border-base-300 px-3 py-2">
        <p className={`text-xs font-semibold uppercase tracking-wide ${accentColor}`}>{title}</p>
        <p className="text-[10px] text-base-content/60">{totalLabel}</p>
      </div>
      <table className="table table-xs">
        <thead>
          <tr className="text-[10px] uppercase text-base-content/50">
            <th className="text-right">Price</th>
            <th className="text-right">Qty</th>
            <th className="text-right">Orders</th>
          </tr>
        </thead>
        <tbody>
          {levels.map((lvl, idx) => (
            <tr key={idx}>
              <td className={`text-right font-mono tabular-nums ${accentColor}`}>
                {lvl.price ? formatMoneyIN(lvl.price) : "—"}
              </td>
              <td className="text-right font-mono tabular-nums">
                {lvl.quantity ? lvl.quantity.toLocaleString("en-IN") : "—"}
              </td>
              <td className="text-right font-mono tabular-nums">
                {lvl.orders ? lvl.orders.toLocaleString("en-IN") : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
