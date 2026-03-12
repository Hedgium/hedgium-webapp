import React from "react";

interface LeadsTableSkeletonProps {
  rows?: number;
}

export default function LeadsTableSkeleton({ rows = 8 }: LeadsTableSkeletonProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-base-300 animate-pulse">
      <table className="table table-zebra w-full">
        <thead>
          <tr>
            <th>Created</th>
            <th>Mobile</th>
            <th>Name</th>
            <th>Source</th>
            <th className="w-36 min-w-[140px]">Status</th>
            <th>Investment</th>
            <th>Scheduled at</th>
            <th className="min-w-[220px] max-w-[320px]">Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {[...Array(rows)].map((_, i) => (
            <tr key={i}>
              <td>
                <div className="h-4 bg-base-300 rounded w-28" />
              </td>
              <td>
                <div className="h-4 bg-base-300 rounded w-24" />
              </td>
              <td>
                <div className="h-4 bg-base-300 rounded w-28" />
              </td>
              <td>
                <div className="h-6 bg-base-300 rounded-full w-16" />
              </td>
              <td>
                <div className="h-8 bg-base-300 rounded w-full max-w-[120px]" />
              </td>
              <td>
                <div className="h-4 bg-base-300 rounded w-20" />
              </td>
              <td>
                <div className="h-4 bg-base-300 rounded w-32" />
              </td>
              <td>
                <div className="h-4 bg-base-300 rounded w-24" />
                <div className="h-3 bg-base-300 rounded w-16 mt-1" />
              </td>
              <td>
                <div className="h-8 bg-base-300 rounded w-20" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
