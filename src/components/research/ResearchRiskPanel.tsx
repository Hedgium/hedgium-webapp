"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ShieldAlert } from "lucide-react";
import type { RiskRule } from "@/types/research";

function riskLevelClass(level: string): string {
  const u = level.toUpperCase();
  if (u === "LOW") return "border-success/35 bg-success/10 text-success";
  if (u === "MEDIUM") return "border-warning/35 bg-warning/10 text-warning";
  if (u === "HIGH") return "border-error/30 bg-error/10 text-error";
  if (u === "CRITICAL") return "border-error bg-error/20 text-error font-bold";
  return "border-base-300/70 bg-base-200/50 text-base-content/80";
}

function severityClass(severity?: string): string {
  const u = (severity ?? "").toUpperCase();
  if (u === "HIGH" || u === "CRITICAL") return "text-error";
  if (u === "MEDIUM") return "text-warning";
  return "text-base-content/70";
}

type Props = {
  riskLevel: string;
  riskScore?: number | null;
  riskRules?: RiskRule[] | null;
};

export default function ResearchRiskPanel({
  riskLevel,
  riskScore,
  riskRules,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const rules = riskRules ?? [];

  return (
    <div className="rounded-2xl border border-base-300/60 bg-base-100/80 p-4 md:p-6 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-primary" aria-hidden />
          <h3 className="text-lg font-semibold">Risk assessment</h3>
        </div>
        <div className="flex items-center gap-2">
          {riskScore != null ? (
            <span className="text-sm tabular-nums text-base-content/60">
              Score {riskScore.toFixed(1)}
            </span>
          ) : null}
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase ${riskLevelClass(riskLevel)}`}
          >
            {riskLevel}
          </span>
        </div>
      </div>

      {rules.length > 0 ? (
        <div className="mt-4">
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-lg border border-base-300/50 bg-base-200/30 px-3 py-2 text-left text-sm font-medium hover:bg-base-200/50"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            <span>{rules.length} rule{rules.length !== 1 ? "s" : ""} triggered</span>
            {expanded ? (
              <ChevronUp className="h-4 w-4" aria-hidden />
            ) : (
              <ChevronDown className="h-4 w-4" aria-hidden />
            )}
          </button>

          {expanded ? (
            <ul className="mt-3 space-y-2">
              {rules.map((rule, i) => (
                <li
                  key={`${rule.code ?? "rule"}-${i}`}
                  className="rounded-lg border border-base-300/40 bg-base-200/20 px-3 py-2 text-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {rule.code ? (
                      <span className="font-mono text-xs text-base-content/50">
                        {rule.code}
                      </span>
                    ) : null}
                    {rule.severity ? (
                      <span className={`text-xs font-medium uppercase ${severityClass(rule.severity)}`}>
                        {rule.severity}
                      </span>
                    ) : null}
                  </div>
                  {rule.message ? (
                    <p className="mt-1 text-base-content/80">{rule.message}</p>
                  ) : null}
                  {rule.evidence ? (
                    <p className="mt-1 text-xs text-base-content/50">
                      {typeof rule.evidence === "string"
                        ? rule.evidence
                        : JSON.stringify(rule.evidence)}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
