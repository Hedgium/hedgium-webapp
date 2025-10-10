"use client";

import React, { useEffect, useState } from "react";
import TradeCycleWithPositionsCard from "@/components/TradeCyclePositions";
import Slider from "@/components/Slider";
import { authFetch } from "@/utils/api";

type TradeCycle = {
  id: string;
  name: string;
  description: string;
  state: "NEW" | "PENDING" | "COMPLETED" | "STOPPED";
  sub_state: string;
  created_at: string;
  updated_at: string;
};

type PnlSummary = {
  all_time?: number;
  last_year?: number;
  last_month?: number;
  last_week?: number;
  today?: number;
};

export default function TradeCyclesPage() {
  const [tradeCycles, setTradeCycles] = useState<TradeCycle[]>([]);
  const [pnlSummary, setPnlSummary] = useState<PnlSummary | null>(null);

  // Fetch PNL summary from backend
  async function getPNLSummary() {
    try {
      const res = await authFetch("positions/pnl/");
      if (!res.ok) throw new Error("Failed to fetch PNL summary");
      const data = await res.json();
      console.log("PNL Summary:", data);
      setPnlSummary({
        all_time: data.pnl_summary?.all_time,
        last_month: data.pnl_summary?.last_month
      })
    } catch (error) {
      console.error("Error fetching PNL summary:", error);
    }
  }

  // Fetch trade cycles
  async function getAllTradeCycles() {
    try {
      const res = await authFetch("trade-cycles/?state=ACTIVATED");
      if (!res.ok) throw new Error("Failed to fetch trade cycles");
      const data = await res.json();
      setTradeCycles(data.results);
    } catch (error) {
      console.error("Error fetching trade cycles:", error);
    }
  }

  useEffect(() => {
    getAllTradeCycles();
    getPNLSummary();
  }, []);

  return (
    <div className="p-4">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Trading Dashboard</h1>
          <p className="text-gray-600">Monitor your algorithmic trading performance</p>
        </div>

      </div>

        {pnlSummary && (
  <div>
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-800">PnL Summary</h3>
      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
    </div>
    
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {Object.entries(pnlSummary).map(([period, value]) => (
        <div 
          key={period} 
          className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
            value >= 0 
              ? "bg-emerald-50 border border-emerald-100" 
              : "bg-rose-50 border border-rose-100"
          }`}>
            <span className={`text-lg ${
              value >= 0 ? "text-emerald-600" : "text-rose-600"
            }`}>
              {value >= 0 ? "↗" : "↘"}
            </span>
          </div>
          
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            {period
              .split("_")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" ")}
          </span>
          
          <span
            className={`text-xl font-bold mb-1 ${
              value >= 0 ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            ₹{value.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${
              value >= 0 
                ? "bg-emerald-50 text-emerald-700" 
                : "bg-rose-50 text-rose-700"
            }`}
          >
            {value >= 0 ? "+ Profit" : "Loss"}
          </span>
        </div>
      ))}
    </div>
  </div>
)}


<br />

      {/* TRADE CYCLES */}
      <h2 className="text-2xl font-bold mb-6">Trade Cycles</h2>
      <Slider>
        {tradeCycles.map((cycle) => (
          <TradeCycleWithPositionsCard key={cycle.id} tradeCycle={cycle} />
        ))}
      </Slider>
    </div>
  );
}
