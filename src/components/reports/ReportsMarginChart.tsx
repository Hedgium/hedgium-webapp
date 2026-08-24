"use client";

import React from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatIndianShort } from "@/utils/formatNumber";
import type { ChartPeriod, MarginSnapshot } from "./reportChartData";

type Row = { snapshot_date: string; net: number; utilised: number };

const axisTick = { fontSize: 11, fill: "var(--color-base-content)" };

function formatXAxis(period: ChartPeriod, value: string) {
  const d = new Date(value + "T12:00:00");
  if (period === "daily") {
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  }
  if (period === "weekly") {
    return "W/c " + d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  }
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

export function ReportsMarginChart({
  data,
  period,
}: {
  data: MarginSnapshot[];
  period: ChartPeriod;
}) {
  const chartData: Row[] = data.map((d) => ({
    snapshot_date: d.snapshot_date,
    net: Number(d.net),
    utilised: Number(d.utilised ?? 0),
  }));

  return (
    <div className="h-64 w-full [&_.recharts-cartesian-axis-tick_text]:fill-base-content/70 [&_.recharts-cartesian-grid_line]:stroke-base-content/10 [&_.recharts-legend-item-text]:text-base-content/80 [&_.recharts-text]:text-xs">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="var(--color-base-300)"
          />
          <XAxis
            dataKey="snapshot_date"
            tick={axisTick}
            tickFormatter={(v) => formatXAxis(period, String(v))}
            minTickGap={24}
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
            labelFormatter={(label) =>
              new Date(String(label) + "T12:00:00").toLocaleDateString(undefined, {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            }
            formatter={(value: number | string, name: string) => [
              formatIndianShort(Number(value)),
              name === "net" ? "Net" : "Utilised",
            ]}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="net"
            name="Net"
            stroke="var(--color-primary)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--color-primary)", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="utilised"
            name="Utilised"
            stroke="var(--color-warning)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--color-warning)", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
