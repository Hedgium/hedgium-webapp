import React from "react";

interface ProfileItemSkeletonProps {
  count?: number;
}

export default function ProfileItemSkeleton({ count = 3 }: ProfileItemSkeletonProps) {
  return (
    <div className="space-y-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-base-100 rounded-lg p-4 mb-4 border border-base-300 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <div className="h-4 bg-base-300 rounded w-16 mb-2"></div>
              <div className="h-5 bg-base-300 rounded w-40 mb-2"></div>
              <div className="h-3 bg-base-300 rounded w-32 mb-1"></div>
              <div className="h-3 bg-base-300 rounded w-24"></div>
            </div>
            <div>
              <div className="h-4 bg-base-300 rounded w-20 mb-2"></div>
              <div className="h-5 bg-base-300 rounded w-32 mb-2"></div>
              <div className="h-3 bg-base-300 rounded w-48"></div>
            </div>
            <div>
              <div className="h-4 bg-base-300 rounded w-24 mb-2"></div>
              <div className="h-5 bg-base-300 rounded w-28 mb-2"></div>
              <div className="h-3 bg-base-300 rounded w-36"></div>
            </div>
            <div>
              <div className="h-4 bg-base-300 rounded w-20 mb-2"></div>
              <div className="h-5 bg-base-300 rounded w-32"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
