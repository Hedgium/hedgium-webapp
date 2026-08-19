"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { authFetch } from "@/utils/api";

type StrategyDailyReportData = {
  id: number;
  report_date: string;
  full_report_html: string | null;
  active_report_html: string | null;
  updated_at: string;
};

export type StrategyDailyReportModalProps = {
  onClose: () => void;
};

export default function StrategyDailyReportModal({
  onClose,
}: StrategyDailyReportModalProps) {
  const [data, setData] = useState<StrategyDailyReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"active" | "full">("active");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await authFetch("internal/strategy-reports/");
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(
            (err as { detail?: string }).detail || `Failed (${res.status})`
          );
        }
        const json = (await res.json()) as StrategyDailyReportData;
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load report");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const html =
    tab === "active" ? data?.active_report_html : data?.full_report_html;

  return (
    <div className="modal modal-open">
      <div className="modal-box w-screen h-screen max-w-none max-h-none rounded-none flex flex-col p-0 overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-base-300 shrink-0">
          <div className="min-w-0">
            <h3 className="font-bold text-lg truncate">
              Strategy Daily Report
              {data?.report_date ? (
                <span className="text-base-content/60 font-medium">
                  {" "}
                  — {data.report_date}
                </span>
              ) : null}
            </h3>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-square"
            aria-label="Close"
            onClick={onClose}
          >
            <X className="size-4" />
          </button>
        </div>

        {data && (
          <div className="tabs tabs-boxed tabs-sm m-3 mb-0 shrink-0 self-start">
            <button
              type="button"
              role="tab"
              className={`tab ${tab === "active" ? "tab-active" : ""}`}
              onClick={() => setTab("active")}
            >
              Active Report
            </button>
            <button
              type="button"
              role="tab"
              className={`tab ${tab === "full" ? "tab-active" : ""}`}
              onClick={() => setTab("full")}
            >
              Full Report
            </button>
          </div>
        )}

        <div className="flex-1 min-h-0 p-3">
          {loading ? (
            <div className="flex h-full items-center justify-center text-base-content/60 gap-2">
              <span className="loading loading-spinner loading-sm" />
              Loading report…
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center text-error text-sm px-4 text-center">
              {error}
            </div>
          ) : (
            <iframe
              title={`Strategy ${tab} report`}
              className="w-full h-full rounded-lg border border-base-300 bg-white"
              sandbox="allow-same-origin"
              srcDoc={html ?? "<p>No content</p>"}
            />
          )}
        </div>
      </div>
      <button
        type="button"
        className="modal-backdrop bg-black/50"
        aria-label="Close"
        onClick={onClose}
      />
    </div>
  );
}
