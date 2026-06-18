"use client";

import { BarChart3 } from "lucide-react";
import type { MarketData } from "@/types/research";
import { formatMoneyIN } from "@/utils/formatNumber";

function fmtPct(value: number | null | undefined) {
  if (value == null) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function fmtCr(value: number | null | undefined) {
  if (value == null) return "—";
  const abs = Math.abs(value);
  const sign = value >= 0 ? "+" : "−";
  if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(1)}k Cr`;
  return `${sign}₹${abs.toFixed(0)} Cr`;
}

type Props = {
  marketData: MarketData;
};

export default function ResearchMarketDataCard({ marketData }: Props) {
  const items = [
    { label: "Latest close", value: `₹${formatMoneyIN(marketData.latest_close)}` },
    { label: "As of", value: marketData.latest_date },
    { label: "OHLCV bars", value: String(marketData.ohlcv_bars) },
    {
      label: "Delivery %",
      value:
        marketData.latest_delivery_pct != null
          ? `${marketData.latest_delivery_pct.toFixed(1)}%`
          : "—",
    },
    {
      label: "Sector 20d",
      value: fmtPct(marketData.sector_return_20d),
    },
    { label: "FII net", value: fmtCr(marketData.fii_net) },
    { label: "DII net", value: fmtCr(marketData.dii_net) },
  ];

  return (
    <div className="rounded-2xl border border-base-300/60 bg-base-100/80 p-4 md:p-6 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" aria-hidden />
        <h3 className="text-lg font-semibold">Market data</h3>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-base-300/50 bg-base-200/30 p-3"
          >
            <span className="text-xs text-base-content/55">{label}</span>
            <p className="mt-1 text-sm font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
