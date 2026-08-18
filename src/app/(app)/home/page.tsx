'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Briefcase, Layers } from 'lucide-react';
import MarketHeader from '@/components/MarketHeader';
import PnlSummarySection from '@/components/reports/PnlSummarySection';
import AllocationSummarySection from '@/components/reports/AllocationSummarySection';
import ReportsSummarySkeleton from '@/components/skeletons/ReportsSummarySkeleton';
import TradeCycleCard from '@/components/TradeCycleCard';
import TradeCycleCardSkeleton from '@/components/skeletons/TradeCycleCardSkeleton';
import {
  fetchAccountCreatedAt,
  fetchAllocationSummary,
  fetchE2PnlSummary,
} from '@/services/reports';
import { fetchTradeCycles } from '@/services/tradeCycles';
import type { AllocationSummary, E2PnlSummary } from '@/types/reports';
import type { TradeCycleListItem } from '@/types/tradeCycles';

export default function HomePage() {
  const [pnlSummary, setPnlSummary] = useState<E2PnlSummary | null>(null);
  const [allocationSummary, setAllocationSummary] = useState<AllocationSummary | null>(null);
  const [accountCreatedAt, setAccountCreatedAt] = useState<string | null>(null);
  const [tradeCycles, setTradeCycles] = useState<TradeCycleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cyclesLoading, setCyclesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setCyclesLoading(true);
      const scope = { mode: "client" as const };

      const [summaryResult, cyclesResult] = await Promise.allSettled([
        Promise.all([
          fetchE2PnlSummary(scope),
          fetchAllocationSummary(scope),
          fetchAccountCreatedAt(scope),
        ]),
        fetchTradeCycles(),
      ]);

      if (cancelled) return;

      if (summaryResult.status === "fulfilled") {
        const [pnl, alloc, createdAt] = summaryResult.value;
        setPnlSummary(pnl);
        setAllocationSummary(alloc);
        setAccountCreatedAt(createdAt);
      } else {
        console.error("Error fetching home summaries:", summaryResult.reason);
        setPnlSummary(null);
        setAllocationSummary(null);
        setAccountCreatedAt(null);
      }

      if (cyclesResult.status === "fulfilled") {
        setTradeCycles(cyclesResult.value.results);
      } else {
        console.error("Error fetching home trade cycles:", cyclesResult.reason);
        setTradeCycles([]);
      }

      setLoading(false);
      setCyclesLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
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

      <div className="relative mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-8 md:py-8">
        <h1 className="sr-only">Home</h1>

        <MarketHeader />

        {loading ? (
          <ReportsSummarySkeleton />
        ) : pnlSummary || allocationSummary ? (
          <section className="space-y-8">
            {pnlSummary ? (
              <PnlSummarySection
                pnlSummary={pnlSummary}
                accountCreatedAt={accountCreatedAt}
              />
            ) : null}
            {allocationSummary ? (
              <AllocationSummarySection
                allocationSummary={allocationSummary}
                pnlInceptionDate={pnlSummary?.pnl_inception_date}
                accountCreatedAt={accountCreatedAt}
              />
            ) : null}
          </section>
        ) : (
          <div className="relative overflow-hidden rounded-2xl border border-dashed border-base-300/70 bg-base-100/40 px-6 py-16 text-center backdrop-blur-sm md:px-12">
            <div className="relative mx-auto max-w-md">
              <h3 className="text-lg font-semibold text-base-content">Summary unavailable</h3>
              <p className="mt-2 text-sm leading-relaxed text-base-content/70">
                We could not load your summary right now. Try again from Reports.
              </p>
            </div>
          </div>
        )}

        <section className="space-y-4" aria-labelledby="home-trade-cycles-heading">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" aria-hidden />
              <h2
                id="home-trade-cycles-heading"
                className="text-xl font-semibold tracking-tight text-base-content md:text-2xl"
              >
                Current month strategies
              </h2>
            </div>
            <p className="text-sm text-base-content/70">
              PnL, greeks, and spread for this month
              {!cyclesLoading && tradeCycles.length > 0 ? (
                <span>
                  {" "}
                  · {tradeCycles.length} cycle{tradeCycles.length === 1 ? "" : "s"}
                </span>
              ) : null}
            </p>
          </div>

          {cyclesLoading ? (
            <div className="grid grid-cols-1 gap-4">
              {[0, 1].map((i) => (
                <TradeCycleCardSkeleton key={i} />
              ))}
            </div>
          ) : tradeCycles.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {tradeCycles.map((cycle) => (
                <TradeCycleCard key={cycle.id} tradeCycle={cycle} isActive />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-base-300/70 bg-base-100/40 px-6 py-10 text-center backdrop-blur-sm">
              <h3 className="text-base font-semibold text-base-content">No trade cycles this month</h3>
              <p className="mt-1 text-sm text-base-content/70">
                When a cycle is assigned, it will show here with PnL, greeks, and spread.
              </p>
            </div>
          )}
        </section>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/reports"
            className="btn btn-outline btn-md gap-2 rounded-full border-base-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100"
          >
            View reports
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="/positions"
            className="btn btn-outline btn-md gap-2 rounded-full border-base-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100"
          >
            <Briefcase className="h-4 w-4" aria-hidden />
            View positions
          </Link>
        </div>
      </div>
    </div>
  );
}
