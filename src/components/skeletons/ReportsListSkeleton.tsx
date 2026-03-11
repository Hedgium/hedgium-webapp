import React from "react";

export default function ReportsListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 animate-pulse">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-base-100 rounded-xl border border-base-300 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="h-4 w-40 bg-base-300 rounded" />
              <div className="h-3 w-56 bg-base-300 rounded" />
            </div>
            <div className="h-5 w-24 bg-base-300 rounded" />
          </div>
          <div className="h-3 w-28 bg-base-300 rounded mt-3" />
        </div>
      ))}
    </div>
  );
}
