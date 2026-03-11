"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useTickStream } from "@/hooks/useTickStream";
import { authFetch } from "@/utils/api";
import MarketDataCardSkeleton from "./skeletons/MarketDataCardSkeleton";

interface MarketData {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

interface UnderlyingToken {
  name: string;
  token: number;
}

interface QuotePayload {
  last_price?: number;
  ltp?: number;
  ohlc?: {
    close?: number;
  };
  close?: number;
  previous_close?: number;
  instrument_token?: number;
}

// Configuration: Add or remove instruments here
const STATIC_INSTRUMENTS = [
  { name: "NIFTY 50", token: 256265, mode: "FULL" },
  { name: "SENSEX", token: 265, mode: "FULL" },
  { name: "BANKNIFTY", token: 260105, mode: "FULL" },
];

const POLLING_INTERVAL_MS = 60_000;
const WS_STABLE_GRACE_MS = 10_000;

export default function MarketHeader() {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [activeUnderlyings, setActiveUnderlyings] = useState<UnderlyingToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [source, setSource] = useState<"api" | "ws" | "none">("none");
  const [isWsStable, setIsWsStable] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch active underlyings from trade cycles
  useEffect(() => {
    async function fetchActiveUnderlyings() {
      try {
        const res = await authFetch("trade-cycles/active-underlyings/");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setActiveUnderlyings(data);
          }
        }
      } catch (error) {
        console.error("Error fetching active underlyings:", error);
      }
    }
    fetchActiveUnderlyings();
  }, []);

  // Combine static instruments with active underlyings
  const allInstruments = useMemo(() => {
    const merged = [
      ...STATIC_INSTRUMENTS,
      ...activeUnderlyings.map((underlying) => ({
        name: underlying.name,
        token: underlying.token,
        mode: "FULL" as const,
      })),
    ];
    const byToken = new Map<number, (typeof merged)[number]>();
    merged.forEach((item) => {
      if (!byToken.has(item.token)) {
        byToken.set(item.token, item);
      }
    });
    return Array.from(byToken.values());
  }, [activeUnderlyings]);

  // Subscribe to all configured instruments
  const { ticks, isConnected } = useTickStream(
    allInstruments.map((inst) => ({ token: inst.token, mode: inst.mode }))
  );

  const buildDataFromQuotes = (
    quoteMap: Record<string, QuotePayload>,
    instruments: { name: string; token: number }[]
  ): MarketData[] => {
    const output: MarketData[] = [];
    instruments.forEach((instrument) => {
      const direct = quoteMap[String(instrument.token)];
      const fallbackEntry = Object.values(quoteMap).find(
        (value) => value?.instrument_token === instrument.token
      );
      const quote = direct ?? fallbackEntry;

      const value = quote?.last_price ?? quote?.ltp;
      const prevClose = quote?.ohlc?.close ?? quote?.close ?? quote?.previous_close;

      if (typeof value === "number") {
        const change = typeof prevClose === "number" ? value - prevClose : 0;
        const changePercent = typeof prevClose === "number" && prevClose !== 0 ? (change / prevClose) * 100 : 0;

        output.push({
          name: instrument.name,
          value,
          change,
          changePercent,
        });
      }
    });
    return output;
  };

  useEffect(() => {
    if (!isConnected) {
      setIsWsStable(false);
      return;
    }
    const stableTimer = setTimeout(() => {
      setIsWsStable(true);
    }, WS_STABLE_GRACE_MS);

    return () => clearTimeout(stableTimer);
  }, [isConnected]);

  useEffect(() => {
    let cancelled = false;

    async function fetchFromApi() {
      if (allInstruments.length === 0) {
        return;
      }
      try {
        const instruments = allInstruments.map((inst) => String(inst.token)).join(",");
        const res = await authFetch("market/quotes/", {}, { instruments });
        if (!res.ok) {
          throw new Error("Unable to fetch quotes");
        }
        const payload = await res.json();
        const quoteMap = (payload?.data ?? {}) as Record<string, QuotePayload>;
        const parsed = buildDataFromQuotes(quoteMap, allInstruments);

        if (!cancelled && parsed.length > 0) {
          setMarketData(parsed);
          setSource("api");
          setLastUpdatedAt(Date.now());
          setApiError(null);
          setLoading(false);
        }
      } catch (error) {
        if (!cancelled) {
          setApiError("Live market API unavailable. Retrying every minute.");
          setLoading(false);
          console.error("Error fetching market quotes:", error);
        }
      }
    }

    fetchFromApi();
    if (isWsStable) {
      return () => {
        cancelled = true;
      };
    }

    const interval = setInterval(fetchFromApi, POLLING_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [allInstruments, isWsStable]);

  useEffect(() => {
    if (!isWsStable) return;

    const newMarketData: MarketData[] = [];
    allInstruments.forEach((instrument) => {
      const tick = ticks[instrument.token];

      if (tick && tick.last_price) {
        const change = tick.ohlc?.close ? tick.last_price - tick.ohlc.close : 0;
        const changePercent = tick.ohlc?.close ? (change / tick.ohlc.close) * 100 : 0;

        newMarketData.push({
          name: instrument.name,
          value: tick.last_price,
          change,
          changePercent,
        });
      }
    });

    if (newMarketData.length > 0) {
      setMarketData(newMarketData);
      setSource("ws");
      setLastUpdatedAt(Date.now());
      setApiError(null);
      setLoading(false);
    }
  }, [ticks, allInstruments, isWsStable]);

  return (
    <section className="mb-2 pb-3">
      <div className="flex items-center justify-between mb-2 px-1">
        <p className="text-xs text-base-content/70">
          Market Today
        </p>
        {lastUpdatedAt ? (
          <span className="text-xs text-base-content/60">
            Updated {new Date(lastUpdatedAt).toLocaleTimeString()}
          </span>
        ) : null}
      </div>
      <div
        ref={scrollRef}
        className="flex flex-nowrap overflow-x-auto md:flex-wrap gap-4 justify-between scrollbar-hide snap-x snap-mandatory"
      >
        {loading ? (
          <>
            {[...Array(3)].map((_, i) => (
              <MarketDataCardSkeleton key={i} />
            ))}
          </>
        ) : marketData.length > 0 ? (
          marketData.map((item, index) => (
            <div key={index} className="flex-1 min-w-[200px] snap-center">
              <div className="bg-base-100 p-4 border border-base-300 rounded-xl">
                <h3 className="font-semibold text-base lg:text-lg mb-1 text-base-content">{item.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-base-content">
                    {item.value.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <div
                    className={`flex items-center ${item.change >= 0 ? "text-success" : "text-error"
                      }`}
                  >
                    {item.change >= 0 ? (
                      <TrendingUp width={18} height={18} className="mr-1" />
                    ) : (
                      <TrendingDown width={18} height={18} className="mr-1" />
                    )}
                    <span>
                      {item.change >= 0 ? "+" : ""}
                      {item.change.toFixed(2)} ({item.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center w-full text-base-content/60">
            {apiError ?? "No market data available"}
          </div>
        )}
      </div>
      {!loading && apiError && marketData.length > 0 && (
        <p className="text-xs text-warning mt-2 px-1">{apiError}</p>
      )}
    </section>
  );
}
