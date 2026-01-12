"use client";

import React, { useEffect, useState } from "react";
import TradeCycleWithPositionsCard from "@/components/TradeCyclePositions";
import TradeCyclePositionsSkeleton from "@/components/skeletons/TradeCyclePositionsSkeleton";
import LivePositionsModal, { LivePositionsData } from "@/components/LivePositionsModal";
import { authFetch } from "@/utils/api";
import useAlert from "@/hooks/useAlert";
import { TrendingUp } from "lucide-react";

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
  const alert = useAlert();
  const [tradeCycles, setTradeCycles] = useState<TradeCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLivePositionsModal, setShowLivePositionsModal] = useState(false);
  const [livePositions, setLivePositions] = useState<LivePositionsData | null>(null);
  const [loadingLivePositions, setLoadingLivePositions] = useState(false);

  // Fetch trade cycles
  async function getAllTradeCycles() {
    try {
      const res = await authFetch("trade-cycles/");
      if (!res.ok) throw new Error("Failed to fetch trade cycles");
      const data = await res.json();
      setTradeCycles(data.results);
    } catch (error) {
      console.error("Error fetching trade cycles:", error);
    }
  }

  // Fetch live positions from broker
  async function fetchLivePositions() {
    setLoadingLivePositions(true);
    try {
      const response = await authFetch("positions/live/positions");
      const data = await response.json();

      console.log("data", data);
      if (data.status === "success") {
        setLivePositions(data);
        setShowLivePositionsModal(true);
        alert.success("Live positions fetched successfully");
      } else {
        alert.error("Failed to fetch live positions");
      }
    } catch (error) {
      console.error("Error fetching live positions:", error);
      alert.error("Error fetching live positions");
    } finally {
      setLoadingLivePositions(false);
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
      <div className="mx-auto space-y-12">
        {/* --- Trade Cycles Section --- */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Strategy Positions</h2>
            
            <button
              onClick={fetchLivePositions}
              disabled={loadingLivePositions}
              className={`btn btn-primary btn-outline btn-sm ${loadingLivePositions ? "loading" : ""}`}
            >
              {!loadingLivePositions && <TrendingUp size={16} className="mr-2" />}
              Live Positions
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-4">
              {[...Array(3)].map((_, i) => (
                <TradeCyclePositionsSkeleton key={i} />
              ))}
            </div>
          ) : tradeCycles.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
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

      <br />
      <br />

      {/* Live Positions Modal */}
      <LivePositionsModal
        isOpen={showLivePositionsModal}
        onClose={() => setShowLivePositionsModal(false)}
        positions={livePositions}
        title="Live Positions"
      />
    </div>
  );
}
