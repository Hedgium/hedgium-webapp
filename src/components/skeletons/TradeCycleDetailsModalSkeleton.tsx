import React from "react";

/**
 * Loading placeholder for TradeCycleDetailsModal (positions summary + table + unmapped block).
 */
export default function TradeCycleDetailsModalSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-hidden>
      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <div className="h-7 w-32 rounded-md bg-base-300" />
          <div className="h-9 w-9 rounded-full bg-base-200" />
        </div>
        <div className="mb-4 flex flex-wrap gap-2 md:gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-12 min-w-[5.5rem] flex-1 rounded-lg bg-base-200 sm:min-w-[6.5rem]"
            />
          ))}
        </div>
        <div className="overflow-hidden rounded-lg border border-base-300">
          <table className="table w-full text-sm">
            <thead>
              <tr className="border-b border-base-300/80 bg-base-200/40">
                {["Ins", "Qty", "Buy", "Sell", "Unr", "Rea", "PnL", "Ord", "Act"].map((label) => (
                  <th key={label} className="text-xs font-semibold uppercase text-base-content/40">
                    <div className="mx-auto h-3 w-8 rounded bg-base-300/80" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[0, 1, 2, 3].map((row) => (
                <tr key={row}>
                  <td colSpan={9} className="py-3">
                    <div className="flex items-center gap-3 px-2">
                      <div className="h-4 flex-1 max-w-[10rem] rounded bg-base-200" />
                      <div className="h-4 w-16 rounded bg-base-200" />
                      <div className="hidden h-4 w-14 rounded bg-base-200 sm:block" />
                      <div className="hidden h-4 w-14 rounded bg-base-200 sm:block" />
                      <div className="hidden h-4 w-12 rounded bg-base-200 md:block" />
                      <div className="hidden h-4 w-12 rounded bg-base-200 md:block" />
                      <div className="h-4 w-14 rounded bg-base-200" />
                      <div className="h-4 w-8 rounded bg-base-200" />
                      <div className="h-7 w-14 rounded bg-base-200" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="mb-3 h-6 w-44 rounded-md bg-base-300" />
        <div className="h-24 rounded-lg border border-base-300 bg-base-200/40" />
      </section>
    </div>
  );
}
