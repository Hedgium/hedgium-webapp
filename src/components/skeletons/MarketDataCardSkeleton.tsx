import React from "react";

export default function MarketDataCardSkeleton() {
  return (
    <div className="flex-1 min-w-[200px] snap-center">
      <div className="bg-base-100 p-4 border border-base-300 rounded-xl animate-pulse">
        <div className="h-5 bg-base-300 rounded w-24 mb-3"></div>
        <div className="flex items-center justify-between">
          <div className="h-7 bg-base-300 rounded w-20"></div>
          <div className="h-6 bg-base-300 rounded w-32"></div>
        </div>
      </div>
    </div>
  );
}

