"use client";

import type { ReactNode } from "react";

export function ReportsChartTooltipFrame({
  label,
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-xs text-base-content">
      {label ? <div className="mb-1.5 font-medium text-base-content">{label}</div> : null}
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export function ReportsChartTooltipRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "success" | "error" | "muted";
}) {
  const valueClass =
    tone === "success"
      ? "text-success"
      : tone === "error"
        ? "text-error"
        : tone === "muted"
          ? "text-base-content/70"
          : "text-base-content";
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-base-content/70">{label}</span>
      <span className={`font-medium tabular-nums ${valueClass}`}>{value}</span>
    </div>
  );
}

export const chartTooltipWrapperStyle = {
  background: "transparent",
  border: "none",
  outline: "none",
} as const;
