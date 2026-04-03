"use client";

import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatIndianShort } from "@/utils/formatNumber";
import { monthLabelFromBarTime, type PnlMonthlyBarPoint } from "./reportChartData";

type Row = PnlMonthlyBarPoint & { label: string };

const axisTick = { fontSize: 11, fill: "var(--color-base-content)" };

/** Place value above positive bars and below negative bars */
function PnlBarValueLabel(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  value?: number;
}) {
  const x = props.x ?? 0;
  const y = props.y ?? 0;
  const w = props.width ?? 0;
  const h = props.height ?? 0;
  const value = Number(props.value ?? 0);
  const text = formatIndianShort(value);
  const midX = x + w / 2;
  const textY = value >= 0 ? y - 6 : y + h + 12;
  return (
    <text
      x={midX}
      y={textY}
      textAnchor="middle"
      fill="var(--color-base-content)"
      fontSize={10}
      fontWeight={500}
    >
      {text}
    </text>
  );
}

export function ReportsPnlMonthlyBarChart({ data }: { data: PnlMonthlyBarPoint[] }) {
  const chartData: Row[] = data.map((d) => ({
    ...d,
    label: monthLabelFromBarTime(d.time),
  }));

  return (
    <div className="h-64 w-full [&_.recharts-cartesian-axis-tick_text]:fill-base-content/70 [&_.recharts-cartesian-grid_line]:stroke-base-content/10 [&_.recharts-text]:text-xs">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 28, right: 12, left: 4, bottom: chartData.some((d) => d.value < 0) ? 18 : 8 }}>
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
            tickFormatter={(v) => formatIndianShort(Number(v))}
            width={48}
          />
          <Tooltip
            contentStyle={{
              background: "oklch(var(--b1) / 0.95)",
              border: "1px solid oklch(var(--bc) / 0.2)",
              borderRadius: "0.5rem",
            }}
            formatter={(value: number | string) => [formatIndianShort(Number(value)), "PnL change"]}
            labelFormatter={(_, payload) => {
              const row = payload?.[0]?.payload as Row | undefined;
              return row?.label ?? "";
            }}
          />
          <Bar dataKey="value" radius={[3, 3, 0, 0]} barSize={22} isAnimationActive={false}>
            <LabelList dataKey="value" content={PnlBarValueLabel} />
            {chartData.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.value >= 0 ? "var(--color-success)" : "var(--color-error)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
