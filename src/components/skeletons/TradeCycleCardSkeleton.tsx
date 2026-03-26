import React from "react";

export default function TradeCycleCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-base-300/70 bg-base-100/90 shadow-sm animate-pulse">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
      <div className="flex flex-col p-5 md:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <div className="flex-1 space-y-2">
            <div className="h-6 w-3/4 max-w-[240px] rounded-lg bg-base-300/90" />
            <div className="h-4 w-full max-w-[320px] rounded-md bg-base-300/60" />
            <div className="flex gap-2 pt-1">
              <div className="h-6 w-24 rounded-full bg-base-300/70" />
              <div className="h-6 w-20 rounded-full bg-base-300/50" />
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1 sm:pt-0.5">
            <div className="h-3 w-14 rounded bg-base-300/60" />
            <div className="h-3 w-20 rounded bg-base-300/50" />
          </div>
        </div>

        <div className="mb-2 h-3 w-16 rounded bg-base-300/50" />

        <div className="space-y-2">
          <div className="h-14 rounded-xl border border-base-300/40 bg-base-200/50" />
          <div className="h-14 rounded-xl border border-base-300/40 bg-base-200/50" />
          <div className="h-14 rounded-xl border border-base-300/40 bg-base-200/40" />
        </div>

        <div className="mt-5 flex justify-end border-t border-base-300/40 pt-4">
          <div className="h-9 w-36 rounded-full bg-base-300/70" />
        </div>
      </div>
    </div>
  );
}
