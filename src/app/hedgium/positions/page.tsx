"use client";

import React, { useEffect, useState } from "react";
import { Loader2, TrendingUp, RotateCw } from "lucide-react";
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
  const [loading, setLoading] = useState(true);

  // Fetch PNL summary from backend
  async function getPNLSummary() {
    try {
      const res = await authFetch("positions/pnl/");
      if (!res.ok) throw new Error("Failed to fetch PNL summary");
      const data = await res.json();
      setPnlSummary({
        all_time: data.pnl_summary?.all_time,
        last_month: data.pnl_summary?.last_month,
        last_week: data.pnl_summary?.last_week,
        today: data.pnl_summary?.today,
      });
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
    (async () => {
      setLoading(true);
      await Promise.all([getPNLSummary(), getAllTradeCycles()]);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="p-4 md:px-8 bg-base-200 min-h-screen">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-gray-600 text-lg">Loading dashboard data...</p>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto space-y-12">

          {/* --- PnL Summary Section --- */}
          {pnlSummary && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-primary" />
                  <h3 className="text-2xl font-semibold">PnL Summary</h3>
                </div>
                <RotateCw
                  className="w-5 h-5 text-gray-400 hover:text-primary cursor-pointer transition-colors"
                  onClick={() => {
                    setLoading(true);
                    getPNLSummary().finally(() => setLoading(false));
                  }}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {Object.entries(pnlSummary).map(([period, value]) => (
                  <div
                    key={period}
                    className="flex flex-col items-center p-4 bg-base-100 rounded-xl border border-base-300 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    

                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      {period
                        .split("_")
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(" ")}
                    </span>

                    <span
                      className={`text-xl font-bold mb-1 ${
                        value && value >= 0
                          ? "text-emerald-600"
                          : "text-rose-600"
                      }`}
                    >
                      ₹
                      {value
                        ? value.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : "0.00"}
                      {value && value >= 0 ? " ↗" : " ↘"}

                    </span>

                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        value && value >= 0
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {value && value >= 0 ? "+ Profit" : "Loss"}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* --- Trade Cycles Section --- */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-2xl font-semibold">Active Trade Cycles</h2>
            </div>

            {tradeCycles.length > 0 ? (
              <Slider>
                {tradeCycles.map((cycle) => (
                  <TradeCycleWithPositionsCard
                    key={cycle.id}
                    tradeCycle={cycle}
                  />
                ))}
              </Slider>
            ) : (
              <div className="text-center py-16 bg-base-100 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-2">
                  No Active Trade Cycles
                </h3>
                <p className="text-gray-600">
                  {`You don’t have any active trade cycles currently.`}
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
