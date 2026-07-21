"use client";

import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/utils/api";
import { formatMoneyIN } from "@/utils/formatNumber";
import { BarChart3 } from "lucide-react";

type OverallPnlResponse = {
  overall_pnl: number;
  strategy_count: number;
  trade_cycle_count: number;
};

type OverallPnlSummaryProps = {
  startDate: string;
  endDate: string;
  completed: string;
};

function signedClass(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "text-base-content/60";
  if (value > 0) return "text-success";
  if (value < 0) return "text-error";
  return "text-base-content/75";
}

function buildOverallPnlUrl(params: {
  startDate: string;
  endDate: string;
  completed: string;
}): string {
  const search = new URLSearchParams();
  if (params.startDate) search.set("start_date", params.startDate);
  if (params.endDate) search.set("end_date", params.endDate);
  if (params.completed) search.set("completed", params.completed);
  const qs = search.toString();
  return qs ? `myadmin/overall-pnl/?${qs}` : "myadmin/overall-pnl/";
}

export default function OverallPnlSummary({
  startDate,
  endDate,
  completed,
}: OverallPnlSummaryProps) {
  const [data, setData] = useState<OverallPnlResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverallPnl = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(
        buildOverallPnlUrl({ startDate, endDate, completed })
      );
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const json = (await res.json()) as OverallPnlResponse;
      setData(json);
    } catch (e) {
      console.error(e);
      setData(null);
      setError("Failed to load overall PnL");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, completed]);

  useEffect(() => {
    void fetchOverallPnl();
  }, [fetchOverallPnl]);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-base-300 bg-base-100 px-3 py-1.5">
      <BarChart3 className="h-4 w-4 shrink-0 text-primary" aria-hidden />
      <span className="text-xs font-medium text-base-content/50 shrink-0">
        Overall E2 PnL
      </span>
      {loading && !data ? (
        <span className="loading loading-spinner loading-xs text-primary" />
      ) : error ? (
        <span className="text-sm text-error">{error}</span>
      ) : (
        <>
          <span
            className={`text-base font-semibold tabular-nums ${signedClass(data?.overall_pnl)} ${loading ? "opacity-60" : ""}`}
          >
            {formatMoneyIN(data?.overall_pnl ?? 0)}
          </span>
          <span className="text-[11px] text-base-content/50 whitespace-nowrap">
            {data?.strategy_count ?? 0} strategies ·{" "}
            {data?.trade_cycle_count ?? 0} cycles
          </span>
        </>
      )}
    </div>
  );
}
