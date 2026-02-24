import React from "react";

interface StrategyAdjustmentsSkeletonProps {
  count?: number;
}

export default function StrategyAdjustmentsSkeleton({
  count = 2,
}: StrategyAdjustmentsSkeletonProps) {
  return (
    <div className="bg-base-100 rounded-xl border border-base-300 p-4 animate-pulse">
      <div className="h-5 bg-base-300 rounded w-40 mb-4" />
      <div className="space-y-3">
        {[...Array(count)].map((_, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between gap-4 border border-base-200 rounded-lg px-4 py-3"
          >
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-base-300 rounded w-32" />
              <div className="h-3 bg-base-300 rounded w-24" />
            </div>
            <div className="h-4 bg-base-300 rounded w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

