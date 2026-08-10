"use client";

import React, { useMemo } from "react";
import { Briefcase } from "lucide-react";
import type { AllocationSummary } from "@/types/reports";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type AllocationTile = {
  key: string;
  label: string;
  detail: string;
  value: number;
};

export interface AllocationSummarySectionProps {
  allocationSummary: AllocationSummary;
  /** Used for the all-time detail range when available */
  pnlInceptionDate?: string | null;
  accountCreatedAt?: string | null;
}

export default function AllocationSummarySection({
  allocationSummary,
  pnlInceptionDate = null,
  accountCreatedAt = null,
}: AllocationSummarySectionProps) {
  const allocationTiles = useMemo((): AllocationTile[] => {
    const allTimeDetail = pnlInceptionDate
      ? `(${formatDate(pnlInceptionDate)} → Till date)`
      : accountCreatedAt
        ? `(${formatDate(accountCreatedAt)} → Till date)`
        : "(Inception → Till date)";

    return [
      {
        key: "week",
        label: "Weekly (Current)",
        detail: `(${allocationSummary.week} · Mon–Sun)`,
        value: allocationSummary.week_count ?? 0,
      },
      {
        key: "month",
        label: "Monthly (Current)",
        detail: `(${allocationSummary.month})`,
        value: allocationSummary.month_count ?? 0,
      },
      {
        key: "quarter",
        label: "Quarterly (Current)",
        detail: `(${allocationSummary.quarter})`,
        value: allocationSummary.quarter_count ?? 0,
      },
      {
        key: "ytd",
        label: "YTD (Current)",
        detail: `(${allocationSummary.fy})`,
        value: allocationSummary.ytd_count ?? 0,
      },
      {
        key: "all_time",
        label: "All time",
        detail: allTimeDetail,
        value: allocationSummary.all_time ?? 0,
      },
    ];
  }, [allocationSummary, pnlInceptionDate, accountCreatedAt]);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 shrink-0 text-primary" aria-hidden />
          <h2 className="text-xl font-semibold tracking-tight text-base-content md:text-2xl">
            Allocated trade cycles
          </h2>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {allocationTiles.map((tile) => (
          <div
            key={tile.key}
            className="rounded-2xl border border-base-300/60 bg-base-200/35 p-4"
          >
            <dt className="mb-1 text-xs font-medium uppercase tracking-wider text-base-content">
              {tile.label}
            </dt>
            <dd className="m-0 text-lg font-bold tabular-nums leading-tight text-primary md:text-xl">
              {tile.value}
            </dd>
            <dd className="m-0 mt-1 text-[11px] leading-snug text-base-content/70">
              {tile.detail}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
