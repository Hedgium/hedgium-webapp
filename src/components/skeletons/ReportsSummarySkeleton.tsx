import React from "react";

const METRIC_CARD_KEYS = ["a", "b", "c", "d"] as const;
/** Slight width variation so placeholders feel less uniform */
const LABEL_WIDTHS = ["w-14", "w-16", "w-[4.25rem]", "w-12"] as const;
const VALUE_WIDTHS = ["w-[5.5rem]", "w-24", "w-20", "w-[4.75rem]"] as const;

export default function ReportsSummarySkeleton() {
  return (
    <section
      className="space-y-6 animate-pulse"
      aria-busy="true"
      aria-label="Loading summary"
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 shrink-0 rounded-md bg-base-300/70" aria-hidden />
          <div className="h-7 w-44 max-w-[70%] rounded-md bg-base-300/80 md:h-8" aria-hidden />
        </div>
        <div className="h-4 max-w-xl rounded-md bg-base-300/45" aria-hidden />
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10">
        {[0, 1].map((col) => (
          <div key={col}>
            <div className="mb-3 flex items-center gap-2">
              <div className="h-5 w-5 shrink-0 rounded-md bg-base-300/65" aria-hidden />
              <div
                className={`h-4 rounded-md bg-base-300/55 ${col === 0 ? "w-36" : "w-44"}`}
                aria-hidden
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {METRIC_CARD_KEYS.map((key, i) => (
                <div
                  key={key}
                  className="rounded-xl border border-base-300/50 bg-base-100/80 p-3"
                >
                  <div
                    className={`h-3 rounded ${LABEL_WIDTHS[i]} bg-base-300/50`}
                    aria-hidden
                  />
                  <div
                    className={`mt-3 h-5 rounded-md ${VALUE_WIDTHS[i]} bg-base-300/75`}
                    aria-hidden
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
