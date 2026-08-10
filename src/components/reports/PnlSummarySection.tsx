"use client";

import React, { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { formatMoneyIN } from "@/utils/formatNumber";
import type { E2PnlSummary } from "@/types/reports";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function signedClass(value: number): string {
  if (value > 0) return "text-success";
  if (value < 0) return "text-error";
  return "text-base-content/75";
}

function formatPnlPct(pct: number | null | undefined): string {
  if (pct == null || Number.isNaN(pct)) return "—";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

function formatPnlAmount(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return formatMoneyIN(value);
}

type PnlLine = {
  label: string;
  value: number | null;
  pct: number | null;
  emphasis?: boolean;
};

type E2PnlTile = {
  key: string;
  label: string;
  detail: string;
  lines: PnlLine[];
  highlight?: boolean;
};

export interface PnlSummarySectionProps {
  pnlSummary: E2PnlSummary;
  accountCreatedAt?: string | null;
}

export default function PnlSummarySection({
  pnlSummary,
  accountCreatedAt = null,
}: PnlSummarySectionProps) {
  const e2PnlTiles = useMemo((): E2PnlTile[] => {
    const showE1 = pnlSummary.e1_hedgium_managed !== false;
    const allTimeDetail = pnlSummary.pnl_inception_date
      ? `(${formatDate(pnlSummary.pnl_inception_date)} → Till date)`
      : accountCreatedAt
        ? `(${formatDate(accountCreatedAt)} → Till date)`
        : "(Inception → Till date)";

    const buildLines = (
      e2: number,
      e2Pct: number | null | undefined,
      e1: number | null | undefined,
      e1Pct: number | null | undefined,
      combined: number | null | undefined,
      combinedPct: number | null | undefined
    ): PnlLine[] => {
      const lines: PnlLine[] = [{ label: "E2", value: e2, pct: e2Pct ?? null }];
      if (showE1) {
        lines.push(
          { label: "E1", value: e1 ?? null, pct: e1Pct ?? null },
          {
            label: "Total",
            value: combined ?? null,
            pct: combinedPct ?? null,
            emphasis: true,
          }
        );
      }
      return lines;
    };

    return [
      {
        key: "week",
        label: "Weekly (Current)",
        detail: `(${pnlSummary.week} · Mon–Sun)`,
        lines: buildLines(
          pnlSummary.week_pnl ?? 0,
          pnlSummary.week_pnl_pct,
          pnlSummary.e1_week_pnl,
          pnlSummary.e1_week_pnl_pct,
          pnlSummary.combined_week_pnl,
          pnlSummary.combined_week_pnl_pct
        ),
      },
      {
        key: "month",
        label: "Monthly (Current)",
        detail: `(${pnlSummary.month})`,
        lines: buildLines(
          pnlSummary.pnl ?? 0,
          pnlSummary.pnl_pct,
          pnlSummary.e1_month_pnl,
          pnlSummary.e1_month_pnl_pct,
          pnlSummary.combined_month_pnl,
          pnlSummary.combined_month_pnl_pct
        ),
      },
      {
        key: "quarter",
        label: "Quarterly (Current)",
        detail: `(${pnlSummary.quarter})`,
        lines: buildLines(
          pnlSummary.quarter_pnl ?? 0,
          pnlSummary.quarter_pnl_pct,
          pnlSummary.e1_quarter_pnl,
          pnlSummary.e1_quarter_pnl_pct,
          pnlSummary.combined_quarter_pnl,
          pnlSummary.combined_quarter_pnl_pct
        ),
      },
      {
        key: "ytd",
        label: "YTD (Current)",
        detail: `(${pnlSummary.fy})`,
        lines: buildLines(
          pnlSummary.ytd_pnl ?? 0,
          pnlSummary.ytd_pnl_pct,
          pnlSummary.e1_ytd_pnl,
          pnlSummary.e1_ytd_pnl_pct,
          pnlSummary.combined_ytd_pnl,
          pnlSummary.combined_ytd_pnl_pct
        ),
        highlight: true,
      },
      {
        key: "all_time",
        label: "All time",
        detail: allTimeDetail,
        lines: buildLines(
          pnlSummary.all_time_pnl ?? 0,
          pnlSummary.all_time_pnl_pct,
          pnlSummary.e1_all_time_pnl,
          pnlSummary.e1_all_time_pnl_pct,
          pnlSummary.combined_all_time_pnl,
          pnlSummary.combined_all_time_pnl_pct
        ),
      },
    ];
  }, [pnlSummary, accountCreatedAt]);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 shrink-0 text-primary" aria-hidden />
          <h2 className="text-xl font-semibold tracking-tight text-base-content md:text-2xl">
            PnL
          </h2>
        </div>
        <p className="max-w-2xl text-sm text-base-content/70">
          {pnlSummary.e1_hedgium_managed !== false
            ? "E2 strategy, E1 CNC, and combined PnL for the current week (Mon–Sun), month, quarter, financial year, and all time."
            : "Engine 2 strategy PnL for the current week (Mon–Sun), month, quarter, financial year, and all time."}
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {e2PnlTiles.map((tile) => (
          <div
            key={tile.key}
            className={
              tile.highlight
                ? "relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-base-100/80 p-4"
                : "rounded-2xl border border-base-300/60 bg-base-200/35 p-4"
            }
          >
            <dt className="mb-2 text-xs font-medium uppercase tracking-wider text-base-content">
              {tile.label}
            </dt>
            <dd className="m-0 space-y-1.5">
              {tile.lines.map((line) => (
                <div
                  key={line.label}
                  className={`flex items-baseline justify-between gap-2 ${
                    line.emphasis ? "border-t border-base-300/50 pt-1.5" : ""
                  }`}
                >
                  <span
                    className={`shrink-0 text-[11px] font-medium uppercase tracking-wide ${
                      line.emphasis ? "text-base-content/80" : "text-base-content/55"
                    }`}
                  >
                    {line.label}
                  </span>
                  <div className="min-w-0 text-right">
                    <div
                      className={`tabular-nums leading-tight ${
                        line.emphasis ? "text-base font-bold md:text-lg" : "text-sm font-semibold"
                      } ${
                        line.value == null ? "text-base-content/45" : signedClass(line.value)
                      }`}
                    >
                      {formatPnlAmount(line.value)}
                    </div>
                    <div
                      className={`text-[11px] font-semibold tabular-nums ${
                        line.pct == null ? "text-base-content/45" : signedClass(line.pct)
                      }`}
                    >
                      {formatPnlPct(line.pct)}
                    </div>
                  </div>
                </div>
              ))}
            </dd>
            <dd className="m-0 mt-2 text-[11px] leading-snug text-base-content/70">
              {tile.detail}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
