'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Target } from 'lucide-react';
import TradeCycleCard from "@/components/TradeCycleCard";
import MarketHeader from '@/components/MarketHeader';
import { authFetch } from '@/utils/api';

export default function Dashboard() {
  const [activeTradeCycles, setActiveTradeCycles] = useState([]);
  const [nextActiveTradeCycles, setNextActiveTradeCycles] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

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

  async function loadMoreTradeCycles() {
    if (!nextActiveTradeCycles) return;

    setLoadingMore(true);
    try {
      // Extract the URL path after the domain
      const url = new URL(nextActiveTradeCycles);
      const path = url.pathname + url.search;

      const res = await authFetch(path.replace('/api/', ''));
      if (res.ok) {
        const data = await res.json();
        setActiveTradeCycles(prev => [...prev, ...data.results]);
        setNextActiveTradeCycles(data.next);
      }
    } catch (error) {
      console.error('Error loading more trade cycles:', error);
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    getActiveTradeCycles();
  }, []);

  return (
    <div className="p-4 md:px-8 min-h-screen">

      <MarketHeader />
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 pt-2">
              <Target className="w-6 h-6 text-primary" />
              <h1 className="text-2xl md:text-3xl font-semibold">Strategies</h1>
            </div>
            <p className="text-sm text-base-content/50 ">Explore your currently active trade cycles</p>
          </div>
        </div>

        {/* Strategy Cards */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 bg-base-100 rounded-lg shadow">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-gray-600 text-lg">Loading active trade cycles...</p>
          </div>
        ) : activeTradeCycles.length > 0 ? (
          <>
            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
              {activeTradeCycles.map((tc) => (
                <TradeCycleCard key={tc?.id} tradeCycle={tc} isActive={true} />
              ))}
            </div>

            {/* Load More Button */}
            {nextActiveTradeCycles && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={loadMoreTradeCycles}
                  disabled={loadingMore}
                  className="btn btn-outline btn-primary"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 bg-base-100 rounded-box border border-base-300">
            <h3 className="text-xl font-semibold mb-2">No Active Trade Cycles</h3>
            <p className="text-base-content/60">
              {`You don't have any active trade cycles at the moment.`}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
