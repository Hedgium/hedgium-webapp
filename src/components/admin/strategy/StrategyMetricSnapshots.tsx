"use client";

import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/utils/api";
import { formatDateTimeMinutes } from "@/utils/formatDate";
import { formatLakhsIN, formatMoneyIN } from "@/utils/formatNumber";
import { ChevronLeft, ChevronRight, Download, RotateCw, X } from "lucide-react";

const PAGE_SIZE = 50;
const CSV_EXPORT_PAGE_SIZE = 100;

export interface MetricSnapshotByExpiry {
  expiry?: string;
  pe_notional?: number | null;
  ce_notional?: number | null;
  pe_premium?: number | null;
  ce_premium?: number | null;
}

export interface MetricSnapshotRow {
  id: number;
  strategy_builder_id: number;
  strategy_id?: number | null;
  spot?: Record<string, number> | null;
  future?: Record<string, number> | null;
  pnl?: number | string | null;
  mid_pnl?: number | string | null;
  spread?: number | string | null;
  straddle?: number | string | null;
  delta_by_underlying?: Record<string, number> | null;
  delta_band_min?: number | string | null;
  delta_band_max?: number | string | null;
  trade_count: number;
  pe_notional?: number | string | null;
  ce_notional?: number | string | null;
  pe_premium?: number | string | null;
  ce_premium?: number | string | null;
  by_expiry?: MetricSnapshotByExpiry[] | null;
  created_at: string;
}

interface PaginatedSnapshots {
  count: number;
  next: string | null;
  previous: string | null;
  results: MetricSnapshotRow[];
}

type ExpiryMetricKey = "ce_premium" | "pe_premium" | "ce_notional" | "pe_notional";

function toNum(v: number | string | null | undefined): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function formatPct(v: number | string | null | undefined, digits = 2): string {
  const n = toNum(v);
  return n == null ? "—" : `${n.toFixed(digits)}%`;
}

function formatMoney(v: number | string | null | undefined): string {
  const n = toNum(v);
  return n == null ? "—" : formatMoneyIN(n);
}

function formatSpot(spot: Record<string, number> | null | undefined): string {
  if (!spot || !Object.keys(spot).length) return "—";
  return Object.entries(spot)
    .map(([sym, px]) => `${sym} ${Number(px).toFixed(2)}`)
    .join(", ");
}

function formatExpiryLabel(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    });
  } catch {
    return iso;
  }
}

function pnlClass(v: number | string | null | undefined): string {
  const n = toNum(v);
  if (n == null) return "text-base-content";
  if (n > 0) return "text-success";
  if (n < 0) return "text-error";
  return "text-base-content";
}

function formatLakhCell(v: number | string | null | undefined): string {
  const n = toNum(v);
  return n == null ? "—" : formatLakhsIN(n);
}

/** Delta band is stored in lakhs (e.g. 2 = ₹2L). Avoid en-dash — it looks like a minus. */
function formatDeltaBandLakhs(
  min: number | string | null | undefined,
  max: number | string | null | undefined
): string {
  const lo = toNum(min);
  const hi = toNum(max);
  if (lo == null && hi == null) return "—";
  const fmt = (n: number) =>
    `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}L`;
  if (lo != null && hi != null) return `${fmt(lo)} to ${fmt(hi)}`;
  if (lo != null) return `≥ ${fmt(lo)}`;
  return `≤ ${fmt(hi!)}`;
}

/**
 * Absolute delta (₹) = net_delta × spot per underlying; display in lakhs.
 * Combined = sum across underlyings.
 */
function AbsoluteDeltaCell({
  deltas,
  spots,
}: {
  deltas?: Record<string, number> | null;
  spots?: Record<string, number> | null;
}) {
  const symbols = Array.from(
    new Set([...Object.keys(deltas || {}), ...Object.keys(spots || {})])
  )
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const rows = symbols.map((sym) => {
    const delta = toNum(deltas?.[sym] ?? null);
    const spot = toNum(spots?.[sym] ?? null);
    const abs =
      delta != null && spot != null && spot > 0 ? delta * spot : null;
    return { sym, abs };
  });
  const withAbs = rows.filter((r) => r.abs != null);
  if (!withAbs.length) {
    return <span className="text-base-content/40">—</span>;
  }

  const combined = withAbs.reduce((sum, r) => sum + (r.abs as number), 0);

  return (
    <div className="flex flex-col items-end gap-0.5 text-xs tabular-nums leading-tight">
      {withAbs.map((r) => (
        <div key={r.sym} className="flex justify-end gap-1.5 whitespace-nowrap">
          <span className="text-base-content/45">{r.sym}</span>
          <span className={pnlClass(r.abs)}>{formatLakhCell(r.abs)}</span>
        </div>
      ))}
      {withAbs.length > 1 && (
        <div className="flex justify-end gap-1.5 whitespace-nowrap border-t border-base-300/50 pt-0.5 mt-0.5 font-medium">
          <span className="text-base-content/45">Net</span>
          <span className={pnlClass(combined)}>{formatLakhCell(combined)}</span>
        </div>
      )}
    </div>
  );
}

function ExpiryMetricColumn({
  byExpiry,
  field,
}: {
  byExpiry?: MetricSnapshotByExpiry[] | null;
  field: ExpiryMetricKey;
}) {
  const rows = byExpiry ?? [];
  if (!rows.length) {
    return <span className="text-base-content/40">—</span>;
  }
  return (
    <div className="flex flex-col items-end gap-0.5 text-xs tabular-nums leading-tight">
      {rows.map((exp, idx) => {
        const val = exp[field];
        return (
          <div
            key={`${exp.expiry ?? "x"}-${idx}`}
            className="flex justify-end gap-1.5 whitespace-nowrap"
          >
            <span className="text-base-content/45">
              {formatExpiryLabel(exp.expiry)}
            </span>
            <span className={pnlClass(val)}>{formatLakhCell(val)}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Compact expiry token for CSV headers, e.g. 12Aug26 */
function expiryCsvKey(iso: string | undefined): string | null {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso.replace(/[^a-zA-Z0-9]/g, "_");
    const day = String(d.getUTCDate()).padStart(2, "0");
    const month = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
    const year = String(d.getUTCFullYear()).slice(-2);
    return `${day}${month}${year}`;
  } catch {
    return iso.replace(/[^a-zA-Z0-9]/g, "_");
  }
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function csvCell(v: number | string | null | undefined): string {
  if (v == null || v === "") return "";
  if (typeof v === "number") {
    return Number.isFinite(v) ? String(v) : "";
  }
  const n = Number(v);
  if (v.trim() !== "" && Number.isFinite(n) && String(n) === v.trim()) {
    return String(n);
  }
  return csvEscape(String(v));
}

function absDeltaForSymbol(
  deltas: Record<string, number> | null | undefined,
  spots: Record<string, number> | null | undefined,
  sym: string
): number | null {
  const delta = toNum(deltas?.[sym] ?? null);
  const spot = toNum(spots?.[sym] ?? null);
  if (delta == null || spot == null || spot <= 0) return null;
  return delta * spot;
}

async function collectAllSnapshots(strategyId: number): Promise<MetricSnapshotRow[]> {
  const all: MetricSnapshotRow[] = [];
  let pageNum = 1;
  for (;;) {
    const res = await authFetch(
      `myadmin/strategies/${strategyId}/metric-snapshots/?page=${pageNum}&page_size=${CSV_EXPORT_PAGE_SIZE}`
    );
    if (!res.ok) {
      throw new Error("Failed to fetch metric snapshots for export.");
    }
    const data: PaginatedSnapshots = await res.json();
    all.push(...(data.results ?? []));
    if (!data.next) break;
    pageNum += 1;
  }
  return all;
}

function buildMetricSnapshotsCsv(rows: MetricSnapshotRow[]): string {
  const symbolSet = new Set<string>();
  const expirySet = new Set<string>();

  for (const row of rows) {
    for (const sym of Object.keys(row.delta_by_underlying || {})) {
      if (sym) symbolSet.add(sym);
    }
    for (const sym of Object.keys(row.spot || {})) {
      if (sym) symbolSet.add(sym);
    }
    for (const sym of Object.keys(row.future || {})) {
      if (sym) symbolSet.add(sym);
    }
    for (const exp of row.by_expiry ?? []) {
      const key = expiryCsvKey(exp.expiry);
      if (key) expirySet.add(key);
    }
  }

  const symbols = Array.from(symbolSet).sort((a, b) => a.localeCompare(b));
  const expiries = Array.from(expirySet).sort((a, b) => a.localeCompare(b));

  const headers = [
    "created_at",
    "pnl",
    "mid_pnl",
    "spread",
    "straddle",
    "delta_band_min",
    "delta_band_max",
    "trade_count",
    ...symbols.map((s) => `abs_delta_${s}`),
    ...symbols.map((s) => `spot_${s}`),
    ...symbols.map((s) => `future_${s}`),
    ...expiries.map((e) => `ce_prem_${e}`),
    ...expiries.map((e) => `pe_prem_${e}`),
  ];

  const lines = [headers.map(csvEscape).join(",")];

  for (const row of rows) {
    const expiryMap = new Map<string, MetricSnapshotByExpiry>();
    for (const exp of row.by_expiry ?? []) {
      const key = expiryCsvKey(exp.expiry);
      if (key) expiryMap.set(key, exp);
    }

    const cells: string[] = [
      csvCell(row.created_at),
      csvCell(toNum(row.pnl)),
      csvCell(toNum(row.mid_pnl)),
      csvCell(toNum(row.spread)),
      csvCell(toNum(row.straddle)),
      csvCell(toNum(row.delta_band_min)),
      csvCell(toNum(row.delta_band_max)),
      csvCell(row.trade_count),
      ...symbols.map((s) =>
        csvCell(absDeltaForSymbol(row.delta_by_underlying, row.spot, s))
      ),
      ...symbols.map((s) => csvCell(toNum(row.spot?.[s] ?? null))),
      ...symbols.map((s) => csvCell(toNum(row.future?.[s] ?? null))),
      ...expiries.map((e) => csvCell(toNum(expiryMap.get(e)?.ce_premium ?? null))),
      ...expiries.map((e) => csvCell(toNum(expiryMap.get(e)?.pe_premium ?? null))),
    ];
    lines.push(cells.join(","));
  }

  return lines.join("\n");
}

function sanitizeFilename(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^_|_$/g, "");
  return cleaned || "strategy";
}

function triggerCsvDownload(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

interface Props {
  strategyId: number;
  strategyName: string;
  onClose: () => void;
}

export default function StrategyMetricSnapshotsModal({
  strategyId,
  strategyName,
  onClose,
}: Props) {
  const [rows, setRows] = useState<MetricSnapshotRow[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (pageNum: number, silent = false) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        const res = await authFetch(
          `myadmin/strategies/${strategyId}/metric-snapshots/?page=${pageNum}&page_size=${PAGE_SIZE}`
        );
        if (!res.ok) {
          setError("Failed to load metric snapshots.");
          setRows([]);
          setCount(0);
          return;
        }
        const data: PaginatedSnapshots = await res.json();
        setRows(data.results ?? []);
        setCount(data.count ?? 0);
        setPage(pageNum);
      } catch {
        setError("Error loading metric snapshots.");
        setRows([]);
        setCount(0);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [strategyId]
  );

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    setError(null);
    try {
      const allRows = await collectAllSnapshots(strategyId);
      const csv = buildMetricSnapshotsCsv(allRows);
      triggerCsvDownload(
        `${sanitizeFilename(strategyName)}-metric-snapshots.csv`,
        csv
      );
    } catch {
      setError("Failed to download metric snapshots CSV.");
    } finally {
      setDownloading(false);
    }
  }, [strategyId, strategyName]);

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-base-100 text-base-content">
      <header className="flex flex-wrap items-center gap-3 border-b border-base-300 px-4 py-3 shrink-0 bg-base-200/80">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold truncate">
            Metric snapshots — {strategyName}
          </h2>
          <p className="text-xs text-base-content/55 mt-0.5">
            5-minute ACTIVE-builder history ({count} rows) · abs Δ = Δ×spot (L) ·
            band in L
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleDownload}
            className="btn btn-ghost btn-sm gap-1.5"
            title="Download all snapshots as CSV"
            disabled={downloading || loading || count === 0}
          >
            <Download className={`size-4 ${downloading ? "animate-pulse" : ""}`} />
            {downloading ? "Downloading…" : "Download"}
          </button>
          <button
            type="button"
            onClick={() => fetchPage(page, true)}
            className={`btn btn-ghost btn-sm btn-square ${loading ? "animate-spin" : ""}`}
            title="Refresh metric snapshots"
            disabled={loading || downloading}
          >
            <RotateCw className="size-4" />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-circle"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-auto p-4">
        {error && <p className="text-sm text-error mb-3">{error}</p>}

        {loading && !rows.length ? (
          <div className="rounded-lg border border-base-300/70 bg-base-200/40 p-8 text-sm text-base-content/60">
            Loading snapshots…
          </div>
        ) : !rows.length ? (
          <div className="rounded-lg border border-base-300/70 bg-base-200/40 p-8 text-sm text-base-content/60">
            No metric snapshots yet. Snapshots are recorded every 5 minutes while the
            builder is ACTIVE.
          </div>
        ) : (
          <div className="rounded-lg border border-base-300/70 bg-base-100 overflow-x-auto">
            <table className="table table-sm">
              <thead className="sticky top-0 bg-base-200 z-10">
                <tr>
                  <th>Time</th>
                  <th className="text-right">PnL</th>
                  <th className="text-right">Mid PnL</th>
                  <th className="text-right">Spread</th>
                  <th className="text-right">Straddle</th>
                  <th className="text-right" title="Absolute delta = net Δ × spot (lakhs)">
                    Abs Δ (L)
                  </th>
                  <th className="text-right" title="Delta band config (lakhs)">
                    Δ band (L)
                  </th>
                  <th className="text-right">Trades</th>
                  <th className="text-right">CE Prem</th>
                  <th className="text-right">PE Prem</th>
                  <th className="text-right">CE Notional</th>
                  <th className="text-right">PE Notional</th>
                  <th>Spot</th>
                  <th title="Near-month futures LTP">Future</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="align-top">
                    <td className="text-xs text-base-content/70 whitespace-nowrap">
                      {formatDateTimeMinutes(row.created_at)}
                    </td>
                    <td className={`text-right tabular-nums whitespace-nowrap ${pnlClass(row.pnl)}`}>
                      {formatMoney(row.pnl)}
                    </td>
                    <td
                      className={`text-right tabular-nums whitespace-nowrap ${pnlClass(row.mid_pnl)}`}
                    >
                      {formatMoney(row.mid_pnl)}
                    </td>
                    <td className="text-right tabular-nums whitespace-nowrap">
                      {formatPct(row.spread)}
                    </td>
                    <td className="text-right tabular-nums whitespace-nowrap">
                      {formatPct(row.straddle)}
                    </td>
                    <td className="text-right">
                      <AbsoluteDeltaCell
                        deltas={row.delta_by_underlying}
                        spots={row.spot}
                      />
                    </td>
                    <td className="text-right tabular-nums whitespace-nowrap text-xs">
                      {formatDeltaBandLakhs(row.delta_band_min, row.delta_band_max)}
                    </td>
                    <td className="text-right tabular-nums">{row.trade_count}</td>
                    <td className="text-right">
                      <ExpiryMetricColumn byExpiry={row.by_expiry} field="ce_premium" />
                    </td>
                    <td className="text-right">
                      <ExpiryMetricColumn byExpiry={row.by_expiry} field="pe_premium" />
                    </td>
                    <td className="text-right">
                      <ExpiryMetricColumn byExpiry={row.by_expiry} field="ce_notional" />
                    </td>
                    <td className="text-right">
                      <ExpiryMetricColumn byExpiry={row.by_expiry} field="pe_notional" />
                    </td>
                    <td
                      className="text-xs whitespace-nowrap max-w-[12rem] truncate"
                      title={formatSpot(row.spot)}
                    >
                      {formatSpot(row.spot)}
                    </td>
                    <td
                      className="text-xs whitespace-nowrap max-w-[12rem] truncate"
                      title={formatSpot(row.future)}
                    >
                      {formatSpot(row.future)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <footer className="flex items-center justify-end gap-2 border-t border-base-300 px-4 py-2 shrink-0 bg-base-200/60">
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            disabled={page <= 1 || loading}
            onClick={() => fetchPage(page - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs tabular-nums text-base-content/60">
            Page {page} / {totalPages}
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            disabled={page >= totalPages || loading}
            onClick={() => fetchPage(page + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </footer>
      )}
    </div>
  );
}
