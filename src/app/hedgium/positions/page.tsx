"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
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

export default function TradeCyclesPage() {
  const [tradeCycles, setTradeCycles] = useState<TradeCycle[]>([]);
  const [loading, setLoading] = useState(true);

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
      await getAllTradeCycles();
      setLoading(false);
    })();
  }, []);

  return (
    <div className="p-4 md:px-8 bg-base-200 min-h-screen">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-gray-600 text-lg">Loading positions data...</p>
        </div>
      ) : (
        <div className="mx-auto space-y-12">
          {/* --- Trade Cycles Section --- */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-2xl font-semibold">Strategy Positionss</h2>
            </div>

            {tradeCycles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4">
                {tradeCycles.map((cycle) => (
                  <TradeCycleWithPositionsCard
                    key={cycle.id}
                    tradeCycle={cycle}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-base-100 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-2">
                  No Active Trade Cycles
                </h3>
                <p className="text-gray-600">
                  {`You don't have any active trade cycles currently.`}
                </p>
              </div>
            )}
          </section>
        </div>
      )}

      <br />
      <br />
    </div>
  );
}
