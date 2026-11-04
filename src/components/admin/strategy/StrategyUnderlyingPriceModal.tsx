"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RotateCw, X } from "lucide-react";
import { authFetch } from "@/utils/api";

interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface ChartCandle extends Candle {
  /** Recharts range-bar body: [open, close]. */
  openClose: [number, number];
}

interface UnderlyingSeries {
  symbol: string;
  instrument_token: number | null;
  candles: Candle[];
  error: string | null;
}

type Props = {
  name: string;
  onClose: () => void;
} & (
  | { strategyId: number; builderId?: never }
  | { builderId: number; strategyId?: never }
);

const axisTick = { fontSize: 11, fill: "var(--color-base-content)" };
const UP = "#16a34a";
const DOWN = "#dc2626";

function formatAxisTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  });
}

function formatPrice(n: number): string {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function yDomain(values: number[]): [number, number] | ["auto", "auto"] {
  if (!values.length) return ["auto", "auto"];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    const pad = Math.max(Math.abs(min) * 0.001, 1);
    return [min - pad, max + pad];
  }
  const pad = (max - min) * 0.08;
  return [min - pad, max + pad];
}

function PriceTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload?: Candle }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const candle = payload[0]?.payload;
  if (!candle) return null;
  const up = candle.close >= candle.open;
  return (
    <div className="rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-xs text-base-content shadow-sm">
      <div className="mb-1 font-medium">
        {label ? formatAxisTime(String(label)) : ""}
      </div>
      <div className="space-y-0.5 tabular-nums">
        <div className="flex justify-between gap-4">
          <span className="text-base-content/70">Open</span>
          <span>{formatPrice(candle.open)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-base-content/70">High</span>
          <span>{formatPrice(candle.high)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-base-content/70">Low</span>
          <span>{formatPrice(candle.low)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-base-content/70">Close</span>
          <span className="font-medium" style={{ color: up ? UP : DOWN }}>
            {formatPrice(candle.close)}
          </span>
        </div>
      </div>
    </div>
  );
}

/** OHLC body + wick for a Recharts range Bar (`dataKey="openClose"`). */
function CandlestickShape(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  low?: number;
  high?: number;
  openClose?: [number, number];
  payload?: Candle;
}) {
  const x = props.x ?? 0;
  const y = props.y ?? 0;
  const width = props.width ?? 0;
  const height = Math.abs(props.height ?? 0);
  const open = props.openClose?.[0] ?? props.payload?.open ?? 0;
  const close = props.openClose?.[1] ?? props.payload?.close ?? 0;
  const high = props.high ?? props.payload?.high ?? Math.max(open, close);
  const low = props.low ?? props.payload?.low ?? Math.min(open, close);
  const up = close >= open;
  const color = up ? UP : DOWN;
  const bodyTop = Math.max(open, close);
  const bodyBottom = Math.min(open, close);
  const bodySpan = bodyTop - bodyBottom || 1e-9;
  const pxPerUnit = height / bodySpan;
  const wickTop = y - (high - bodyTop) * pxPerUnit;
  const wickBottom = y + height + (bodyBottom - low) * pxPerUnit;
  const cx = x + width / 2;
  const bodyW = Math.max(width * 0.55, 2);
  const bodyX = x + (width - bodyW) / 2;
  const bodyH = Math.max(height, 1);

  return (
    <g stroke={color} fill={color}>
      <line x1={cx} y1={wickTop} x2={cx} y2={wickBottom} strokeWidth={1} />
      <rect x={bodyX} y={y} width={bodyW} height={bodyH} strokeWidth={1} />
    </g>
  );
}

function UnderlyingChart({
  series,
  showCandle,
  showLine,
}: {
  series: UnderlyingSeries;
  showCandle: boolean;
  showLine: boolean;
}) {
  const chartData: ChartCandle[] = useMemo(
    () =>
      series.candles.map((c) => ({
        ...c,
        openClose: [c.open, c.close],
      })),
    [series.candles]
  );

  const domain = useMemo(() => {
    const vals: number[] = [];
    for (const c of series.candles) {
      if (showCandle) {
        vals.push(c.high, c.low);
      } else if (showLine) {
        vals.push(c.close);
      }
    }
    return yDomain(vals);
  }, [showCandle, showLine, series.candles]);

  return (
    <section className="rounded-lg border border-base-300/70 bg-base-100 p-3">
      <h4 className="text-sm font-semibold mb-2">{series.symbol}</h4>
      {series.error && series.candles.length === 0 ? (
        <p className="text-sm text-error/90 py-8 text-center">{series.error}</p>
      ) : series.candles.length === 0 ? (
        <p className="text-sm text-base-content/55 py-8 text-center">
          No price candles in this window.
        </p>
      ) : (
        <div className="h-52 w-full [&_.recharts-cartesian-axis-tick_text]:fill-base-content/70 [&_.recharts-cartesian-grid_line]:stroke-base-content/10">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 8, right: 12, left: 0, bottom: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--color-base-300)"
              />
              <XAxis
                dataKey="date"
                tick={axisTick}
                tickFormatter={(v) => formatAxisTime(String(v))}
                minTickGap={28}
              />
              <YAxis
                tick={axisTick}
                tickFormatter={(v) => formatPrice(Number(v))}
                width={72}
                domain={domain}
                allowDataOverflow={false}
              />
              <Tooltip
                cursor={{ stroke: "var(--color-base-content)", strokeOpacity: 0.25 }}
                content={<PriceTooltip />}
              />
              {showCandle && (
                <Bar
                  dataKey="openClose"
                  name="Candle"
                  isAnimationActive={false}
                  shape={(barProps) => <CandlestickShape {...barProps} />}
                />
              )}
              {showLine && (
                <Line
                  type="monotone"
                  dataKey="close"
                  name="Close"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

export default function StrategyUnderlyingPriceModal({
  name,
  onClose,
  ...idProps
}: Props) {
  const [series, setSeries] = useState<UnderlyingSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCandle, setShowCandle] = useState(true);
  const [showLine, setShowLine] = useState(false);

  const pricesPath =
    "strategyId" in idProps
      ? `myadmin/strategies/${idProps.strategyId}/underlying-prices/`
      : `builder/builders/${idProps.builderId}/underlying-prices/`;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(pricesPath);
      if (res.status === 503) {
        const body = await res.json().catch(() => ({}));
        setError(
          typeof body?.detail === "string"
            ? body.detail
            : "Market Kite session unavailable."
        );
        setSeries([]);
        return;
      }
      if (!res.ok) {
        setError("Failed to load underlying prices.");
        setSeries([]);
        return;
      }
      const data = await res.json();
      setSeries(Array.isArray(data?.underlyings) ? data.underlyings : []);
    } catch {
      setError("Error loading underlying prices.");
      setSeries([]);
    } finally {
      setLoading(false);
    }
  }, [pricesPath]);

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
      aria-labelledby="strategy-underlying-price-title"
    >
      <div className="modal-box w-11/12 max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3
              id="strategy-underlying-price-title"
              className="text-lg font-semibold truncate"
            >
              Underlying price — {name}
            </h3>
            <p className="text-xs text-base-content/55 mt-0.5">
              Last 30 minutes, 1-minute
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <label className="label cursor-pointer gap-1.5 py-0">
              <input
                type="checkbox"
                className="checkbox checkbox-xs"
                checked={showCandle}
                onChange={(e) => {
                  const next = e.target.checked;
                  if (!next && !showLine) return;
                  setShowCandle(next);
                }}
              />
              <span className="label-text text-xs">Candle</span>
            </label>
            <label className="label cursor-pointer gap-1.5 py-0">
              <input
                type="checkbox"
                className="checkbox checkbox-xs"
                checked={showLine}
                onChange={(e) => {
                  const next = e.target.checked;
                  if (!next && !showCandle) return;
                  setShowLine(next);
                }}
              />
              <span className="label-text text-xs">Line</span>
            </label>
            <button
              type="button"
              onClick={() => void load()}
              className={`btn btn-ghost btn-sm btn-square ${loading ? "animate-spin" : ""}`}
              title="Refresh"
              disabled={loading}
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
        </div>

        {error && <p className="text-sm text-error mb-3">{error}</p>}

        {loading && !series.length ? (
          <div className="rounded-lg border border-base-300/70 bg-base-200/40 p-8 text-sm text-base-content/60">
            Loading prices…
          </div>
        ) : !series.length && !error ? (
          <div className="rounded-lg border border-base-300/70 bg-base-200/40 p-8 text-sm text-base-content/60">
            No underlyings on this strategy.
          </div>
        ) : series.length > 0 ? (
          <div className="space-y-4">
            {series.map((row) => (
              <UnderlyingChart
                key={row.symbol}
                series={row}
                showCandle={showCandle}
                showLine={showLine}
              />
            ))}
          </div>
        ) : null}
      </div>
      <button
        type="button"
        className="modal-backdrop"
        aria-label="Close underlying price chart"
        onClick={onClose}
      />
    </div>
  );
}
