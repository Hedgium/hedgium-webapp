"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RotateCw, X } from "lucide-react";
import { authFetch } from "@/utils/api";

const SNAPSHOT_LIMIT = 400;

type SpreadKey =
  | "spread"
  | "straddle"
  | "atm_strike_spread"
  | "famous_strike_spread"
  | "straddle_level";

interface SpreadPoint {
  id: number;
  created_at: string;
  spread?: number | string | null;
  straddle?: number | string | null;
  atm_strike_spread?: number | string | null;
  famous_strike_spread?: number | string | null;
  straddle_level?: number | string | null;
}

const SERIES: { key: SpreadKey; label: string; color: string }[] = [
  { key: "spread", label: "Spread", color: "var(--color-primary)" },
  { key: "straddle", label: "Straddle", color: "var(--color-info)" },
  { key: "atm_strike_spread", label: "ATM strike spread", color: "var(--color-success)" },
  { key: "famous_strike_spread", label: "Famous strike spread", color: "var(--color-warning)" },
  { key: "straddle_level", label: "Straddle level", color: "var(--color-secondary)" },
];

const axisTick = { fontSize: 11, fill: "var(--color-base-content)" };

function toNum(v: number | string | null | undefined): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function formatPct(n: number): string {
  return `${n.toFixed(2)}%`;
}

/** Expanding linear weighted average. Newer points weigh more (1, 2, 3, …). */
function weightedAvgSeries(values: (number | null)[]): (number | null)[] {
  let weightedSum = 0;
  let weightSum = 0;
  let nextWeight = 1;
  let last: number | null = null;
  return values.map((value) => {
    if (value == null) return last;
    weightedSum += value * nextWeight;
    weightSum += nextWeight;
    nextWeight += 1;
    last = weightedSum / weightSum;
    return last;
  });
}

function formatAxisTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  });
}

function SpreadTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | null }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-xs text-base-content shadow-sm">
      <div className="mb-1 font-medium">{label ? formatAxisTime(String(label)) : ""}</div>
      <div className="space-y-1">
        {payload.map((entry) => {
          const value = entry.value;
          const missing = value == null || Number.isNaN(Number(value));
          return (
            <div key={entry.name ?? "value"} className="flex items-baseline justify-between gap-4">
              <span className="text-base-content/70">{entry.name}</span>
              <span className="font-medium tabular-nums">
                {missing ? "—" : formatPct(Number(value))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function yDomain(
  values: (number | null)[],
  extras: Array<number | null | undefined>,
): [number, number] | ["auto", "auto"] {
  const nums = values.filter((v): v is number => v != null);
  for (const extra of extras) {
    if (extra != null && Number.isFinite(extra)) nums.push(extra);
  }
  if (!nums.length) return ["auto", "auto"];
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  if (min === max) {
    const pad = Math.max(Math.abs(min) * 0.1, 0.1);
    return [min - pad, max + pad];
  }
  const pad = (max - min) * 0.08;
  return [min - pad, max + pad];
}

function SpreadChart({
  seriesKey,
  label,
  color,
  points,
  triggerWs,
}: {
  seriesKey: SpreadKey;
  label: string;
  color: string;
  points: SpreadPoint[];
  triggerWs?: number | null;
}) {
  const values = points.map((point) => toNum(point[seriesKey]));
  const averages = weightedAvgSeries(values);
  const data = points.map((point, index) => ({
    created_at: point.created_at,
    value: values[index],
    weightedAvg: averages[index],
  }));
  const hasValue = values.some((value) => value != null);
  const showTrigger =
    seriesKey === "spread" &&
    triggerWs != null &&
    Number.isFinite(triggerWs) &&
    triggerWs !== 0;
  const domain = yDomain(values, showTrigger ? [triggerWs] : []);

  return (
    <section className="rounded-lg border border-base-300/70 bg-base-100 p-3">
      <h4 className="text-sm font-semibold mb-2">{label}</h4>
      {!hasValue ? (
        <p className="text-sm text-base-content/55 py-8 text-center">No {label.toLowerCase()} points yet.</p>
      ) : (
        <div className="h-52 w-full [&_.recharts-cartesian-axis-tick_text]:fill-base-content/70 [&_.recharts-cartesian-grid_line]:stroke-base-content/10">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-base-300)" />
              <XAxis
                dataKey="created_at"
                tick={axisTick}
                tickFormatter={(v) => formatAxisTime(String(v))}
                minTickGap={28}
              />
              <YAxis
                tick={axisTick}
                tickFormatter={(v) => formatPct(Number(v))}
                width={56}
                domain={domain}
                allowDataOverflow={false}
              />
              <Tooltip
                cursor={{ stroke: "var(--color-base-content)", strokeOpacity: 0.25 }}
                content={<SpreadTooltip />}
              />
              <Legend />
              {showTrigger && (
                <ReferenceLine
                  y={triggerWs}
                  stroke="#dc2626"
                  strokeDasharray="6 4"
                  strokeWidth={2}
                  ifOverflow="extendDomain"
                  label={{
                    value: `Trigger ${formatPct(triggerWs!)}`,
                    position: "insideTopRight",
                    fill: "#dc2626",
                    fontSize: 11,
                  }}
                />
              )}
              <Line
                type="monotone"
                dataKey="value"
                name={label}
                stroke={color}
                strokeWidth={2}
                connectNulls={false}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="weightedAvg"
                name="Weighted avg"
                stroke="var(--color-base-content)"
                strokeOpacity={0.7}
                strokeWidth={1.5}
                strokeDasharray="5 4"
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

interface Props {
  builderId: number;
  builderName: string;
  triggerWs?: number | null;
  onClose: () => void;
}

export default function BuilderSpreadChartsModal({
  builderId,
  builderName,
  triggerWs: triggerWsProp,
  onClose,
}: Props) {
  const [points, setPoints] = useState<SpreadPoint[]>([]);
  const [triggerWs, setTriggerWs] = useState<number | null>(
    triggerWsProp != null && Number.isFinite(Number(triggerWsProp))
      ? Number(triggerWsProp)
      : null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [snapRes, builderRes] = await Promise.all([
        authFetch(`builder/builders/${builderId}/metric-snapshots/?limit=${SNAPSHOT_LIMIT}`),
        authFetch(`builder/builders/${builderId}/`),
      ]);
      if (!snapRes.ok) {
        setError("Failed to load spread snapshots.");
        setPoints([]);
        return;
      }
      const data: SpreadPoint[] = await snapRes.json();
      setPoints(Array.isArray(data) ? data : []);

      // Prefer live builder value so charts opened from admin/strategy pages still work.
      let tw: number | null = null;
      if (builderRes.ok) {
        const builder = await builderRes.json();
        tw = toNum(builder?.trigger_ws);
      }
      if (tw == null && triggerWsProp != null) {
        tw = toNum(triggerWsProp);
      }
      setTriggerWs(tw);
    } catch {
      setError("Error loading spread snapshots.");
      setPoints([]);
    } finally {
      setLoading(false);
    }
  }, [builderId, triggerWsProp]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="modal modal-open"
      role="dialog"
      aria-modal="true"
      aria-labelledby="builder-spread-charts-title"
    >
      <div className="modal-box w-11/12 max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 id="builder-spread-charts-title" className="text-lg font-semibold truncate">
              Spreads — {builderName}
            </h3>
            <p className="text-xs text-base-content/55 mt-0.5">
              Latest {SNAPSHOT_LIMIT} snapshots. Dashed gray = weighted avg
              {triggerWs != null && triggerWs !== 0
                ? `; red dashed = trigger (${formatPct(triggerWs)})`
                : " (set Trigger WS ≠ 0 to show the trigger line)"}
              .
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => void load()}
              className={`btn btn-ghost btn-sm btn-square ${loading ? "animate-spin" : ""}`}
              title="Refresh"
              disabled={loading}
            >
              <RotateCw className="size-4" />
            </button>
            <button type="button" className="btn btn-ghost btn-sm btn-circle" onClick={onClose} aria-label="Close">
              <X className="size-5" />
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-error mb-3">{error}</p>}

        {loading && !points.length ? (
          <div className="rounded-lg border border-base-300/70 bg-base-200/40 p-8 text-sm text-base-content/60">
            Loading snapshots…
          </div>
        ) : !points.length ? (
          <div className="rounded-lg border border-base-300/70 bg-base-200/40 p-8 text-sm text-base-content/60">
            No metric snapshots yet.
          </div>
        ) : (
          <div className="space-y-4">
            {SERIES.map((series) => (
              <SpreadChart
                key={series.key}
                seriesKey={series.key}
                label={series.label}
                color={series.color}
                points={points}
                triggerWs={triggerWs}
              />
            ))}
          </div>
        )}
      </div>
      <button type="button" className="modal-backdrop" aria-label="Close spread charts" onClick={onClose} />
    </div>
  );
}
