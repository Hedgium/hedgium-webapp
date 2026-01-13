import React from "react";

export default function TradeCyclePositionsSkeleton() {
  return (
    <div className="card bg-base-100 border border-base-300 rounded-xl w-full shadow-sm animate-pulse">
      <div className="card-body p-4 flex flex-col flex-1">
        {/* Header Skeleton */}
        <div className="flex justify-between items-start mb-3 pb-3 border-b border-base-300">
          <div className="h-6 bg-base-300 rounded w-48"></div>
          <div className="h-4 bg-base-300 rounded w-32"></div>
        </div>

        {/* Totals Summary Skeleton */}
        <div className="h-12 bg-base-200 rounded-lg mb-3"></div>

        {/* Table Skeleton - Simple placeholder */}
        <div className="h-48 bg-base-200 rounded-lg"></div>

        {/* Footer Skeleton */}
        {/* <div className="flex items-center justify-between mt-3 pt-3 border-t border-base-300">
          <div className="h-8 bg-base-300 rounded w-24"></div>
          <div className="h-8 bg-base-300 rounded w-24"></div>
        </div> */}
      </div>
    </div>
  );
}

