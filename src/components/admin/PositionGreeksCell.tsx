"use client";

import React from "react";

function toNum(v: number | string | null | undefined): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export function formatGreekValue(v: number | string | null | undefined): string {
  const n = toNum(v);
  if (n == null) return "—";
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
}

export function formatGreekTimestamp(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function formatSourceLabel(source: string | null | undefined): string | null {
  if (!source) return null;
  switch (source) {
    case "gamma_adj":
      return "γ-adj";
    case "bs_fallback":
      return "BS";
    default:
      return source;
  }
}

export interface PositionGreeksCellProps {
  greeks: {
    greek_delta?: number | string | null;
    greek_gamma?: number | string | null;
    greek_theta?: number | string | null;
    greek_vega?: number | string | null;
    greek_updated_at?: string | null;
    greek_source?: string | null;
    greek_spot?: number | string | null;
  };
  compact?: boolean;
}

export default function PositionGreeksCell({ greeks, compact = false }: PositionGreeksCellProps) {
  const delta = formatGreekValue(greeks.greek_delta);
  const gamma = formatGreekValue(greeks.greek_gamma);
  const theta = formatGreekValue(greeks.greek_theta);
  const vega = formatGreekValue(greeks.greek_vega);
  const updatedAt = formatGreekTimestamp(greeks.greek_updated_at);
  const source = formatSourceLabel(greeks.greek_source);
  const spot = toNum(greeks.greek_spot);

  if (delta === "—" && gamma === "—") {
    return <span className="text-base-content/50">—</span>;
  }

  return (
    <div className="min-w-[7rem] space-y-0.5 tabular-nums">
      <div className="text-xs font-medium">
        <span className="text-base-content/60">Δ</span> {delta}
        <span className="mx-1 text-base-content/30">/</span>
        <span className="text-base-content/60">Γ</span> {gamma}
      </div>
      {!compact && (theta !== "—" || vega !== "—") ? (
        <div className="text-[11px] text-base-content/70">
          <span className="text-base-content/50">Θ</span> {theta}
          <span className="mx-1 text-base-content/30">·</span>
          <span className="text-base-content/50">V</span> {vega}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-1 text-[10px] text-base-content/60">
        {/* {source ? <span className="badge badge-ghost badge-xs">{source}</span> : null} */}
        {updatedAt ? <span>{updatedAt}</span> : null}
        {spot != null ? <span>@ {formatGreekValue(spot)}</span> : null}
      </div>
    </div>
  );
}
