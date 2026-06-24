"use client";

import type { ReactNode } from "react";
import { Activity } from "lucide-react";
import type { FeatureSummary } from "@/types/research";

type Props = {
  features: FeatureSummary;
  agentSummary?: string | null;
};

function num(value: unknown, decimals = 2): string {
  if (value == null || value === "") return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return n.toFixed(decimals);
}

function pct(value: unknown, decimals = 2): string {
  if (value == null || value === "") return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return `${(n * 100).toFixed(decimals)}%`;
}

function rsiTone(rsi: number | null): string {
  if (rsi == null) return "text-base-content";
  if (rsi >= 70) return "text-error";
  if (rsi <= 30) return "text-success";
  return "text-base-content";
}

function rsiLabel(rsi: number | null): string | null {
  if (rsi == null) return null;
  if (rsi >= 70) return "Overbought";
  if (rsi <= 30) return "Oversold";
  if (rsi >= 45 && rsi <= 65) return "Healthy momentum";
  return null;
}

function boolChip(value: unknown, trueLabel: string, falseLabel: string) {
  if (value == null) return "—";
  const on = Boolean(value);
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${
        on
          ? "border-success/35 bg-success/10 text-success"
          : "border-base-300/60 bg-base-200/40 text-base-content/60"
      }`}
    >
      {on ? trueLabel : falseLabel}
    </span>
  );
}

type Metric = {
  label: string;
  value: ReactNode;
  hint?: string;
};

export default function ResearchTechnicalAnalysis({ features, agentSummary }: Props) {
  const technical = features.technical ?? {};
  const volatility = features.volatility ?? {};

  const rsi = technical.rsi_14 != null ? Number(technical.rsi_14) : null;
  const rsiZone = rsiLabel(Number.isNaN(rsi as number) ? null : rsi);

  const technicalMetrics: Metric[] = [
    {
      label: "RSI (14)",
      value: (
        <span className={rsiTone(rsi)}>
          {num(technical.rsi_14, 1)}
          {rsiZone ? (
            <span className="ml-1.5 text-xs font-normal text-base-content/55">
              · {rsiZone}
            </span>
          ) : null}
        </span>
      ),
    },
    {
      label: "MACD",
      value: num(technical.macd),
      hint: `Signal ${num(technical.macd_signal)} · Hist ${num(technical.macd_histogram)}`,
    },
    {
      label: "MACD cross",
      value: boolChip(technical.macd_bullish_cross, "Bullish cross", "No cross"),
    },
    { label: "EMA 20", value: num(technical.ema_20) },
    { label: "EMA 50", value: num(technical.ema_50) },
    { label: "EMA 200", value: num(technical.ema_200) },
    {
      label: "Price vs EMAs",
      value: (
        <span className="flex flex-wrap gap-1">
          {boolChip(technical.price_above_ema_20, ">20", "≤20")}
          {boolChip(technical.price_above_ema_50, ">50", "≤50")}
          {boolChip(technical.price_above_ema_200, ">200", "≤200")}
        </span>
      ),
    },
    { label: "ADX (14)", value: num(technical.adx_14, 1), hint: "Trend strength" },
    { label: "ATR (14)", value: num(technical.atr_14) },
    {
      label: "Volume spike",
      value: technical.volume_spike != null ? `${num(technical.volume_spike)}×` : "—",
      hint: "Vs 20-day avg",
    },
    { label: "VWAP proxy", value: num(technical.vwap_proxy) },
  ];

  const volatilityMetrics: Metric[] = [
    {
      label: "Hist. vol (20d)",
      value: volatility.historical_volatility_20d != null
        ? pct(volatility.historical_volatility_20d)
        : "—",
    },
    { label: "Beta (252d)", value: num(volatility.beta_252) },
    {
      label: "Sector vol (20d)",
      value: volatility.sector_volatility_20d != null
        ? pct(volatility.sector_volatility_20d)
        : "—",
    },
    {
      label: "Gap frequency",
      value: volatility.gap_frequency_60d != null
        ? pct(volatility.gap_frequency_60d)
        : "—",
      hint:
        volatility.gap_count_60d != null
          ? `${volatility.gap_count_60d} gaps / 60d`
          : undefined,
    },
  ];

  const hasTechnical = Object.keys(technical).length > 0;
  const hasVolatility = Object.keys(volatility).length > 0;

  if (!hasTechnical && !hasVolatility) {
    return (
      <div className="rounded-2xl border border-dashed border-base-300/60 bg-base-200/20 p-6 text-center text-sm text-base-content/55">
        Technical features not computed yet. Run{" "}
        <code className="text-xs">compute_features</code> for this symbol.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-base-300/60 bg-base-100/80 p-4 md:p-6 backdrop-blur-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" aria-hidden />
          <h3 className="text-lg font-semibold">Technical analysis</h3>
        </div>
        {features.as_of_date ? (
          <span className="text-xs text-base-content/50">
            As of {features.as_of_date}
          </span>
        ) : null}
      </div>

      {agentSummary ? (
        <p className="mb-4 rounded-lg border border-base-300/40 bg-base-200/25 px-3 py-2 text-sm text-base-content/80">
          {agentSummary}
        </p>
      ) : null}

      {hasTechnical ? (
        <div className="mb-5">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-base-content/50">
            Indicators
          </h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {technicalMetrics.map(({ label, value, hint }) => (
              <div
                key={label}
                className="rounded-xl border border-base-300/50 bg-base-200/30 p-3"
              >
                <span className="text-xs text-base-content/55">{label}</span>
                <p className="mt-1 text-sm font-semibold tabular-nums">{value}</p>
                {hint ? (
                  <p className="mt-0.5 text-[11px] text-base-content/45">{hint}</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {hasVolatility ? (
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-base-content/50">
            Volatility &amp; market
          </h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {volatilityMetrics.map(({ label, value, hint }) => (
              <div
                key={label}
                className="rounded-xl border border-base-300/50 bg-base-200/30 p-3"
              >
                <span className="text-xs text-base-content/55">{label}</span>
                <p className="mt-1 text-sm font-semibold tabular-nums">{value}</p>
                {hint ? (
                  <p className="mt-0.5 text-[11px] text-base-content/45">{hint}</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
