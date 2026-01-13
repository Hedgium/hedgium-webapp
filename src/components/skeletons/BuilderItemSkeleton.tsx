import React from "react";

interface BuilderItemSkeletonProps {
  count?: number;
}

export default function BuilderItemSkeleton({ count = 3 }: BuilderItemSkeletonProps) {
  return (
    <div className="space-y-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-base-100 rounded-lg p-4 mb-6 border border-base-300 animate-pulse">
          <div className="h-6 bg-base-300 rounded w-48 mb-4"></div>
          <div className="h-4 bg-base-300 rounded w-full mb-2"></div>
          <div className="h-4 bg-base-300 rounded w-3/4"></div>
        </div>
      ))}
    </div>
  );
}
