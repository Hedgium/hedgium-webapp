"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Globe, RefreshCw } from "lucide-react";
import { fetchEngine1SitePages, fetchEngine1SiteTicket } from "@/services/engine1";
import type { Engine1SitePage, Engine1SiteTicket } from "@/types/engine1";

const START_PAGE = "parameters.html";
const PORTFOLIO_PAGE = "model_portfolios.html";
const RISKS = ["low", "medium", "high"] as const;
const HORIZONS = ["short", "medium", "long"] as const;
const LABEL: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  short: "Short",
  long: "Long",
};
// Renew the ticket when less than this is left, so a page picked late in a
// session does not open on an expired link.
const RENEW_MS = 60 * 60 * 1000;

const benchFile = (risk: string, horizon: string) => `weight_bench_${risk}_${horizon}.html`;

function pageLabel(file: string): string {
  if (file === START_PAGE) return "Parameters";
  if (file === PORTFOLIO_PAGE) return "Model portfolios";
  const m = /^weight_bench_(\w+?)_(\w+)\.html$/.exec(file);
  if (m) return `Bench: ${LABEL[m[1]] ?? m[1]} risk, ${LABEL[m[2]] ?? m[2]} horizon`;
  return file.replace(/\.html$/, "").replace(/_/g, " ");
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "–";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Engine1SitePageView() {
  const [pages, setPages] = useState<Engine1SitePage[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [current, setCurrent] = useState<string | null>(null);
  const ticketRef = useRef<Engine1SiteTicket | null>(null);
  const frameRef = useRef<HTMLIFrameElement | null>(null);

  const getTicket = useCallback(async (force = false) => {
    const t = ticketRef.current;
    if (!force && t && new Date(t.expires_at).getTime() - Date.now() > RENEW_MS) {
      return t.ticket;
    }
    const fresh = await fetchEngine1SiteTicket();
    ticketRef.current = fresh;
    return fresh.ticket;
  }, []);

  const open = useCallback(
    async (file: string, force = false) => {
      try {
        const ticket = await getTicket(force);
        setSrc(`/admin-site/${encodeURIComponent(ticket)}/${file}`);
        setCurrent(file);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to open the page");
      }
    },
    [getTicket]
  );

  const load = useCallback(async () => {
    setError(null);
    try {
      const list = await fetchEngine1SitePages();
      setPages(list);
      if (list.length) {
        const first = list.find((p) => p.filename === START_PAGE) ?? list[0];
        await open(first.filename, true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load the Engine 1 site");
      setPages([]);
    }
  }, [open]);

  useEffect(() => {
    void load();
  }, [load]);

  // Links clicked inside a page navigate the frame itself; read where it went
  // (same origin) so the picker follows.
  const onFrameLoad = () => {
    try {
      const path = frameRef.current?.contentWindow?.location.pathname ?? "";
      const file = path.split("/").pop();
      if (file && /^[a-z0-9_]+\.html$/.test(file)) setCurrent(file);
    } catch {
      /* cross-origin (should not happen) -- leave the picker as it is */
    }
  };

  const openInNewTab = () => {
    let href = src;
    try {
      const loc = frameRef.current?.contentWindow?.location;
      if (loc && loc.pathname.startsWith("/admin-site/")) href = loc.pathname + loc.search + loc.hash;
    } catch {
      /* use the last picked page */
    }
    if (href) window.open(href, "_blank", "noopener");
  };

  const byName = useMemo(() => new Map((pages ?? []).map((p) => [p.filename, p])), [pages]);
  const others = useMemo(
    () =>
      (pages ?? []).filter(
        (p) =>
          p.filename !== START_PAGE &&
          p.filename !== PORTFOLIO_PAGE &&
          !/^weight_bench_(low|medium|high)_(short|medium|long)\.html$/.test(p.filename)
      ),
    [pages]
  );
  const hasBenches = RISKS.some((r) => HORIZONS.some((h) => byName.has(benchFile(r, h))));
  const shown = current ? byName.get(current) : undefined;

  const pickBtn = (file: string, label: string, hint?: string) => {
    const active = current === file;
    return (
      <button
        key={file}
        type="button"
        onClick={() => void open(file)}
        aria-current={active ? "page" : undefined}
        className={`btn btn-sm justify-start ${active ? "btn-primary" : "btn-ghost border border-base-300"}`}
      >
        {label}
        {hint ? <span className="text-xs opacity-70">{hint}</span> : null}
      </button>
    );
  };

  return (
    <div className="flex h-[calc(100vh-1rem)] flex-col gap-3 p-4 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Globe className="size-7 text-primary" />
          <div>
            <h1 className="text-xl font-bold">Engine 1 fund site</h1>
            <p className="text-sm text-base-content/70">
              {shown
                ? `${pageLabel(shown.filename)} · built ${fmtDate(shown.published_at)} · uploaded ${fmtDate(shown.uploaded_at)}`
                : "The published Model Portfolio, MF Score Benches and Parameters pages."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/engine1" className="btn btn-sm btn-ghost">
            <ArrowLeft className="size-4" /> Allocation
          </Link>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => void load()}>
            <RefreshCw className="size-4" /> Reload list
          </button>
          <button type="button" className="btn btn-sm" onClick={openInNewTab} disabled={!src}>
            <ExternalLink className="size-4" /> Open in new tab
          </button>
        </div>
      </div>

      {error ? (
        <div role="alert" className="alert alert-error text-sm">
          {error}
        </div>
      ) : null}

      {pages === null ? (
        <div className="rounded-lg border border-base-300 bg-base-100 p-12 text-center text-base-content/60">
          Loading the site...
        </div>
      ) : pages.length === 0 && !error ? (
        <div className="rounded-lg border border-base-300 bg-base-100 p-12 text-center text-base-content/70">
          <p className="font-medium">No pages uploaded yet.</p>
          <p className="mt-1 text-sm">
            On the Engine 1 server run <code className="font-mono">python run_platform.py upload-site --prune</code>.
            After that, every <code className="font-mono">publish</code> and <code className="font-mono">daily</code> run
            uploads the pages itself.
          </p>
        </div>
      ) : pages.length ? (
        <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
          <nav aria-label="Site pages" className="flex shrink-0 flex-col gap-3 lg:w-64">
            <div className="flex flex-col gap-1">
              {byName.has(START_PAGE) && pickBtn(START_PAGE, "Parameters", "· start here")}
              {byName.has(PORTFOLIO_PAGE) && pickBtn(PORTFOLIO_PAGE, "Model portfolios")}
            </div>
            {hasBenches ? (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-base-content/60">
                  MF Score Benches
                </p>
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="p-1 text-left font-normal text-base-content/60">Risk \ horizon</th>
                      {HORIZONS.map((h) => (
                        <th key={h} className="p-1 font-normal text-base-content/60">
                          {LABEL[h]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {RISKS.map((r) => (
                      <tr key={r}>
                        <th className="p-1 text-left font-normal">{LABEL[r]}</th>
                        {HORIZONS.map((h) => {
                          const f = benchFile(r, h);
                          const active = current === f;
                          return (
                            <td key={h} className="p-0.5">
                              <button
                                type="button"
                                disabled={!byName.has(f)}
                                onClick={() => void open(f)}
                                aria-label={pageLabel(f)}
                                aria-current={active ? "page" : undefined}
                                className={`btn btn-xs w-full ${active ? "btn-primary" : "btn-ghost border border-base-300"}`}
                              >
                                {LABEL[r][0]}·{LABEL[h][0]}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
            {others.length ? (
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-base-content/60">Other pages</p>
                {others.map((p) => pickBtn(p.filename, pageLabel(p.filename)))}
              </div>
            ) : null}
          </nav>
          <div className="min-h-[60vh] flex-1 overflow-hidden rounded-lg border border-base-300 bg-white">
            {src ? (
              // No sandbox: these are Engine 1's own generated pages and need
              // scripts, same-origin localStorage and blob downloads (XLSX export).
              <iframe
                ref={frameRef}
                src={src}
                title="Engine 1 fund site"
                className="h-full w-full"
                onLoad={onFrameLoad}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
