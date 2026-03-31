"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LayoutGrid } from "lucide-react";
import TradeCycleCard from "@/components/TradeCycleCard";
import TradeCycleCardSkeleton from "@/components/skeletons/TradeCycleCardSkeleton";
import MarketHeader from "@/components/MarketHeader";
import SandboxPageShell from "@/components/sandbox/SandboxPageShell";
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

export default function SandboxHomePage() {
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
    <SandboxPageShell>
      <div className="space-y-8">
        <MarketHeader />

        <section className="space-y-6 py-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-primary" aria-hidden />
              <h2 className="text-xl font-semibold tracking-tight text-base-content md:text-2xl">
                Active strategies
              </h2>
            </div>
            <p className="text-sm text-base-content/55">
              Sample master trade cycles from other users on the{" "}
              <span className="font-medium text-base-content/75">{sandboxPlan}</span> plan
            </p>
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
                <div className="flex justify-center pt-2">
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
                      "Load more strategies"
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="relative overflow-hidden rounded-2xl border border-dashed border-base-300/70 bg-base-100/40 px-6 py-16 text-center backdrop-blur-sm md:px-12">
              <div
                className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/5 blur-2xl"
                aria-hidden
              />
              <div className="relative mx-auto max-w-md">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-base-300/60 bg-base-200/50 shadow-inner">
                  <LayoutGrid className="h-7 w-7 text-primary/80" aria-hidden />
                </div>
                <h3 className="text-lg font-semibold text-base-content">No strategies for this plan</h3>
                <p className="mt-2 text-sm leading-relaxed text-base-content/60">
                  Try another plan from Settings, or check back later when more sample data is available.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </SandboxPageShell>
  );
}
