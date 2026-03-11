import React from "react";

export default function ReportsSummarySkeleton() {
  return (
    <section className="border-base-300 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[0, 1].map((col) => (
          <div key={col}>
            <div className="h-5 w-40 bg-base-300 rounded mb-3" />
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="p-3 bg-base-100 rounded-lg border border-base-300">
                  <div className="h-3 w-16 bg-base-300 rounded mb-2" />
                  <div className="h-4 w-20 bg-base-300 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
