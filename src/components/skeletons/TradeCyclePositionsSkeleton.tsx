import React from "react";

export default function TradeCyclePositionsSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-base-300/70 bg-base-100/90 shadow-sm animate-pulse">
      <div className="flex flex-col p-5 md:p-6">
        <div className="mb-4 flex flex-col gap-3 border-b border-base-300/50 pb-4 sm:flex-row sm:justify-between">
          <div className="flex-1 space-y-2">
            <div className="h-6 w-48 max-w-full rounded-lg bg-base-300/90" />
            <div className="h-6 w-28 rounded-full bg-base-300/60" />
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <div className="h-3 w-14 rounded bg-base-300/60" />
            <div className="h-3 w-20 rounded bg-base-300/50" />
          </div>
        </div>

        <div className="mb-4 h-16 rounded-xl border border-base-300/40 bg-base-200/50" />

        <div className="h-40 rounded-xl border border-base-300/40 bg-base-200/40" />
      </div>
    </div>
  );
}
