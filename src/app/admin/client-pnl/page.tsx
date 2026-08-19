"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { authFetch } from "@/utils/api";
import { formatMoneyIN } from "@/utils/formatNumber";
import useAlert from "@/hooks/useAlert";
import { Profile } from "@/types/profile";
import { LiveHolding } from "@/types/positions";
import { IndianRupee, RefreshCw, Search, BarChart3, Info } from "lucide-react";
import { USER_ROLE_FILTER_OPTIONS, userRoleLabel } from "@/constants/userRoles";

type PnlSummary = {
  month: string;
  quarter: string;
  fy?: string;
  week?: string;
  week_pnl?: number;
  pnl: number;
  quarter_pnl: number;
  ytd_pnl: number;
  all_time_pnl?: number;
  e1_all_time_realised?: number | null;
};

type LiveMargin = {
  available_total: number;
  available_cash: number;
  utilised_total: number;
  net: number;
  total_account_cash?: number | null;
};

type ClientPnlRow = {
  profileId: number;
  clientId: string;
  userEmail: string;
  userRole?: string | null;
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
const MAX_ROW_ATTEMPTS = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

function e1PnlSum(
  mtm: number | null | undefined,
  realised: number | null | undefined
): number | null {
  const hasMtm = mtm != null && !Number.isNaN(mtm);
  const hasRealised = realised != null && !Number.isNaN(realised);
  if (hasMtm && hasRealised) return mtm + realised;
  if (hasMtm) return mtm;
  if (hasRealised) return realised;
  return null;
}

function E1PnlCell({
  pnl,
  realised,
  compact,
}: {
  pnl: number | null | undefined;
  realised: number | null | undefined;
  compact?: boolean;
}) {
  const format = compact ? formatTotalCell : formatCell;
  const sum = e1PnlSum(pnl, realised);
  const hasBreakdown =
    (pnl != null && !Number.isNaN(pnl)) || (realised != null && !Number.isNaN(realised));

  return (
    <span className={`inline-flex items-center justify-end gap-0.5 ${signedClass(sum)}`}>
      {format(sum)}
      {hasBreakdown ? (
        <div className="dropdown dropdown-hover dropdown-start dropdown-right">
          <button
            type="button"
            tabIndex={0}
            className="inline-flex cursor-pointer text-base-content/45 hover:text-base-content/70"
            aria-label="E1 PnL breakdown"
          >
            <Info className="h-3 w-3" strokeWidth={2.5} aria-hidden />
          </button>
          <div
            tabIndex={0}
            className="dropdown-content z-50 w-44 rounded-lg border border-base-300 bg-base-100 p-2 text-left text-xs"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-base-content/55">MTM</span>
              <span className={`tabular-nums ${signedClass(pnl ?? null)}`}>{formatCell(pnl)}</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-3">
              <span className="text-base-content/55">Realised</span>
              <span className={`tabular-nums ${signedClass(realised ?? null)}`}>
                {formatCell(realised)}
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </span>
  );
}

function totalAcValue(
  engine1Total: number | null,
  cashAddend: number | null | undefined
): number | null {
  if (engine1Total == null || cashAddend == null || Number.isNaN(cashAddend)) return null;
  return engine1Total + cashAddend;
}

function totalAcCashAddend(margin: LiveMargin | null | undefined): number | null {
  if (!margin) return null;
  const addend = margin.total_account_cash ?? margin.available_cash;
  if (addend == null || Number.isNaN(Number(addend))) return null;
  return Number(addend);
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
        available_cash: marginData.available_cash,
        utilised_total: marginData.utilised_total,
        net: marginData.net,
        total_account_cash:
          marginData.total_account_cash != null ? Number(marginData.total_account_cash) : null,
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
  availableCash: number;
  totalAcValue: number;
  engine1Pnl: number;
  engine1Realised: number;
  engine1RealisedCount: number;
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
    availableCash: 0,
    totalAcValue: 0,
    engine1Pnl: 0,
    engine1Realised: 0,
    engine1RealisedCount: 0,
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
    if (row.margin?.available_cash != null) {
      totals.availableCash += row.margin.available_cash;
      included = true;
    }
    const rowTotalAc = totalAcValue(row.engine1Total, totalAcCashAddend(row.margin));
    if (rowTotalAc != null) {
      totals.totalAcValue += rowTotalAc;
      included = true;
    }
    if (row.engine1Pnl != null) {
      totals.engine1Pnl += row.engine1Pnl;
      included = true;
    }
    const e1Realised = row.engine2?.e1_all_time_realised;
    if (e1Realised != null && !Number.isNaN(e1Realised)) {
      totals.engine1Realised += e1Realised;
      totals.engine1RealisedCount += 1;
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
    userRole: profile.user?.role ?? null,
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
  const [roleFilter, setRoleFilter] = useState<string>("client");
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
      let metrics = await fetchRowMetrics(profile);
      for (let attempt = 1; attempt < MAX_ROW_ATTEMPTS && metrics.error; attempt++) {
        if (refreshGen.current !== gen) return;
        await sleep(400 * attempt);
        metrics = await fetchRowMetrics(profile);
      }
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
      if (roleFilter) params.set("user_role", roleFilter);

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
  }, [debouncedSearch, roleFilter, refreshRows]);

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

        <div className="flex items-center gap-2">

        <label className="input input-bordered input-sm flex w-full items-center gap-2 sm:w-64">
            <Search className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
            <input
              type="search"
              className="min-w-0 grow"
              placeholder="Search client / email"
              aria-label="Search client or email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>
          
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="select select-bordered select-sm h-9 min-w-[10rem]"
            aria-label="Filter by user role"
          >
            {USER_ROLE_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
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
                <th className="text-right align-middle tabular-nums font-semibold text-base-content">
                  {anyLoading && totals.clientsIncluded === 0 ? "…" : formatTotalCell(totals.availableCash)}
                </th>
                <th className="text-right align-middle tabular-nums font-semibold text-base-content">
                  {anyLoading && totals.clientsIncluded === 0 ? "…" : formatTotalCell(totals.totalAcValue)}
                </th>
                <th className="relative z-0 text-right align-middle hover:z-20 focus-within:z-20">
                  {anyLoading && totals.clientsIncluded === 0 ? (
                    "…"
                  ) : (
                    <E1PnlCell
                      compact
                      pnl={totals.engine1Pnl}
                      realised={
                        totals.engine1RealisedCount > 0 ? totals.engine1Realised : null
                      }
                    />
                  )}
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
              <th className="text-right">Avl cash</th>
              <th className="text-right">Total AC</th>
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
                  <td colSpan={11}>
                    <div className="h-8 animate-pulse rounded bg-base-300/40" />
                  </td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-base-content/55">
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
                        <Link
                          href={`/admin/profiles/${row.profileId}/reports`}
                          className="btn btn-ghost btn-xs gap-1 px-1.5"
                          title="E2 reports"
                        >
                          <BarChart3 className="h-3.5 w-3.5" aria-hidden />
                          <span className="hidden sm:inline">Reports</span>
                        </Link>
                        {!row.brokerLoggedIn ? (
                          <span className="badge badge-warning badge-xs">offline</span>
                        ) : null}
                      </div>
                      <p className="truncate text-sm text-base-content/80" title={row.userEmail}>
                        {row.userEmail}
                      </p>
                      {row.userRole ? (
                        <span className="badge badge-outline badge-xs w-fit">
                          {userRoleLabel(row.userRole)}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="text-right tabular-nums">
                    {row.status === "loading" ? (
                      <span className="loading loading-dots loading-xs" />
                    ) : (
                      formatCell(row.engine1Total)
                    )}
                  </td>
                  <td className="text-right tabular-nums">
                    {row.status === "loading"
                      ? "…"
                      : formatCell(row.margin?.available_cash ?? null)}
                  </td>
                  <td className="text-right tabular-nums">
                    {row.status === "loading"
                      ? "…"
                      : formatCell(totalAcValue(row.engine1Total, totalAcCashAddend(row.margin)))}
                  </td>
                  <td className="relative z-0 text-right hover:z-20 focus-within:z-20">
                    {row.status === "loading" ? (
                      "…"
                    ) : (
                      <E1PnlCell
                        pnl={row.engine1Pnl}
                        realised={row.engine2?.e1_all_time_realised}
                      />
                    )}
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
