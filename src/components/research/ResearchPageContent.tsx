"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
import { LineChart, RefreshCw } from "lucide-react";
import { researchFetch } from "@/utils/api";
import type { ResearchReport } from "@/types/research";
import ResearchSymbolSearch from "@/components/research/ResearchSymbolSearch";
import ResearchReportView from "@/components/research/ResearchReportView";
import ResearchReportSkeleton from "@/components/research/ResearchReportSkeleton";
import ResearchSubNav, { isResearchSymbolPath } from "@/components/research/ResearchSubNav";

const RESEARCH_BASE = "/admin/research";

function symbolPath(ticker: string) {
  return `${RESEARCH_BASE}/${ticker.trim().toUpperCase()}`;
}

function parseUrlSymbol(pathname: string | null): string | null {
  if (!isResearchSymbolPath(pathname)) return null;
  const segment = pathname!.slice(`${RESEARCH_BASE}/`.length).split("/")[0];
  try {
    return decodeURIComponent(segment).trim().toUpperCase();
  } catch {
    return segment.trim().toUpperCase();
  }
}

export default function ResearchPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const urlSymbol = useMemo(() => parseUrlSymbol(pathname), [pathname]);

  const [inputSymbol, setInputSymbol] = useState(urlSymbol ?? "");
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    setInputSymbol(urlSymbol ?? "");
  }, [urlSymbol]);

  useEffect(() => {
    if (!urlSymbol) {
      setReport(null);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setReport(null);

    (async () => {
      try {
        const res = await researchFetch(urlSymbol, {
          latest: true,
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        if (res.status === 404) {
          setError("Symbol not found — try a NSE ticker from NIFTY 50.");
          return;
        }
        if (res.status === 403) {
          setError("Research is restricted to administrators.");
          return;
        }
        if (!res.ok) {
          setError(
            res.status >= 500
              ? "Research service unavailable. Check that hedgium_research is running."
              : "Failed to load research report."
          );
          return;
        }

        const data: ResearchReport = await res.json();
        if (controller.signal.aborted) return;

        setReport(data);
      } catch (err) {
        if (controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError("Research service unavailable. Please try again.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [urlSymbol, refreshToken]);

  function handleSearch(ticker: string) {
    const normalized = ticker.trim().toUpperCase();
    if (!normalized) return;

    const target = symbolPath(normalized);
    if (pathname === target) {
      if (!loading) {
        setRefreshToken((n) => n + 1);
      }
      return;
    }

    router.push(target);
  }

  function handleRetry() {
    if (!urlSymbol) return;
    setRefreshToken((n) => n + 1);
  }

  const showEmptyState = !urlSymbol && !loading && !report && !error;

  return (
    <div className="relative min-h-screen">
      <div className="relative mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-8 md:py-10">
        <section className="space-y-1">
          <div className="flex items-center gap-2">
            <LineChart className="h-5 w-5 text-primary shrink-0" aria-hidden />
            <h2 className="text-xl font-semibold tracking-tight text-base-content md:text-2xl">
              Stock research
            </h2>
          </div>
          <p className="max-w-xl text-sm text-base-content/55">
            ML outlook, risk assessment, and AI agent synthesis for NSE symbols.
          </p>
        </section>

        <ResearchSubNav />

        <ResearchSymbolSearch
          value={inputSymbol}
          onChange={setInputSymbol}
          onSearch={handleSearch}
          loading={loading}
        />

        {error ? (
          <div className="alert alert-error">
            <span>{error}</span>
            <button
              type="button"
              className="btn btn-sm btn-ghost gap-1"
              onClick={handleRetry}
              disabled={!urlSymbol || loading}
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              Retry
            </button>
          </div>
        ) : null}

        {loading ? (
          <ResearchReportSkeleton />
        ) : report ? (
          <ResearchReportView report={report} />
        ) : showEmptyState ? (
          <div className="rounded-xl border border-dashed border-base-300/70 bg-base-200/20 py-16 text-center">
            <LineChart className="mx-auto mb-3 h-12 w-12 text-base-content/25" aria-hidden />
            <p className="font-medium text-base-content">Search a symbol to begin</p>
            <p className="mt-1 text-sm text-base-content/55">
              Enter an NSE ticker or pick a quick symbol above.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
