"use client";

import { Info } from "lucide-react";
import { formatMoneyIN } from "@/utils/formatNumber";

export function e2NetPnl(
  gross: number | null | undefined,
  charges: number | null | undefined
): number | null {
  if (gross == null || Number.isNaN(gross)) return null;
  const c = charges != null && !Number.isNaN(charges) ? charges : 0;
  return gross - c;
}

function signedClass(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "text-base-content/60";
  if (value > 0) return "text-success";
  if (value < 0) return "text-error";
  return "text-base-content/75";
}

function formatAmount(value: number | null | undefined, compact?: boolean): string {
  if (value == null || Number.isNaN(value)) return "—";
  if (compact) return formatMoneyIN(value, { decimals: 0, minDecimals: 0 });
  return formatMoneyIN(value);
}

export default function NetPnlWithCosts({
  gross,
  charges,
  compact,
  className,
  dropdownLeft,
}: {
  gross: number | null | undefined;
  charges: number | null | undefined;
  compact?: boolean;
  className?: string;
  dropdownLeft?: boolean;
}) {
  const net = e2NetPnl(gross, charges);
  const hasBreakdown = gross != null && !Number.isNaN(gross);
  const chargesValue = charges != null && !Number.isNaN(charges) ? charges : 0;

  return (
    <span
      className={`inline-flex items-center justify-end gap-0.5 tabular-nums ${signedClass(net)} ${className ?? ""}`}
    >
      {formatAmount(net, compact)}
      {hasBreakdown ? (
        <div
          className={`dropdown dropdown-hover dropdown-start ${dropdownLeft ? "dropdown-left" : "dropdown-right"}`}
        >
          <button
            type="button"
            tabIndex={0}
            className="inline-flex cursor-pointer text-base-content/45 hover:text-base-content/70"
            aria-label="PnL breakdown: gross and other costs"
          >
            <Info className="h-3 w-3" strokeWidth={2.5} aria-hidden />
          </button>
          <div
            tabIndex={0}
            className="dropdown-content z-50 w-44 rounded-lg border border-base-300 bg-base-100 p-2 text-left text-xs font-normal text-base-content"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-base-content/55">Gross</span>
              <span className={`tabular-nums ${signedClass(gross)}`}>{formatAmount(gross)}</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-3">
              <span className="text-base-content/55">Other costs</span>
              <span className="tabular-nums text-base-content/80">{formatAmount(chargesValue)}</span>
            </div>
          </div>
        </div>
      ) : null}
    </span>
  );
}
