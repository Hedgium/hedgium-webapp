"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useTickStream } from "@/hooks/useTickStream";
import { authFetch } from "@/utils/api";

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

// Configuration: Add or remove instruments here
const STATIC_INSTRUMENTS = [
  { name: "NIFTY 50", token: 256265, mode: "FULL" },
  { name: "SENSEX", token: 265, mode: "FULL" },
  { name: "BANKNIFTY", token: 260105, mode: "FULL" },
];

export default function MarketHeader() {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [activeUnderlyings, setActiveUnderlyings] = useState<UnderlyingToken[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch active underlyings from trade cycles
  useEffect(() => {
    async function fetchActiveUnderlyings() {
      try {
        const res = await authFetch("trade-cycles/active-underlyings/");
        if (res.ok) {
          const data = await res.json();
          console.log(data);
          setActiveUnderlyings(data);
        }
      } catch (error) {
        console.error("Error fetching active underlyings:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchActiveUnderlyings();
  }, []);

  // Combine static instruments with active underlyings
  const allInstruments = useMemo(() => [
    ...STATIC_INSTRUMENTS,
    ...activeUnderlyings.map(underlying => ({
      name: underlying.name,
      token: underlying.token,
      mode: "FULL" as const
    }))
  ], [activeUnderlyings]);

  // Subscribe to all configured instruments
  const { ticks, isConnected } = useTickStream(
    allInstruments.map(inst => ({ token: inst.token, mode: inst.mode }))
  );

  // console.log("🔍 MarketHeader - ticks:", ticks, "isConnected:", isConnected);

  useEffect(() => {
    // console.log("🔍 MarketHeader - ticks:", ticks, "isConnected:", isConnected);
    const newMarketData: MarketData[] = [];
    // Process each instrument in order
    allInstruments.forEach(instrument => {
      const tick = ticks[instrument.token];

      if (tick && tick.last_price) {
        const change = tick.ohlc?.close
          ? tick.last_price - tick.ohlc.close
          : 0;
        const changePercent = tick.ohlc?.close
          ? (change / tick.ohlc.close) * 100
          : 0;

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
    }
  }, [ticks, allInstruments]);

  return (
    <div className="bg-base-200 rounded-lg mb-4">
      <div
        ref={scrollRef}
        className="flex flex-nowrap overflow-x-auto md:flex-wrap gap-4 justify-between scrollbar-hide snap-x snap-mandatory"
      >
        {loading && (
          <div className="p-4 text-center w-full text-gray-500">
            Loading instruments...
          </div>
        )}
        {!loading && marketData.length === 0 && (
          <div className="p-4 text-center w-full text-gray-500">
            Loading market data...
          </div>
        )}

        {marketData.map((item, index) => (
          <div key={index} className="flex-1 min-w-[200px] snap-center">
            <div className="bg-base-100 p-4 border border-base-300 rounded-lg">
              <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold">
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
        ))}
      </div>
    </div>
  );
}
