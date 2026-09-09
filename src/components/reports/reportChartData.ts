export type ChartPeriod = "daily" | "weekly" | "monthly";

export type MarginSnapshot = {
  snapshot_date: string;
  net: number;
  available?: number;
  utilised?: number;
};

export type PnlChartPoint = { time: string; value: number };

export type PnlMonthlyBarPoint = {
  time: string;
  /** Month-on-month net PnL change (gross − other costs) */
  value: number;
  gross: number;
  charges: number;
};

export type PnlSnapshotRow = {
  snapshot_date: string;
  pnl_total: number;
  charges_total?: number;
};

const ISO_DATE_PREFIX = /^\d{4}-\d{2}-\d{2}/;

/**
 * Parse `profiles/pnl-snapshots/` (or simulation) JSON. Returns [] if shape is wrong.
 */
export function parsePnlSnapshotsResponse(json: unknown): PnlSnapshotRow[] {
  if (!json || typeof json !== "object" || !("results" in json)) return [];
  const results = (json as { results: unknown }).results;
  if (!Array.isArray(results)) return [];
  const out: PnlSnapshotRow[] = [];
  for (const item of results) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const sd = o.snapshot_date;
    const pt = o.pnl_total;
    if (typeof sd !== "string" || (typeof pt !== "number" && typeof pt !== "string")) continue;
    if (!ISO_DATE_PREFIX.test(sd)) continue;
    const n = typeof pt === "number" ? pt : Number(pt);
    if (!Number.isFinite(n)) continue;
    const rawCharges = o.charges_total;
    let charges = 0;
    if (typeof rawCharges === "number" || typeof rawCharges === "string") {
      const c = typeof rawCharges === "number" ? rawCharges : Number(rawCharges);
      if (Number.isFinite(c)) charges = c;
    }
    out.push({ snapshot_date: sd.slice(0, 10), pnl_total: n, charges_total: charges });
  }
  return out;
}

/**
 * Parse `profiles/margin-snapshots/` JSON. Returns [] if shape is wrong.
 */
export function parseMarginSnapshotsResponse(json: unknown): MarginSnapshot[] {
  if (!json || typeof json !== "object" || !("results" in json)) return [];
  const results = (json as { results: unknown }).results;
  if (!Array.isArray(results)) return [];
  const out: MarginSnapshot[] = [];
  for (const item of results) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const sd = o.snapshot_date;
    const net = o.net;
    if (typeof sd !== "string" || !ISO_DATE_PREFIX.test(sd)) continue;
    const netNum = typeof net === "number" ? net : Number(net);
    if (!Number.isFinite(netNum)) continue;
    const row: MarginSnapshot = {
      snapshot_date: sd.slice(0, 10),
      net: netNum,
    };
    if (typeof o.available === "number" && Number.isFinite(o.available)) row.available = o.available;
    if (typeof o.utilised === "number" && Number.isFinite(o.utilised)) row.utilised = o.utilised;
    out.push(row);
  }
  return out;
}

/** Fetch range for PnL monthly bar chart: enough history to compute month-over-month deltas. */
export function getPnlBarChartDateRange(): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  const fromD = new Date(now);
  fromD.setMonth(fromD.getMonth() - 15);
  return { from: fromD.toISOString().slice(0, 10), to };
}

function snapshotGross(row: PnlSnapshotRow): number {
  return Number(row.pnl_total);
}

function snapshotCharges(row: PnlSnapshotRow): number {
  const c = Number(row.charges_total ?? 0);
  return Number.isFinite(c) ? c : 0;
}

function snapshotNet(row: PnlSnapshotRow): number {
  return snapshotGross(row) - snapshotCharges(row);
}

function snapshotLevels(row: PnlSnapshotRow | undefined): { gross: number; net: number; charges: number } {
  if (!row) return { gross: 0, net: 0, charges: 0 };
  return {
    gross: snapshotGross(row),
    net: snapshotNet(row),
    charges: snapshotCharges(row),
  };
}

/**
 * Monthly PnL **change** from daily snapshot **levels** (last point per calendar month vs prior).
 * Bars are **net** (gross − other costs). Aligns with ``positions/pnl/`` **all-time total**
 * only when DailyPnlSnapshot rows store full profile Position sums
 * (see backend ``_daily_pnl_snapshot_defaults_for_profile``).
 * This will not match summary “last month” / “last week” cards, which use different filters.
 */
export function buildPnlMonthlyBars(data: PnlSnapshotRow[], maxMonths = 12): PnlMonthlyBarPoint[] {
  const sorted = [...data].sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date));
  if (sorted.length === 0) return [];

  const lastInMonth = new Map<string, PnlSnapshotRow>();
  for (const row of sorted) {
    const mk = row.snapshot_date.slice(0, 7);
    lastInMonth.set(mk, row);
  }

  const monthKeys = Array.from(lastInMonth.keys()).sort();
  let prevEnd: { gross: number; net: number; charges: number } | null = null;
  const deltas: { ym: string; net: number; gross: number; charges: number }[] = [];

  for (const mk of monthKeys) {
    const startOfMonth = `${mk}-01`;
    let base: { gross: number; net: number; charges: number };
    if (prevEnd === null) {
      let prior: PnlSnapshotRow | undefined;
      for (let i = sorted.length - 1; i >= 0; i--) {
        if (sorted[i].snapshot_date < startOfMonth) {
          prior = sorted[i];
          break;
        }
      }
      base = snapshotLevels(prior);
    } else {
      base = prevEnd;
    }
    const end = snapshotLevels(lastInMonth.get(mk));
    deltas.push({
      ym: mk,
      net: end.net - base.net,
      gross: end.gross - base.gross,
      charges: end.charges - base.charges,
    });
    prevEnd = end;
  }

  return deltas.slice(-maxMonths).map(({ ym, net, gross, charges }) => ({
    time: `${ym}-01`,
    value: net,
    gross,
    charges,
  }));
}

export function getChartDateRange(period: ChartPeriod): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  let from: string;
  if (period === "daily") {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 1);
    from = d.toISOString().slice(0, 10);
  } else if (period === "weekly") {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 6);
    from = d.toISOString().slice(0, 10);
  } else {
    const d = new Date(now);
    d.setFullYear(d.getFullYear() - 2);
    from = d.toISOString().slice(0, 10);
  }
  return { from, to };
}

function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay());
  return start.toISOString().slice(0, 10);
}

function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function aggregateMarginSnapshots(
  data: MarginSnapshot[],
  period: ChartPeriod
): MarginSnapshot[] {
  if (period === "daily" || data.length === 0) return data;
  const byKey = new Map<string, { net: number[]; utilised: number[] }>();
  for (const row of data) {
    const key = period === "weekly" ? getWeekKey(row.snapshot_date) : getMonthKey(row.snapshot_date);
    const entry = byKey.get(key) ?? { net: [], utilised: [] };
    entry.net.push(row.net);
    entry.utilised.push(Number(row.utilised ?? 0));
    byKey.set(key, entry);
  }
  return Array.from(byKey.entries())
    .map(([key, v]) => ({
      snapshot_date: period === "weekly" ? key : `${key}-01`,
      net: v.net.reduce((a, b) => a + b, 0) / v.net.length,
      utilised: v.utilised.reduce((a, b) => a + b, 0) / v.utilised.length,
    }))
    .sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date));
}

export function aggregatePnlLevelSeries(
  data: PnlSnapshotRow[],
  period: ChartPeriod
): PnlChartPoint[] {
  const sorted = [...data].sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date));
  if (period === "daily") {
    return sorted.map((d) => ({ time: d.snapshot_date, value: d.pnl_total }));
  }
  const byKey = new Map<string, { time: string; value: number }>();
  for (const d of sorted) {
    const key = period === "weekly" ? getWeekKey(d.snapshot_date) : getMonthKey(d.snapshot_date);
    byKey.set(key, { time: period === "weekly" ? key : `${key}-01`, value: d.pnl_total });
  }
  return Array.from(byKey.values()).sort((a, b) => a.time.localeCompare(b.time));
}

export const MONTH_NAMES_UPPER = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
] as const;

export function monthLabelFromBarTime(time: string): string {
  const m = parseInt(time.slice(5, 7), 10);
  if (m >= 1 && m <= 12) return MONTH_NAMES_UPPER[m - 1];
  return time;
}
