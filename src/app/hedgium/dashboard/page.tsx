'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Target } from 'lucide-react';
import TradeCycleCard from "@/components/TradeCycleCard";
import TradeCycleCardSkeleton from "@/components/skeletons/TradeCycleCardSkeleton";
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
    <div className="min-h-screen bg-base-200/40 px-4 py-4 md:px-8 md:py-6">
      <div className="max-w-7xl mx-auto space-y-5">
        <MarketHeader />

        {/* Header */}
        <section className="px-1 pb-1 ">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                <h1 className="text-xl md:text-2xl font-semibold text-base-content">Strategies</h1>
              </div>
              <p className="text-sm text-base-content/70 mt-1">Explore your currently active trade cycles</p>
            </div>
          </div>
        </section>

        {/* Strategy Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[...Array(4)].map((_, i) => (
              <TradeCycleCardSkeleton key={i} />
            ))}
          </div>
        ) : activeTradeCycles.length > 0 ? (
          <>
            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                  className="btn btn-outline btn-primary rounded-lg"
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
          <div className="text-center py-12 bg-base-100 rounded-xl border border-base-300">
            <h3 className="text-lg font-semibold mb-2 text-base-content">No Active Trade Cycles</h3>
            <p className="text-base-content/60">
              {`You don't have any active trade cycles at the moment.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
