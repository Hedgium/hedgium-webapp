"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { authFetch } from "@/utils/api";
import { formatMoneyIN } from "@/utils/formatNumber";
import useAlert from "@/hooks/useAlert";
import { Profile } from "@/types/profile";
import { LiveHolding } from "@/types/positions";
import { IndianRupee, RefreshCw, Search } from "lucide-react";

type PnlSummary = {
  month: string;
  quarter: string;
  pnl: number;
  quarter_pnl: number;
  ytd_pnl: number;
};

type LiveMargin = {
  available_total: number;
  utilised_total: number;
  net: number;
};

type ClientPnlRow = {
  profileId: number;
  clientId: string;
  userEmail: string;
  brokerName: string;
  brokerLoggedIn: boolean;
  status: "idle" | "loading" | "done" | "error";
  error?: string;
  engine1Total: number | null;
  engine1Pnl: number | null;
  engine2: PnlSummary | null;
  margin: LiveMargin | null;
};

const FETCH_CONCURRENCY = 4;

function signedClass(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "text-base-content/60";
  if (value > 0) return "text-success font-medium tabular-nums";
  if (value < 0) return "text-error font-medium tabular-nums";
  return "text-base-content/75 tabular-nums";
}

function formatCell(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return formatMoneyIN(value);
}

function formatTotalCell(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return formatMoneyIN(value, { decimals: 0, minDecimals: 0 });
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const i = nextIndex++;
      results[i] = await fn(items[i], i);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

function sumHoldingsMetrics(holdings: LiveHolding[]): {
  engine1Total: number;
  engine1Pnl: number;
} {
  return {
    engine1Total: holdings.reduce((sum, h) => sum + (h.current_value ?? 0), 0),
    engine1Pnl: holdings.reduce((sum, h) => sum + (h.pnl ?? 0), 0),
  };
}

async function fetchRowMetrics(
  profile: Profile
): Promise<Pick<ClientPnlRow, "engine1Total" | "engine1Pnl" | "engine2" | "margin" | "error">> {
  const brokerLoggedIn = profile.broker_logged_in;

  const [holdingsRes, pnlRes, marginRes] = await Promise.allSettled([
    brokerLoggedIn
      ? authFetch(`positions/live/holdings/${profile.id}/`)
      : Promise.resolve(null),
    authFetch(`positions/pnl/summary/${profile.id}/`),
    authFetch(`profiles/live/margin/${profile.id}/`),
  ]);

  let engine1Total: number | null = null;
  let engine1Pnl: number | null = null;
  let engine2: PnlSummary | null = null;
  let margin: LiveMargin | null = null;
  const errors: string[] = [];

  if (brokerLoggedIn) {
    if (holdingsRes.status === "fulfilled" && holdingsRes.value?.ok) {
      const holdingsData = await holdingsRes.value.json();
      if (holdingsData.status === "success") {
        const holdings: LiveHolding[] = Array.isArray(holdingsData.data) ? holdingsData.data : [];
        const e1 = sumHoldingsMetrics(holdings);
        engine1Total = e1.engine1Total;
        engine1Pnl = e1.engine1Pnl;
      } else {
        errors.push("holdings");
      }
    } else {
      errors.push("holdings");
    }
  }

  if (pnlRes.status === "fulfilled" && pnlRes.value.ok) {
    engine2 = (await pnlRes.value.json()) as PnlSummary;
  } else {
    errors.push("engine 2");
  }

  if (marginRes.status === "fulfilled" && marginRes.value.ok) {
    const marginData = await marginRes.value.json();
    if (marginData.status === "success") {
      margin = {
        available_total: marginData.available_total,
        utilised_total: marginData.utilised_total,
        net: marginData.net,
      };
    } else {
      errors.push("margin");
    }
  } else {
    errors.push("margin");
  }

  return {
    engine1Total,
    engine1Pnl,
    engine2,
    margin,
    error: errors.length > 0 ? `Failed: ${errors.join(", ")}` : undefined,
  };
}

type ClientPnlTotals = {
  engine1Total: number;
  engine1Pnl: number;
  e2Ytd: number;
  e2Quarter: number;
  e2Month: number;
  availableMargin: number;
  utilisedMargin: number;
  clientsIncluded: number;
};

function computeTotals(rows: ClientPnlRow[]): ClientPnlTotals {
  const totals: ClientPnlTotals = {
    engine1Total: 0,
    engine1Pnl: 0,
    e2Ytd: 0,
    e2Quarter: 0,
    e2Month: 0,
    availableMargin: 0,
    utilisedMargin: 0,
    clientsIncluded: 0,
  };

  for (const row of rows) {
    if (row.status === "loading") continue;

    let included = false;
    if (row.engine1Total != null) {
      totals.engine1Total += row.engine1Total;
      included = true;
    }
    if (row.engine1Pnl != null) {
      totals.engine1Pnl += row.engine1Pnl;
      included = true;
    }
    if (row.engine2?.ytd_pnl != null) {
      totals.e2Ytd += row.engine2.ytd_pnl;
      included = true;
    }
    if (row.engine2?.quarter_pnl != null) {
      totals.e2Quarter += row.engine2.quarter_pnl;
      included = true;
    }
    if (row.engine2?.pnl != null) {
      totals.e2Month += row.engine2.pnl;
      included = true;
    }
    if (row.margin?.available_total != null) {
      totals.availableMargin += row.margin.available_total;
      included = true;
    }
    if (row.margin?.utilised_total != null) {
      totals.utilisedMargin += row.margin.utilised_total;
      included = true;
    }
    if (included) totals.clientsIncluded += 1;
  }

  return totals;
}

function profileToRow(profile: Profile, partial?: Partial<ClientPnlRow>): ClientPnlRow {
  return {
    profileId: profile.id,
    clientId: profile.broker_user_id || "—",
    userEmail: profile.user?.email ?? "—",
    brokerName: profile.broker_name,
    brokerLoggedIn: profile.broker_logged_in,
    status: "idle",
    engine1Total: null,
    engine1Pnl: null,
    engine2: null,
    margin: null,
    ...partial,
  };
}

export default function AdminClientPnlPage() {
  const alert = useAlert();
  const alertRef = useRef(alert);
  alertRef.current = alert;

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [rows, setRows] = useState<ClientPnlRow[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [refreshingAll, setRefreshingAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [engine2Period, setEngine2Period] = useState<{ month: string; quarter: string } | null>(
    null
  );
  const refreshGen = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const refreshRows = useCallback(async (profileList: Profile[]) => {
    if (profileList.length === 0) return;

    const gen = ++refreshGen.current;
    setRefreshingAll(true);

    setRows((prev) =>
      prev.map((r) =>
        profileList.some((p) => p.id === r.profileId)
          ? { ...r, status: "loading" as const, error: undefined }
          : r
      )
    );

    await mapWithConcurrency(profileList, FETCH_CONCURRENCY, async (profile) => {
      const metrics = await fetchRowMetrics(profile);
      if (refreshGen.current !== gen) return;

      setRows((prev) =>
        prev.map((r) =>
          r.profileId === profile.id
            ? {
                ...r,
                status: metrics.error ? "error" : "done",
                error: metrics.error,
                engine1Total: metrics.engine1Total,
                engine1Pnl: metrics.engine1Pnl,
                engine2: metrics.engine2,
                margin: metrics.margin,
              }
            : r
        )
      );

      if (metrics.engine2?.month && metrics.engine2?.quarter) {
        setEngine2Period((prev) =>
          prev ?? { month: metrics.engine2!.month, quarter: metrics.engine2!.quarter }
        );
      }
    });

    if (refreshGen.current === gen) {
      setRefreshingAll(false);
    }
  }, []);

  const loadProfilesAndMetrics = useCallback(async () => {
    setLoadingProfiles(true);
    setEngine2Period(null);
    try {
      const params = new URLSearchParams();
      params.set("page_size", "200");
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await authFetch(`profiles/?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load profiles");
      const data = await res.json();
      const list: Profile[] = (data.results || []).filter((p: Profile) => p.is_active);
      setProfiles(list);
      setRows(list.map((p) => profileToRow(p)));
      setLoadingProfiles(false);
      await refreshRows(list);
    } catch (e) {
      console.error(e);
      alertRef.current.error("Failed to load profiles");
      setProfiles([]);
      setRows([]);
      setLoadingProfiles(false);
    }
  }, [debouncedSearch, refreshRows]);

  useEffect(() => {
    void loadProfilesAndMetrics();
  }, [loadProfilesAndMetrics]);

  const handleRefreshAll = () => {
    void refreshRows(profiles);
  };

  const handleRefreshRow = async (profileId: number) => {
    const profile = profiles.find((p) => p.id === profileId);
    if (!profile) return;
    await refreshRows([profile]);
  };

  const anyLoading = rows.some((r) => r.status === "loading");
  const totals = useMemo(() => computeTotals(rows), [rows]);
  const showTotals = !loadingProfiles && rows.length > 0;

  return (
    <div className="mx-auto max-w-[1600px] p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <IndianRupee className="h-6 w-6 text-primary" aria-hidden />
            <h1 className="text-2xl font-bold">Client PnL</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="input input-bordered input-sm flex w-full items-center gap-2 sm:w-64">
            <Search className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
            <input
              type="search"
              className="min-w-0 grow"
              placeholder="Search client / email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="btn btn-primary btn-sm gap-2"
            onClick={() => void handleRefreshAll()}
            disabled={refreshingAll || loadingProfiles || profiles.length === 0}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshingAll || anyLoading ? "animate-spin" : ""}`}
              aria-hidden
            />
            Refresh all
          </button>
        </div>
      </div>


      <div className="overflow-x-auto rounded-xl border border-base-300 bg-base-100 shadow-sm">
        <table className="table table-zebra table-sm md:table-md">
          <thead>
            {showTotals ? (
              <tr className="border-b border-primary/25 bg-primary/5 text-sm normal-case">
                <th className="min-w-[12rem] text-left align-middle font-semibold text-base-content">
                  <span>All clients total</span>
                  <span className="mt-0.5 block text-[10px] font-normal text-base-content/50">
                    {anyLoading
                      ? `Updating… (${totals.clientsIncluded} of ${rows.length})`
                      : `${totals.clientsIncluded} of ${rows.length} clients`}
                    {engine2Period
                      ? ` · E2 ${engine2Period.month} / ${engine2Period.quarter}`
                      : null}
                  </span>
                </th>
                <th className="text-right align-middle tabular-nums font-semibold text-base-content">
                  {anyLoading && totals.clientsIncluded === 0 ? "…" : formatTotalCell(totals.engine1Total)}
                </th>
                <th className={`text-right align-middle tabular-nums font-semibold ${signedClass(totals.engine1Pnl)}`}>
                  {anyLoading && totals.clientsIncluded === 0 ? "…" : formatTotalCell(totals.engine1Pnl)}
                </th>
                <th className={`text-right align-middle tabular-nums font-semibold ${signedClass(totals.e2Ytd)}`}>
                  {anyLoading && totals.clientsIncluded === 0 ? "…" : formatTotalCell(totals.e2Ytd)}
                </th>
                <th className={`text-right align-middle tabular-nums font-semibold ${signedClass(totals.e2Quarter)}`}>
                  {anyLoading && totals.clientsIncluded === 0 ? "…" : formatTotalCell(totals.e2Quarter)}
                </th>
                <th className={`text-right align-middle tabular-nums font-semibold ${signedClass(totals.e2Month)}`}>
                  {anyLoading && totals.clientsIncluded === 0 ? "…" : formatTotalCell(totals.e2Month)}
                </th>
                <th className="text-right align-middle tabular-nums font-semibold text-base-content">
                  {anyLoading && totals.clientsIncluded === 0 ? "…" : formatTotalCell(totals.availableMargin)}
                </th>
                <th className="text-right align-middle tabular-nums font-semibold text-base-content">
                  {anyLoading && totals.clientsIncluded === 0 ? "…" : formatTotalCell(totals.utilisedMargin)}
                </th>
                <th className="w-12" aria-hidden />
              </tr>
            ) : null}
            <tr className="text-xs uppercase tracking-wide text-base-content/60">
              <th className="min-w-[12rem]">Client info</th>
              <th className="text-right">E1 Total</th>
              <th className="text-right">E1 PnL</th>
              <th className="text-right">E2 YTD</th>
              <th className="text-right">E2 Quarterly</th>
              <th className="text-right">E2 Monthly</th>
              <th className="text-right">Avl margin</th>
              <th className="text-right">Utilised margin</th>
              <th className="w-12" />
            </tr>
          </thead>
          <tbody>
            {loadingProfiles ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={9}>
                    <div className="h-8 animate-pulse rounded bg-base-300/40" />
                  </td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-base-content/55">
                  No active profiles found.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.profileId}>
                  <td className="min-w-[12rem] max-w-[18rem]">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Link
                          href={`/admin/profiles/${row.profileId}/live`}
                          className="link link-primary font-mono text-sm font-medium"
                        >
                          {row.clientId} <span className="text-xs text-base-content/55">{row.brokerName}</span>
                        </Link>
                        {!row.brokerLoggedIn ? (
                          <span className="badge badge-warning badge-xs">offline</span>
                        ) : null}
                      </div>
                      <p className="truncate text-sm text-base-content/80" title={row.userEmail}>
                        {row.userEmail}
                      </p>
                    </div>
                  </td>
                  <td className="text-right tabular-nums">
                    {row.status === "loading" ? (
                      <span className="loading loading-dots loading-xs" />
                    ) : (
                      formatCell(row.engine1Total)
                    )}
                  </td>
                  <td className={`text-right ${signedClass(row.engine1Pnl)}`}>
                    {row.status === "loading" ? "…" : formatCell(row.engine1Pnl)}
                  </td>
                  <td className={`text-right ${signedClass(row.engine2?.ytd_pnl)}`}>
                    {row.status === "loading" ? "…" : formatCell(row.engine2?.ytd_pnl ?? null)}
                  </td>
                  <td className={`text-right ${signedClass(row.engine2?.quarter_pnl)}`}>
                    {row.status === "loading" ? "…" : formatCell(row.engine2?.quarter_pnl ?? null)}
                  </td>
                  <td className={`text-right ${signedClass(row.engine2?.pnl)}`}>
                    {row.status === "loading" ? "…" : formatCell(row.engine2?.pnl ?? null)}
                  </td>
                  <td className="text-right tabular-nums">
                    {row.status === "loading" ? "…" : formatCell(row.margin?.available_total ?? null)}
                  </td>
                  <td className="text-right tabular-nums">
                    {row.status === "loading" ? "…" : formatCell(row.margin?.utilised_total ?? null)}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs btn-square"
                      title="Refresh row"
                      aria-label={`Refresh ${row.clientId}`}
                      onClick={() => void handleRefreshRow(row.profileId)}
                      disabled={row.status === "loading"}
                    >
                      <RefreshCw
                        className={`h-3.5 w-3.5 ${row.status === "loading" ? "animate-spin" : ""}`}
                      />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {rows.some((r) => r.status === "error") ? (
        <p className="mt-2 text-xs text-warning">
          Some rows could not load all metrics (broker session, API limits, or missing data). Use per-row refresh to retry.
        </p>
      ) : null}
    </div>
  );
}
