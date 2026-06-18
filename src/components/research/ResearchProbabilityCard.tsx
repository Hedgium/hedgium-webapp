"use client";

import type { Probabilities } from "@/types/research";

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

type Props = {
  probabilities: Probabilities;
  confidenceScore: number;
};

const ROWS = [
  { key: "bullish" as const, label: "Bullish", barClass: "bg-success" },
  { key: "bearish" as const, label: "Bearish", barClass: "bg-error" },
  { key: "sideways" as const, label: "Sideways", barClass: "bg-warning" },
];

export default function ResearchProbabilityCard({
  probabilities,
  confidenceScore,
}: Props) {
  return (
    <div className="rounded-2xl border border-base-300/60 bg-base-100/80 p-4 md:p-6 backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">30-day outlook</h3>
        <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-semibold tabular-nums text-primary">
          {(confidenceScore * 100).toFixed(0)}% confidence
        </span>
      </div>

      <div className="space-y-4">
        {ROWS.map(({ key, label, barClass }) => {
          const value = probabilities[key];
          return (
            <div key={key}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-base-content/80">{label}</span>
                <span className="tabular-nums font-semibold">{pct(value)}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-base-300/50">
                <div
                  className={`h-full rounded-full transition-all ${barClass}`}
                  style={{ width: `${Math.min(100, value * 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
