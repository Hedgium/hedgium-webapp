"use client";

import { FileText } from "lucide-react";

type Props = {
  symbols: string[];
  onOpen: (symbols: string[]) => void;
};

/** Research-report control shown under a strategy name when reports exist. */
export default function ResearchReportNameAffordance({ symbols, onOpen }: Props) {
  if (symbols.length === 0) return null;

  const label =
    symbols.length === 1
      ? `View research report for ${symbols[0]}`
      : `View research reports (${symbols.join(", ")})`;

  return (
    <button
      type="button"
      className="btn btn-ghost btn-xs h-auto min-h-0 px-1 py-0.5 gap-1 text-primary font-normal normal-case"
      title={label}
      aria-label={label}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onOpen(symbols);
      }}
    >
      <FileText className="size-3 shrink-0" />
      <span className="text-[11px] leading-tight break-words whitespace-normal text-left">
        {symbols.join(", ")}
      </span>
    </button>
  );
}
