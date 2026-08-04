"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { authFetch } from "@/utils/api";

export type ResearchReportHtmlModalProps = {
  symbols: string[];
  initialSymbol?: string;
  /** Optional preloaded HTML (e.g. Market tab already has the row). */
  htmlBySymbol?: Record<string, string>;
  onClose: () => void;
};

function normalizeSymbol(symbol: string): string {
  return (symbol || "").trim().toUpperCase();
}

export default function ResearchReportHtmlModal({
  symbols,
  initialSymbol,
  htmlBySymbol,
  onClose,
}: ResearchReportHtmlModalProps) {
  const normalizedSymbols = Array.from(
    new Set(symbols.map(normalizeSymbol).filter(Boolean))
  ).sort();

  const [activeSymbol, setActiveSymbol] = useState(() => {
    const initial = normalizeSymbol(initialSymbol || "");
    if (initial && normalizedSymbols.includes(initial)) return initial;
    return normalizedSymbols[0] || "";
  });
  const [cache, setCache] = useState<Record<string, string>>(() => {
    const seed: Record<string, string> = {};
    if (htmlBySymbol) {
      for (const [k, v] of Object.entries(htmlBySymbol)) {
        const sym = normalizeSymbol(k);
        if (sym && typeof v === "string") seed[sym] = v;
      }
    }
    return seed;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const html = activeSymbol ? cache[activeSymbol] : undefined;

  useEffect(() => {
    if (!activeSymbol) return;
    if (cache[activeSymbol] != null) {
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const res = await authFetch(
          `market/research-reports/lookup/?symbol=${encodeURIComponent(activeSymbol)}`
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(
            (err as { detail?: string }).detail || "Failed to load research report"
          );
        }
        const data = (await res.json()) as { report_html?: string };
        if (cancelled) return;
        setCache((prev) => ({ ...prev, [activeSymbol]: data.report_html ?? "" }));
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load research report");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Intentionally omit `cache` — we only fetch when activeSymbol changes or
    // when that symbol is missing from cache (checked above).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cache read is a guard only
  }, [activeSymbol]);

  if (normalizedSymbols.length === 0) {
    return null;
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box w-screen h-screen max-w-none max-h-none rounded-none flex flex-col p-0 overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-base-300 shrink-0">
          <div className="min-w-0">
            <h3 className="font-bold text-lg truncate">
              Research report
              {activeSymbol ? (
                <span className="text-base-content/60 font-medium"> — {activeSymbol}</span>
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

        {normalizedSymbols.length > 1 && (
          <div className="tabs tabs-boxed tabs-sm m-3 mb-0 shrink-0 self-start">
            {normalizedSymbols.map((sym) => (
              <button
                key={sym}
                type="button"
                role="tab"
                className={`tab ${activeSymbol === sym ? "tab-active" : ""}`}
                onClick={() => setActiveSymbol(sym)}
              >
                {sym}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 min-h-0 p-3">
          {loading && html == null ? (
            <div className="flex h-full items-center justify-center text-base-content/60 gap-2">
              <span className="loading loading-spinner loading-sm" />
              Loading report…
            </div>
          ) : error && html == null ? (
            <div className="flex h-full items-center justify-center text-error text-sm px-4 text-center">
              {error}
            </div>
          ) : (
            <iframe
              title={`Research report ${activeSymbol}`}
              className="w-full h-full rounded-lg border border-base-300 bg-white"
              sandbox="allow-same-origin"
              srcDoc={html ?? "<p></p>"}
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
