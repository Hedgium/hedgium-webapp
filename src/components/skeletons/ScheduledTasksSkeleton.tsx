import React from "react";

interface ScheduledTasksSkeletonProps {
  count?: number;
}

export default function ScheduledTasksSkeleton({ count = 3 }: ScheduledTasksSkeletonProps) {
  return (
    <div className="overflow-x-auto animate-pulse">
      <table className="table w-full">
        <thead>
          <tr>
            <th>Task Name</th>
            <th>Schedule</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {[...Array(count)].map((_, i) => (
            <tr key={i}>
              <td>
                <div className="h-4 bg-base-300 rounded w-32 mb-2"></div>
                <div className="h-3 bg-base-300 rounded w-48"></div>
              </td>
              <td>
                <div className="h-6 bg-base-300 rounded-full w-24"></div>
              </td>
              <td className="text-right">
                <div className="h-8 bg-base-300 rounded w-20 ml-auto"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
