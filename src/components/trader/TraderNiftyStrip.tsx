"use client";

import { useCallback, useEffect, useState } from "react";
import { useTickStream } from "@/hooks/useTickStream";
import { useVisibilityAwareInterval } from "@/hooks/useVisibilityAwareInterval";
import { authFetch } from "@/utils/api";

const NIFTY = { name: "NIFTY", token: 256265, mode: "FULL" as const };
const POLLING_INTERVAL_MS = 60_000;
const WS_STABLE_GRACE_MS = 10_000;

type QuotePayload = {
  last_price?: number;
  ltp?: number;
  ohlc?: { close?: number };
  close?: number;
  previous_close?: number;
  instrument_token?: number;
};

export default function TraderNiftyStrip() {
  const [price, setPrice] = useState<number | null>(null);
  const [changePercent, setChangePercent] = useState<number | null>(null);
  const [isWsStable, setIsWsStable] = useState(false);

  const { ticks, isConnected } = useTickStream([
    { token: NIFTY.token, mode: NIFTY.mode },
  ]);

  useEffect(() => {
    if (!isConnected) {
      setIsWsStable(false);
      return;
    }
    const timer = setTimeout(() => setIsWsStable(true), WS_STABLE_GRACE_MS);
    return () => clearTimeout(timer);
  }, [isConnected]);

  const applyQuote = (value: number, prevClose: number | null | undefined) => {
    setPrice(value);
    if (typeof prevClose === "number" && prevClose !== 0) {
      setChangePercent(((value - prevClose) / prevClose) * 100);
    } else {
      setChangePercent(null);
    }
  };

  const fetchFromApi = useCallback(async () => {
    try {
      const res = await authFetch(
        "market/quotes/",
        {},
        { instruments: String(NIFTY.token) }
      );
      if (!res.ok) return;
      const payload = await res.json();
      const quoteMap = (payload?.data ?? {}) as Record<string, QuotePayload>;
      const quote =
        quoteMap[String(NIFTY.token)] ??
        Object.values(quoteMap).find((q) => q?.instrument_token === NIFTY.token);
      const value = quote?.last_price ?? quote?.ltp;
      if (typeof value !== "number") return;
      const prevClose = quote?.ohlc?.close ?? quote?.close ?? quote?.previous_close;
      applyQuote(value, prevClose);
    } catch (error) {
      console.error("NIFTY quote fetch failed:", error);
    }
  }, []);

  useVisibilityAwareInterval(fetchFromApi, POLLING_INTERVAL_MS, {
    enabled: !isWsStable,
    runImmediately: true,
  });

  useEffect(() => {
    if (!isWsStable) return;
    const tick = ticks[NIFTY.token];
    if (!tick?.last_price) return;
    applyQuote(tick.last_price, tick.ohlc?.close);
  }, [ticks, isWsStable]);

  const up = (changePercent ?? 0) >= 0;
  const priceText =
    price != null
      ? price.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "—";
  const pctText =
    changePercent != null
      ? `${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}%`
      : "—";

  return (
    <div
      className="flex h-10 items-center gap-3 px-4 text-sm tabular-nums"
      aria-label="NIFTY index"
    >
      <span className="font-semibold tracking-wide text-base-content/80">
        {NIFTY.name}
      </span>
      <span className="font-semibold text-base-content">{priceText}</span>
      <span className={`font-medium ${up ? "text-success" : "text-error"}`}>
        {pctText}
      </span>
    </div>
  );
}
