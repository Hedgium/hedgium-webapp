"use client";

import type { ResearchReport } from "@/types/research";

function formatGeneratedAt(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function statusChipClass(status: string): string {
  if (status === "prediction_available") {
    return "border-success/35 bg-success/10 text-success";
  }
  if (status === "stub" || status === "partial") {
    return "border-warning/35 bg-warning/10 text-warning";
  }
  return "border-base-300/70 bg-base-200/50 text-base-content/80";
}

type Props = {
  report: ResearchReport;
};

export default function ResearchReportHeader({ report }: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-base-content md:text-3xl">
            {report.company_name}
          </h1>
          <span className="rounded-full border border-base-300/60 bg-base-200/50 px-2.5 py-0.5 font-mono text-sm font-medium text-primary">
            {report.symbol}
          </span>
        </div>
        <p className="text-sm text-base-content/55">
          Generated {formatGeneratedAt(report.generated_at)}
          {report.model_version ? (
            <span className="ml-2 text-base-content/45">· {report.model_version}</span>
          ) : null}
        </p>
      </div>
      <span
        className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide ${statusChipClass(report.status)}`}
      >
        {report.status.replace(/_/g, " ")}
      </span>
    </div>
  );
}
