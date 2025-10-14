'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Target } from 'lucide-react';
import Slider from '@/components/Slider';
import TradeCycleCard from "@/components/TradeCycleCard";
import MarketHeader from '@/components/MarketHeader';
import { authFetch } from '@/utils/api';

export default function Dashboard() {
  const [activeTradeCycles, setActiveTradeCycles] = useState([]);
  const [nextActiveTradeCycles, setNextActiveTradeCycles] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function getActiveTradeCycles() {
    setLoading(true);
    try {
      const res = await authFetch('trade-cycles/?approved=true&page=1&page_size=10');
      if (res.ok) {
        const data = await res.json();
        setActiveTradeCycles(data.results);
        setNextActiveTradeCycles(data.next);
      } else {
        setActiveTradeCycles([]);
      }
    } catch {
      setActiveTradeCycles([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getActiveTradeCycles();
  }, []);

  return (
    <div className="bg-base-200 p-4 md:px-8 min-h-screen">
      <MarketHeader />
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2">
              <Target className="w-6 h-6 text-primary" />
              <h1 className="text-2xl md:text-3xl font-semibold">Strategies</h1>
            </div>
            <p className="text-sm text-gray-500 ">Explore your currently active trade cycles</p>
          </div>
        </div>

        {/* Strategy Cards */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 bg-base-100 rounded-lg shadow">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-gray-600 text-lg">Loading active trade cycles...</p>
          </div>
        ) : activeTradeCycles.length > 0 ? (
          <Slider>
            {activeTradeCycles.map((tc) => (
              <TradeCycleCard key={tc?.id} tradeCycle={tc} isActive={true} />
            ))}
          </Slider>
        ) : (
          <div className="text-center py-12 bg-base-100 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">No Active Trade Cycles</h3>
            <p className="text-gray-600">
              {`You don't have any active trade cycles at the moment.`}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
