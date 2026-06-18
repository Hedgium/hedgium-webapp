"use client";

import { Newspaper } from "lucide-react";
import type { NewsSummary } from "@/types/research";

type Props = {
  summary: NewsSummary;
};

const ITEMS = [
  { key: "positive" as const, label: "Positive", className: "text-success" },
  { key: "neutral" as const, label: "Neutral", className: "text-base-content/70" },
  { key: "negative" as const, label: "Negative", className: "text-error" },
];

export default function ResearchNewsSummary({ summary }: Props) {
  const total = summary.positive + summary.neutral + summary.negative;

  return (
    <div className="rounded-2xl border border-base-300/60 bg-base-100/80 p-4 md:p-6 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <Newspaper className="h-5 w-5 text-primary" aria-hidden />
        <h3 className="text-lg font-semibold">News sentiment (30d)</h3>
      </div>

      {total === 0 ? (
        <p className="text-sm text-base-content/55">No news articles in the last 30 days.</p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {ITEMS.map(({ key, label, className }) => (
            <div
              key={key}
              className="rounded-xl border border-base-300/50 bg-base-200/30 p-3 text-center"
            >
              <p className={`text-2xl font-bold tabular-nums ${className}`}>
                {summary[key]}
              </p>
              <p className="mt-0.5 text-xs text-base-content/55">{label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
