"use client";

import { CalendarClock } from "lucide-react";
import type { HoldingOutlook } from "@/types/research";

function stanceClass(stance: string): string {
  const lower = stance.toLowerCase();
  if (lower.includes("bullish")) return "text-success";
  if (lower.includes("bearish")) return "text-error";
  return "text-base-content";
}

type Props = {
  outlook: HoldingOutlook;
};

export default function ResearchOutlookCard({ outlook }: Props) {
  return (
    <div className="rounded-2xl border border-base-300/60 bg-base-100/80 p-4 md:p-6 backdrop-blur-sm">
      <div className="mb-3 flex items-center gap-2">
        <CalendarClock className="h-5 w-5 text-primary" aria-hidden />
        <h3 className="text-lg font-semibold">Holding outlook</h3>
      </div>
      <p className={`text-2xl font-bold ${stanceClass(outlook.stance)}`}>
        {outlook.stance}
      </p>
      <p className="mt-1 text-sm text-base-content/55">
        Horizon: {outlook.horizon_days} days
      </p>
    </div>
  );
}
