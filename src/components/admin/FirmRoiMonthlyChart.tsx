"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoneyIN } from "@/utils/formatNumber";
import {
  ReportsChartTooltipFrame,
  ReportsChartTooltipRow,
  chartTooltipWrapperStyle,
} from "@/components/reports/ReportsChartTooltip";

export type FirmRoiMonthPoint = {
  month: string;
  label: string;
  e1_return: number | null;
  e1_pct: number | null;
  e2_return: number | null;
  e2_pct: number | null;
  total_pct: number | null;
  e1_accounts: number;
  e2_accounts: number;
};

type Row = FirmRoiMonthPoint & {
  e1: number;
  e2: number;
  total: number;
};

const axisTick = { fontSize: 11, fill: "var(--color-base-content)" };

/** Distinct DaisyUI semantic colors (same pattern as margin / spread charts). */
const E1_FILL = "var(--color-primary)";
const E2_FILL = "var(--color-warning)";
const TOTAL_FILL = "var(--color-success)";

function formatPct(pct: number | null | undefined): string {
  if (pct == null || Number.isNaN(pct)) return "—";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

function formatAmt(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return formatMoneyIN(value);
}

function signedTone(value: number | null | undefined): "success" | "error" | undefined {
  if (value == null || Number.isNaN(value) || value === 0) return undefined;
  return value > 0 ? "success" : "error";
}

function FirmMonthTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: Row }>;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <ReportsChartTooltipFrame label={row.label}>
      <ReportsChartTooltipRow
        label="E1"
        value={`${formatAmt(row.e1_return)} · ${formatPct(row.e1_pct)}`}
        tone={signedTone(row.e1_return ?? row.e1_pct)}
      />
      <ReportsChartTooltipRow
        label="E2"
        value={`${formatAmt(row.e2_return)} · ${formatPct(row.e2_pct)}`}
        tone={signedTone(row.e2_return ?? row.e2_pct)}
      />
      <ReportsChartTooltipRow
        label="Combined"
        value={formatPct(row.total_pct)}
        tone={signedTone(row.total_pct)}
      />
      <ReportsChartTooltipRow
        label="Accounts"
        value={`E1 ${row.e1_accounts} / E2 ${row.e2_accounts}`}
        tone="muted"
      />
    </ReportsChartTooltipFrame>
  );
}

export default function FirmRoiMonthlyChart({ data }: { data: FirmRoiMonthPoint[] }) {
  const chartData: Row[] = data.map((d) => ({
    ...d,
    e1: d.e1_pct ?? 0,
    e2: d.e2_pct ?? 0,
    total: d.total_pct ?? 0,
  }));

  if (chartData.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-base-content/55">
        No monthly firm ROI yet.
      </p>
    );
  }

  const hasNeg = chartData.some((d) => d.e1 < 0 || d.e2 < 0 || d.total < 0);

  return (
    <div className="h-72 w-full [&_.recharts-cartesian-axis-tick_text]:fill-base-content/70 [&_.recharts-cartesian-grid_line]:stroke-base-content/10 [&_.recharts-text]:text-xs [&_.recharts-legend-item-text]:text-base-content/80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 12, left: 4, bottom: hasNeg ? 18 : 8 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="var(--color-base-300)"
          />
          <XAxis
            dataKey="label"
            tick={axisTick}
            interval={0}
            angle={-25}
            textAnchor="end"
            height={48}
          />
          <YAxis
            tick={axisTick}
            tickFormatter={(v) => `${Number(v).toFixed(1)}%`}
            width={52}
          />
          <Tooltip
            cursor={{ fill: "var(--color-base-content)", fillOpacity: 0.06 }}
            wrapperStyle={chartTooltipWrapperStyle}
            content={<FirmMonthTooltip />}
          />
          <Legend
            verticalAlign="top"
            height={28}
            formatter={(value) => (
              <span className="text-xs text-base-content/80">{value}</span>
            )}
          />
          <Bar
            name="E1"
            dataKey="e1"
            fill={E1_FILL}
            radius={[2, 2, 0, 0]}
            barSize={14}
            isAnimationActive={false}
          />
          <Bar
            name="E2"
            dataKey="e2"
            fill={E2_FILL}
            radius={[2, 2, 0, 0]}
            barSize={14}
            isAnimationActive={false}
          />
          <Bar
            name="Combined"
            dataKey="total"
            fill={TOTAL_FILL}
            radius={[2, 2, 0, 0]}
            barSize={14}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
