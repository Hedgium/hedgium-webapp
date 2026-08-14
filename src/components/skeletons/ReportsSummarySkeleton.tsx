import React from "react";

const PNL_TILE_KEYS = ["a", "b", "c", "d"] as const;
const ALLOC_TILE_KEYS = ["a", "b", "c", "d", "e"] as const;

export default function ReportsSummarySkeleton() {
  return (
    <section
      className="space-y-8 animate-pulse"
      aria-busy="true"
      aria-label="Loading summary"
    >
      <div className="space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 shrink-0 rounded-md bg-base-300/70" aria-hidden />
            <div className="h-7 w-28 max-w-[50%] rounded-md bg-base-300/80 md:h-8" aria-hidden />
          </div>
          <div className="h-4 max-w-xl rounded-md bg-base-300/45" aria-hidden />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {PNL_TILE_KEYS.map((key) => (
            <div
              key={key}
              className="rounded-2xl border border-base-300/60 bg-base-200/35 p-4"
            >
              <div className="h-3 w-16 rounded bg-base-300/50" aria-hidden />
              <div className="mt-3 space-y-2">
                <div className="flex justify-between gap-2">
                  <div className="h-3 w-6 rounded bg-base-300/40" aria-hidden />
                  <div className="h-4 w-16 rounded bg-base-300/70" aria-hidden />
                </div>
                <div className="flex justify-between gap-2">
                  <div className="h-3 w-6 rounded bg-base-300/40" aria-hidden />
                  <div className="h-4 w-14 rounded bg-base-300/65" aria-hidden />
                </div>
                <div className="flex justify-between gap-2 border-t border-base-300/40 pt-2">
                  <div className="h-3 w-8 rounded bg-base-300/40" aria-hidden />
                  <div className="h-5 w-20 rounded bg-base-300/75" aria-hidden />
                </div>
              </div>
              <div className="mt-2 h-3 w-20 rounded bg-base-300/40" aria-hidden />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 shrink-0 rounded-md bg-base-300/65" aria-hidden />
            <div className="h-7 w-56 max-w-[70%] rounded-md bg-base-300/80 md:h-8" aria-hidden />
          </div>
          <div className="h-4 max-w-xl rounded-md bg-base-300/45" aria-hidden />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {ALLOC_TILE_KEYS.map((key) => (
            <div
              key={`alloc-${key}`}
              className="rounded-2xl border border-base-300/60 bg-base-200/35 p-4"
            >
              <div className="h-3 w-16 rounded bg-base-300/50" aria-hidden />
              <div className="mt-3 h-6 w-10 rounded-md bg-base-300/75" aria-hidden />
              <div className="mt-2 h-3 w-20 rounded bg-base-300/40" aria-hidden />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
