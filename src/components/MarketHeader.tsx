"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { useRef } from "react";

interface MarketData {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

export default function MarketHeader() {
  const data: MarketData[] = [
    { name: "NIFTY", value: 22416.50, change: 125.30, changePercent: 0.56 },
    { name: "SENSEX", value: 73872.29, change: 243.75, changePercent: 0.33 },
    { name: "NIFTY BANK", value: 47821.35, change: -182.45, changePercent: -0.38 }
  ];

  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="bg-base-200 rounded-lg mb-4">
      <div 
        ref={scrollRef}
        className="flex flex-nowrap overflow-x-auto md:flex-wrap gap-4 justify-between scrollbar-hide snap-x snap-mandatory"
      >
        {data.map((item, index) => (
          <div 
            key={index} 
            className="flex-1 min-w-[200px] snap-center md:flex-auto"
          >
            <div className="bg-base-100 p-4 border border-base-300 rounded-lg">
              <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold">{item.value.toLocaleString()}</span>
                <div className={`flex items-center ${item.change >= 0 ? 'text-success' : 'text-error'}`}>
                  {item.change >= 0 ? (
                    <TrendingUp size={18} className="mr-1" />
                  ) : (
                    <TrendingDown size={18} className="mr-1" />
                  )}
                  <span>
                    {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)} ({item.changePercent.toFixed(2)}%)
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