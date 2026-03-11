import React from "react";

export default function TradeCycleCardSkeleton() {
  return (
    <div className="card bg-base-100 border border-base-300 rounded-xl animate-pulse">
      <div className="card-body p-4 flex flex-col flex-1">
        {/* Header Skeleton */}
        <div className="flex justify-between items-start mb-4">
          <div className="h-6 bg-base-300 rounded w-40"></div>
          <div className="h-4 bg-base-300 rounded w-32"></div>
        </div>

        {/* Legs Section Skeleton */}
        <div className="h-32 bg-base-200 rounded-lg mb-4"></div>

        {/* Footer/Actions Skeleton */}
        <div className="flex-1"></div>
        <div className="flex justify-end mt-4">
          <div className="h-8 bg-base-300 rounded w-24"></div>
        </div>
      </div>
    </div>
  );
}

