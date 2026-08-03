"use client";

import { FileText } from "lucide-react";

type Props = {
  symbols: string[];
  onOpen: (symbols: string[]) => void;
};

/** Icon button shown next to a strategy name when research reports exist. */
export default function ResearchReportNameAffordance({ symbols, onOpen }: Props) {
  if (symbols.length === 0) return null;

  const label =
    symbols.length === 1
      ? `View research report for ${symbols[0]}`
      : `View research reports (${symbols.join(", ")})`;

  return (
    <button
      type="button"
      className="btn btn-ghost btn-xs btn-square text-primary shrink-0"
      title={label}
      aria-label={label}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onOpen(symbols);
      }}
    >
      <FileText className="size-3.5" />
    </button>
  );
}
