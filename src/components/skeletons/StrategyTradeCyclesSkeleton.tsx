import React from "react";

interface StrategyTradeCyclesSkeletonProps {
  rows?: number;
}

export default function StrategyTradeCyclesSkeleton({
  rows = 3,
}: StrategyTradeCyclesSkeletonProps) {
  return (
    <div className="bg-base-100 rounded-xl border border-base-300 p-4 animate-pulse">
      <div className="h-5 bg-base-300 rounded w-40 mb-4" />
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              {[...Array(6)].map((_, idx) => (
                <th key={idx}>
                  <div className="h-4 bg-base-300 rounded w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(rows)].map((_, rowIdx) => (
              <tr key={rowIdx}>
                {[...Array(6)].map((_, colIdx) => (
                  <td key={colIdx}>
                    <div className="h-4 bg-base-300 rounded w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

