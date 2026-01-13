import React from "react";

interface RunningTasksSkeletonProps {
  count?: number;
}

export default function RunningTasksSkeleton({ count = 3 }: RunningTasksSkeletonProps) {
  return (
    <div className="overflow-x-auto animate-pulse">
      <table className="table w-full">
        <thead>
          <tr>
            <th>Task</th>
            <th>Status</th>
            <th>Queue</th>
            <th>Started</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {[...Array(count)].map((_, i) => (
            <tr key={i}>
              <td>
                <div className="h-4 bg-base-300 rounded w-32 mb-2"></div>
                <div className="h-3 bg-base-300 rounded w-24"></div>
              </td>
              <td>
                <div className="h-6 bg-base-300 rounded-full w-20"></div>
              </td>
              <td>
                <div className="h-4 bg-base-300 rounded w-16"></div>
              </td>
              <td>
                <div className="h-4 bg-base-300 rounded w-32"></div>
              </td>
              <td className="text-right">
                <div className="h-8 bg-base-300 rounded w-16 ml-auto"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
