import React from "react";

/**
 * Loading placeholder for TradeCycleDetailsModal (tabs + live positions panel).
 */
export default function TradeCycleDetailsModalSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      <div className="flex w-full gap-1 rounded-xl border border-base-300/70 bg-base-200/50 p-0.5 sm:p-1">
        {[0, 1, 2].map((tab) => (
          <div
            key={tab}
            className={`flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-2 py-1.5 ${
              tab === 0 ? "bg-base-100 ring-1 ring-base-300/60" : ""
            }`}
          >
            <div className="size-5 shrink-0 rounded bg-base-300/80" />
            <div className="h-4 w-20 rounded bg-base-300/80 sm:w-28" />
            <div className="h-5 w-8 rounded-full bg-base-300/60" />
          </div>
        ))}
      </div>

      <section>
        <div className="mb-3 flex items-center justify-end gap-2">
          <div className="h-6 w-20 rounded-full bg-base-200" />
          <div className="h-8 w-20 rounded-lg bg-base-200" />
          <div className="h-9 w-9 rounded-lg bg-base-200" />
        </div>

        <div className="overflow-hidden rounded-lg border border-base-300">
          <table className="table w-full text-sm">
            <thead>
              <tr className="border-b border-base-300/80 bg-base-200/40">
                {["Ins", "Strike", "Qty", "Buy", "Sell", "LTP", "Unr", "Rea", "PnL", "Greeks", "Act"].map(
                  (label) => (
                    <th key={label} className="text-xs font-semibold uppercase text-base-content/40">
                      <div className="mx-auto h-3 w-8 rounded bg-base-300/80" />
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {[0, 1, 2, 3, 4].map((row) => (
                <tr key={row} className="border-b border-base-300/40">
                  <td colSpan={11} className="py-3">
                    <div className="flex items-center gap-3 px-2">
                      <div className="h-4 max-w-[10rem] flex-1 rounded bg-base-200" />
                      <div className="h-4 w-12 rounded bg-base-200" />
                      <div className="h-4 w-16 rounded bg-base-200" />
                      <div className="hidden h-4 w-14 rounded bg-base-200 sm:block" />
                      <div className="hidden h-4 w-14 rounded bg-base-200 sm:block" />
                      <div className="hidden h-4 w-12 rounded bg-base-200 md:block" />
                      <div className="hidden h-4 w-12 rounded bg-base-200 md:block" />
                      <div className="h-4 w-14 rounded bg-base-200" />
                      <div className="hidden h-4 w-16 rounded bg-base-200 lg:block" />
                      <div className="h-7 w-20 rounded bg-base-200" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
