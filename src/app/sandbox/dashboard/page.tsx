"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Target } from "lucide-react";
import TradeCycleCard from "@/components/TradeCycleCard";
import TradeCycleCardSkeleton from "@/components/skeletons/TradeCycleCardSkeleton";
import MarketHeader from "@/components/MarketHeader";
import { useSandboxStore } from "@/store/sandboxStore";
import { sandboxFetch } from "@/utils/sandboxApi";

type SandboxTradeCycle = {
  id: number;
  name: string;
  description: string;
  state: string;
  sub_state: string;
  created_at: string;
  adjustments?: unknown[];
};

export default function SandboxDashboard() {
  const router = useRouter();
  const { sandboxPlan } = useSandboxStore();
  const [activeTradeCycles, setActiveTradeCycles] = useState<SandboxTradeCycle[]>([]);
  const [nextActiveTradeCycles, setNextActiveTradeCycles] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!sandboxPlan) {
      router.replace("/sandbox");
      return;
    }
  }, [sandboxPlan, router]);

  const getActiveTradeCycles = useCallback(async () => {
    if (!sandboxPlan) return;
    setLoading(true);
    try {
      const res = await sandboxFetch(
        "trade-cycles/?approved=true&page=1&page_size=10",
        sandboxPlan
      );
      if (res.ok) {
        const data = await res.json();
        setActiveTradeCycles(data.results || []);
        setNextActiveTradeCycles(data.next);
      } else {
        setActiveTradeCycles([]);
      }
    } catch {
      setActiveTradeCycles([]);
    } finally {
      setLoading(false);
    }
  }, [sandboxPlan]);

  async function loadMoreTradeCycles() {
    if (!nextActiveTradeCycles || !sandboxPlan) return;
    setLoadingMore(true);
    try {
      const url = new URL(nextActiveTradeCycles);
      const path = url.pathname.replace("/api/", "") + url.search;
      const res = await sandboxFetch(path, sandboxPlan);
      if (res.ok) {
        const data = await res.json();
        setActiveTradeCycles((prev) => [...prev, ...(data.results || [])]);
        setNextActiveTradeCycles(data.next);
      }
    } catch (error) {
      console.error("Error loading more:", error);
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    getActiveTradeCycles();
  }, [getActiveTradeCycles]);

  if (!sandboxPlan) return null;

  return (
    <div className="min-h-screen bg-base-200/40 px-4 py-4 md:px-8 md:py-6">
      <div className="max-w-7xl mx-auto space-y-5">
        <MarketHeader />

        <section className="px-1 pb-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                <h1 className="text-xl md:text-2xl font-semibold text-base-content">
                  Strategies
                </h1>
              </div>
              <p className="text-sm text-base-content/70 mt-1">
                Real trade cycles from other users on {sandboxPlan} plan
              </p>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[...Array(4)].map((_, i) => (
              <TradeCycleCardSkeleton key={i} />
            ))}
          </div>
        ) : activeTradeCycles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {activeTradeCycles.map((tc) => (
                <TradeCycleCard
                  key={tc.id}
                  tradeCycle={{
                    id: tc.id,
                    name: tc.name,
                    description: tc.description ?? "",
                    state: tc.state,
                    sub_state: tc.sub_state,
                    created_at: tc.created_at,
                    adjustments: Array.isArray(tc.adjustments) ? tc.adjustments : [],
                  }}
                  isActive={true}
                  isSandbox
                />
              ))}
            </div>
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
                    "Load More"
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 bg-base-100 rounded-xl border border-base-300">
            <h3 className="text-lg font-semibold mb-2 text-base-content">
              No Trade Cycles
            </h3>
            <p className="text-base-content/60">
              No data available for this plan yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
