"use client";

import { Info } from "lucide-react";
import { formatMoneyIN } from "@/utils/formatNumber";
import { netPnl, netPnlTip } from "@/utils/pnlNet";

function signedClass(value: number | null): string {
  if (value == null) return "text-base-content/45";
  if (value > 0) return "text-success";
  if (value < 0) return "text-error";
  return "text-base-content/75";
}

type NetPnlAmountProps = {
  gross: number | null | undefined;
  charges?: number | null;
  className?: string;
  tooltipClassName?: string;
};

export default function NetPnlAmount({
  gross,
  charges,
  className,
  tooltipClassName = "tooltip-left",
}: NetPnlAmountProps) {
  const net = netPnl(gross, charges);
  const tip = netPnlTip(gross, charges);
  const hasBreakdown = gross != null && !Number.isNaN(Number(gross));

  return (
    <span className={`inline-flex items-center gap-1 ${className ?? ""} ${signedClass(net)}`}>
      <span className="tabular-nums">{net == null ? "—" : formatMoneyIN(net)}</span>
      {hasBreakdown ? (
        <span
          className={`tooltip z-30 cursor-help inline-flex text-base-content/45 hover:text-base-content/70 before:z-30 before:max-w-[14rem] before:text-left before:whitespace-normal before:px-3 before:py-2 before:normal-case before:tracking-normal after:z-30 ${tooltipClassName}`}
          data-tip={tip}
          aria-label={tip}
        >
          <Info className="h-3 w-3" strokeWidth={2.5} aria-hidden />
        </span>
      ) : null}
    </span>
  );
}
