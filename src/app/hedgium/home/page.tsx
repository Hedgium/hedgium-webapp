'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Loader2, ArrowRight, LayoutGrid, Sparkles } from 'lucide-react';
import TradeCycleCard from "@/components/TradeCycleCard";
import TradeCycleCardSkeleton from "@/components/skeletons/TradeCycleCardSkeleton";
import MarketHeader from '@/components/MarketHeader';
import { authFetch } from '@/utils/api';
import { useAuthStore } from '@/store/authStore';

export default function HomePage() {
  const user = useAuthStore((s) => s.user);
  const [activeTradeCycles, setActiveTradeCycles] = useState([]);
  const [nextActiveTradeCycles, setNextActiveTradeCycles] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const displayName = useMemo(() => {
    const full = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim();
    if (full) return full.split(' ')[0] ?? full;
    if (user?.username) return user.username;
    return null;
  }, [user]);

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
    <div className="relative min-h-screen">
      {/* Ambient depth — theme-aware, no extra assets */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        aria-hidden
      >
        <div className="absolute inset-0 bg-gradient-to-b from-base-200 via-base-200 to-base-300/80" />
        <div className="absolute -top-24 right-[-10%] h-[28rem] w-[28rem] rounded-full bg-primary/12 blur-3xl" />
        <div className="absolute top-1/3 -left-32 h-[22rem] w-[22rem] rounded-full bg-secondary/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/3 h-48 w-48 rounded-full bg-accent/10 blur-2xl opacity-70" />
        <div
          className="absolute inset-0 opacity-[0.35] bg-[linear-gradient(to_right,oklch(var(--bc)/0.04)_1px,transparent_1px),linear-gradient(to_bottom,oklch(var(--bc)/0.04)_1px,transparent_1px)] bg-[size:32px_32px]"
          style={{
            maskImage: 'linear-gradient(to bottom, black 0%, transparent 85%)',
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-8">
        {/* Hero */}


        {/* Market */}
          <MarketHeader />

        <br />

        {/* Strategies */}
        <section className="space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-5 w-5 text-primary" aria-hidden />
                <h2 className="text-xl font-semibold tracking-tight text-base-content md:text-2xl">
                  Active strategies
                </h2>
              </div>
              <p className="text-sm text-base-content/55">
                Approved trade cycles you can monitor or act on
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <TradeCycleCardSkeleton key={i} />
              ))}
            </div>
          ) : activeTradeCycles.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {activeTradeCycles.map((tc) => (
                  <TradeCycleCard key={tc?.id} tradeCycle={tc} isActive={true} />
                ))}
              </div>

              {nextActiveTradeCycles && (
                <div className="flex justify-center pt-4">
                  <button
                    type="button"
                    onClick={loadMoreTradeCycles}
                    disabled={loadingMore}
                    className="btn btn-primary btn-md rounded-full px-10 shadow-lg shadow-primary/20"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        Loading
                      </>
                    ) : (
                      'Load more strategies'
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="relative overflow-hidden rounded-2xl border border-dashed border-base-300/70 bg-base-100/40 px-6 py-16 text-center backdrop-blur-sm md:px-12">
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/5 blur-2xl" aria-hidden />
              <div className="relative mx-auto max-w-md">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-base-300/60 bg-base-200/50 shadow-inner">
                  <LayoutGrid className="h-7 w-7 text-primary/80" aria-hidden />
                </div>
                <h3 className="text-lg font-semibold text-base-content">No active strategies yet</h3>
                <p className="mt-2 text-sm leading-relaxed text-base-content/60">
                  When your trade cycles are approved and running, they will appear here with live status and quick actions.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
