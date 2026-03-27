"use client";

import React, { useRef, useEffect } from "react";
import {
  createChart,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  LineSeries,
} from "lightweight-charts";

export type ChartPeriod = "daily" | "weekly" | "monthly";

export type MarginSnapshot = {
  snapshot_date: string;
  net: number;
  available?: number;
  utilised?: number;
};

export type PnlChartPoint = { time: string; value: number };

function toChartColor(cssColor: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  if (!cssColor || cssColor === "rgba(0, 0, 0, 0)") return fallback;
  if (/^rgb(a?)\(/.test(cssColor) || /^#[0-9A-Fa-f]{3,8}$/.test(cssColor)) return cssColor;
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d");
  if (!ctx) return fallback;
  ctx.fillStyle = cssColor;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return `rgb(${r},${g},${b})`;
}

function resolveChartColor(expression: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const div = document.createElement("div");
  div.style.color = expression;
  div.style.display = "none";
  document.body.appendChild(div);
  const resolved = getComputedStyle(div).color;
  document.body.removeChild(div);
  return toChartColor(resolved || "", fallback);
}

function parseChartTime(time: string | number): Date {
  if (typeof time === "string") return new Date(time + "T12:00:00");
  return new Date(time * 1000);
}

/** Ensure data is strictly ascending by time with no duplicates (required by lightweight-charts). */
function normalizeChartData<T extends { time: string; value: number }>(
  items: T[],
  mergeDuplicates: (a: number, b: number) => number = (_, b) => b
): { time: string; value: number }[] {
  const byTime = new Map<string, number>();
  for (const d of items) {
    const t = d.time;
    const v = Number(d.value);
    byTime.set(t, byTime.has(t) ? mergeDuplicates(byTime.get(t)!, v) : v);
  }
  return Array.from(byTime.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([time, value]) => ({ time, value }));
}

function getTickMarkFormatter(period: ChartPeriod) {
  return (time: string | number, _tickMarkType: unknown, locale: string): string | null => {
    const d = parseChartTime(time);
    if (period === "daily") {
      return d.toLocaleDateString(locale, { day: "numeric", month: "short" });
    }
    if (period === "weekly") {
      return "W/c " + d.toLocaleDateString(locale, { day: "numeric", month: "short" });
    }
    return d.toLocaleDateString(locale, { month: "short", year: "numeric" });
  };
}

export function MarginLineChart({ data, period }: { data: MarginSnapshot[]; period: ChartPeriod }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const netSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const utilisedSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    const textColor = resolveChartColor("hsl(var(--bc) / 0.9)", "#374151");
    const gridColor = resolveChartColor("hsl(var(--bc) / 0.15)", "rgba(0,0,0,0.1)");
    const netColor = resolveChartColor("hsl(var(--p))", "#244061");
    const utilisedColor = resolveChartColor("hsl(var(--wa))", "#ea580c");

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      width: containerRef.current.clientWidth,
      height: 256,
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        timeVisible: false,
        secondsVisible: false,
        borderVisible: false,
        tickMarkFormatter: getTickMarkFormatter(period),
        tickMarkMaxCharacterLength: period === "monthly" ? 12 : period === "weekly" ? 10 : 8,
      },
      crosshair: {
        vertLine: { labelVisible: true },
        horzLine: { labelVisible: true },
      },
    });

    const netSeries = chart.addSeries(LineSeries, {
      color: netColor,
      lineWidth: 2,
      title: "Net",
    });
    const utilisedSeries = chart.addSeries(LineSeries, {
      color: utilisedColor,
      lineWidth: 2,
      title: "Utilised",
    });

    const netData = normalizeChartData(
      data.map((d) => ({ time: d.snapshot_date, value: Number(d.net) }))
    );
    const utilisedData = normalizeChartData(
      data.map((d) => ({ time: d.snapshot_date, value: Number(d.utilised ?? 0) }))
    );

    netSeries.setData(netData);
    utilisedSeries.setData(utilisedData);

    chart.timeScale().fitContent();

    chartRef.current = chart;
    netSeriesRef.current = netSeries;
    utilisedSeriesRef.current = utilisedSeries;

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        netSeriesRef.current = null;
        utilisedSeriesRef.current = null;
      }
    };
  }, [data, period]);

  if (data.length === 0) return null;

  return (
    <div className="w-full" ref={containerRef} style={{ minHeight: "256px" }} />
  );
}

export function PnlLineChart({ data, period }: { data: PnlChartPoint[]; period: ChartPeriod }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    const textColor = resolveChartColor("hsl(var(--bc) / 0.9)", "#374151");
    const gridColor = resolveChartColor("hsl(var(--bc) / 0.15)", "rgba(0,0,0,0.1)");
    const lastValue = data[data.length - 1]?.value ?? 0;
    const lineColor =
      lastValue >= 0
        ? resolveChartColor("hsl(var(--su))", "#22c55e")
        : resolveChartColor("hsl(var(--er))", "#ef4444");

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      width: containerRef.current.clientWidth,
      height: 256,
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        timeVisible: false,
        secondsVisible: false,
        borderVisible: false,
        tickMarkFormatter: getTickMarkFormatter(period),
        tickMarkMaxCharacterLength: period === "monthly" ? 12 : period === "weekly" ? 10 : 8,
      },
      crosshair: {
        vertLine: { labelVisible: true },
        horzLine: { labelVisible: true },
      },
    });

    const series = chart.addSeries(LineSeries, {
      color: lineColor,
      lineWidth: 2,
      title: "Cumulative PnL",
    });
    const chartData = normalizeChartData(
      data.map((d) => ({ time: d.time, value: d.value }))
    );
    series.setData(chartData);
    chart.timeScale().fitContent();

    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  }, [data, period]);

  if (data.length === 0) return null;

  return (
    <div className="w-full" ref={containerRef} style={{ minHeight: "256px" }} />
  );
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

type PnlSnapshotPoint = { snapshot_date: string; pnl_total: number };

export function aggregatePnlLevelSeries(
  data: PnlSnapshotPoint[],
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
