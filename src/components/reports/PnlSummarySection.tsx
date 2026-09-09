"use client";

import React, { useMemo } from "react";
import { Info, TrendingUp } from "lucide-react";
import { formatMoneyIN } from "@/utils/formatNumber";
import type { E2PnlSummary } from "@/types/reports";
import NetPnlWithCosts, { e2NetPnl } from "@/components/reports/NetPnlWithCosts";

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

function e1InfoTip(
  selfManaged: boolean,
  realised: number | null,
  mtm: number | null
): string {
  const parts: string[] = [];
  if (selfManaged) parts.push("Self-managed.");
  if (mtm != null) parts.push(`MTM: ₹${formatPnlAmount(mtm)}`);
  if (realised != null) parts.push(`Realised: ₹${formatPnlAmount(realised)}`);
  return parts.join(" ");
}

function netScaledPct(
  gross: number | null | undefined,
  charges: number | null | undefined,
  pct: number | null | undefined
): number | null {
  if (pct == null || Number.isNaN(pct)) return null;
  const net = e2NetPnl(gross, charges);
  if (net == null) return pct;
  const g = Number(gross);
  if (!Number.isFinite(g) || g === 0) return pct;
  return (pct * net) / g;
}

type PnlLine = {
  label: string;
  value: number | null;
  pct: number | null;
  emphasis?: boolean;
  infoTip?: string;
  gross?: number | null;
  charges?: number | null;
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
    const selfManaged = pnlSummary.e1_hedgium_managed === false;
    const allTimeDetail = pnlSummary.pnl_inception_date
      ? `(${formatDate(pnlSummary.pnl_inception_date)} → Till date)`
      : accountCreatedAt
        ? `(${formatDate(accountCreatedAt)} → Till date)`
        : "(Inception → Till date)";

    const buildLines = (
      e2: number,
      e2Pct: number | null | undefined,
      e2Charges: number | null | undefined,
      e1: number | null | undefined,
      e1Pct: number | null | undefined,
      combined: number | null | undefined,
      combinedPct: number | null | undefined,
      e1Realised: number | null | undefined,
      e1Mtm: number | null | undefined
    ): PnlLine[] => {
      const charges = e2Charges ?? 0;
      const lines: PnlLine[] = [
        {
          label: "E2",
          value: e2NetPnl(e2, charges),
          pct: netScaledPct(e2, charges, e2Pct),
          gross: e2,
          charges,
        },
      ];
      if (e1 != null) {
        const infoTip = e1InfoTip(selfManaged, e1Realised ?? null, e1Mtm ?? null);
        lines.push(
          {
            label: "E1",
            value: e1,
            pct: e1Pct ?? null,
            infoTip: infoTip || undefined,
          },
          {
            label: "Total",
            value: combined != null ? e2NetPnl(combined, charges) : null,
            pct: netScaledPct(combined, charges, combinedPct),
            gross: combined ?? null,
            charges,
            emphasis: true,
          }
        );
      }
      return lines;
    };

    return [
      {
        key: "month",
        label: "Monthly (Current)",
        detail: `(${pnlSummary.month})`,
        lines: buildLines(
          pnlSummary.pnl ?? 0,
          pnlSummary.pnl_pct,
          pnlSummary.charges,
          pnlSummary.e1_month_pnl,
          pnlSummary.e1_month_pnl_pct,
          pnlSummary.combined_month_pnl,
          pnlSummary.combined_month_pnl_pct,
          pnlSummary.e1_month_realised,
          pnlSummary.e1_month_mtm
        ),
      },
      {
        key: "quarter",
        label: "Quarterly (Current)",
        detail: `(${pnlSummary.quarter})`,
        lines: buildLines(
          pnlSummary.quarter_pnl ?? 0,
          pnlSummary.quarter_pnl_pct,
          pnlSummary.quarter_charges,
          pnlSummary.e1_quarter_pnl,
          pnlSummary.e1_quarter_pnl_pct,
          pnlSummary.combined_quarter_pnl,
          pnlSummary.combined_quarter_pnl_pct,
          pnlSummary.e1_quarter_realised,
          pnlSummary.e1_quarter_mtm
        ),
      },
      {
        key: "ytd",
        label: "YTD (Current)",
        detail: `(${pnlSummary.fy})`,
        lines: buildLines(
          pnlSummary.ytd_pnl ?? 0,
          pnlSummary.ytd_pnl_pct,
          pnlSummary.ytd_charges,
          pnlSummary.e1_ytd_pnl,
          pnlSummary.e1_ytd_pnl_pct,
          pnlSummary.combined_ytd_pnl,
          pnlSummary.combined_ytd_pnl_pct,
          pnlSummary.e1_ytd_realised,
          pnlSummary.e1_ytd_mtm
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
          pnlSummary.all_time_charges,
          pnlSummary.e1_all_time_pnl,
          pnlSummary.e1_all_time_pnl_pct,
          pnlSummary.combined_all_time_pnl,
          pnlSummary.combined_all_time_pnl_pct,
          pnlSummary.e1_all_time_realised,
          pnlSummary.e1_all_time_mtm
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
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {e2PnlTiles.map((tile) => (
          <div
            key={tile.key}
            className={
              tile.highlight
                ? "relative z-0 hover:z-20 focus-within:z-20 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-base-100/80 p-4"
                : "relative z-0 hover:z-20 focus-within:z-20 rounded-2xl border border-base-300/60 bg-base-200/35 p-4"
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
                    className={`inline-flex items-center gap-0.5 shrink-0 text-[11px] font-medium uppercase tracking-wide ${
                      line.emphasis ? "text-base-content/80" : "text-base-content/55"
                    }`}
                  >
                    {line.label}
                    {line.infoTip ? (
                      <button
                        type="button"
                        className={`tooltip z-30 cursor-pointer inline-flex text-base-content/45 hover:text-base-content/70 before:z-30 before:max-w-[14rem] before:text-left before:whitespace-normal before:px-3 before:py-2 before:normal-case before:tracking-normal after:z-30 ${
                          tile.key === "month" || tile.key === "ytd"
                            ? "tooltip-right"
                            : "tooltip-left"
                        }`}
                        data-tip={line.infoTip}
                        aria-label={line.infoTip}
                      >
                        <Info className="h-3 w-3" strokeWidth={2.5} aria-hidden />
                      </button>
                    ) : null}
                  </span>
                  <div className="min-w-0 text-right">
                    {line.gross != null ? (
                      <NetPnlWithCosts
                        gross={line.gross}
                        charges={line.charges ?? 0}
                        dropdownLeft={tile.key !== "month" && tile.key !== "ytd"}
                        className={
                          line.emphasis
                            ? "text-base font-bold leading-tight md:text-lg"
                            : "text-sm font-semibold leading-tight"
                        }
                      />
                    ) : (
                      <div
                        className={`tabular-nums leading-tight ${
                          line.emphasis ? "text-base font-bold md:text-lg" : "text-sm font-semibold"
                        } ${
                          line.value == null ? "text-base-content/45" : signedClass(line.value)
                        }`}
                      >
                        {formatPnlAmount(line.value)}
                      </div>
                    )}
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
      <p className="max-w-4xl text-xs leading-relaxed text-base-content/70">
        E2 is net PnL from Hedgium trading strategies (hover the info icon for gross
        and other costs). E1 is CNC equity holdings
        {pnlSummary.e1_hedgium_managed === false ? (
          <span className="text-warning">
            {" "}
            (self-managed — not managed by Hedgium)
          </span>
        ) : null}
        . Total is both combined, for the current month, quarter, financial year, and all time.
      </p>
    </div>
  );
}
