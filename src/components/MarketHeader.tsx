"use client";

import { useEffect, useState, useRef } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { myFetch } from "@/utils/api";

interface MarketData {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

export default function MarketHeader() {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMarketData = async () => {
    try {
      const res = await myFetch(
        "market/ohlc/?instruments=BSE%3ASENSEX%2CNSE%3ANIFTY%2B50",
      );
      const json = await res.json();

      if (json.status === "success" && json.data) {
        const parsed: MarketData[] = Object.entries(json.data).map(
          ([key, val]: any) => {
            const name = key.replace("NSE:", "").replace("BSE:", "");
            const ohlc = val.ohlc;
            const change = val.last_price - ohlc.close;
            const changePercent = (change / ohlc.close) * 100;

            return {
              name,
              value: val.last_price,
              change,
              changePercent,
            };
          }
        );

        setMarketData(parsed);
      }
    } catch (err) {
      console.error("Error fetching market data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 60 * 1000); // every 1 minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-base-200 rounded-lg mb-4">
      <div
        ref={scrollRef}
        className="flex flex-nowrap overflow-x-auto md:flex-wrap gap-4 justify-between scrollbar-hide snap-x snap-mandatory"
      >
        {loading && (
          <div className="p-4 text-center w-full text-gray-500">
            Loading market data...
          </div>
        )}

        {!loading && marketData.length === 0 && (
          <div className="p-4 text-center w-full text-gray-500">
            No market data available
          </div>
        )}

        {marketData.map((item, index) => (
          <div key={index} className="flex-1 min-w-[200px] snap-center md:flex-auto">
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
                  className={`flex items-center ${
                    item.change >= 0 ? "text-success" : "text-error"
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
