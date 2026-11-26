"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Info,
  RefreshCw,
  Search,
  TrendingUp,
} from "lucide-react";
import { authFetch } from "@/utils/api";
import { formatMoneyIN } from "@/utils/formatNumber";
import useAlert from "@/hooks/useAlert";
import FirmRoiMonthlyChart, {
  type FirmRoiMonthPoint,
} from "@/components/admin/FirmRoiMonthlyChart";

type FirmRoiPeriod = {
  e1_return: number | null;
  e1_base: number | null;
  e1_pct: number | null;
  e2_return: number | null;
  e2_base: number | null;
  e2_pct: number | null;
  total_pct: number | null;
  e1_accounts: number;
  e2_accounts: number;
};

type FirmRoiPeriodKey = "month" | "quarter" | "ytd" | "all_time";

type FirmRoiAccountPeriod = {
  e1_return: number | null;
  e1_base: number | null;
  e2_return: number | null;
  e2_base: number | null;
};

type FirmRoiAccount = {
  profile_id: number;
  client_id: string;
  user_email: string;
  e1_hedgium_managed: boolean;
  e1_return: number | null;
  e1_base: number | null;
  e2_return: number | null;
  e2_base: number | null;
  e2_base_kind: "account_value" | "margin";
  xirr?: number | null;
  e1_xirr?: number | null;
  e2_xirr?: number | null;
  periods?: Partial<Record<FirmRoiPeriodKey, FirmRoiAccountPeriod>>;
};

type FirmXirrPeriod = {
  e1_xirr?: number | null;
  e1_gain?: number | null;
  e1_return?: number | null;
  e2_xirr?: number | null;
  e2_gain?: number | null;
  e2_return?: number | null;
  xirr?: number | null;
  gain?: number | null;
  total_return?: number | null;
  start?: string | null;
  as_of?: string | null;
  e1_accounts?: number;
  e2_accounts?: number;
  accounts?: number;
};

type FirmRoiResponse = {
  profiles_considered: number;
  profiles_included: number;
  periods: Record<FirmRoiPeriodKey, FirmRoiPeriod>;
  accounts: FirmRoiAccount[];
  month: string | null;
  quarter: string | null;
  fy: string | null;
  xirr?: number | null;
  xirr_gain?: number | null;
  e1_xirr?: number | null;
  e1_xirr_gain?: number | null;
  e1_xirr_accounts?: number;
  e2_xirr?: number | null;
  e2_xirr_gain?: number | null;
  e2_xirr_accounts?: number;
  xirr_as_of?: string | null;
  xirr_accounts?: number;
  xirr_periods?: {
    month: FirmXirrPeriod;
    quarter: FirmXirrPeriod;
    ytd: FirmXirrPeriod;
    all: FirmXirrPeriod;
  } | null;
};

const PAGE_SIZE = 25;

const METHODOLOGY_TIP =
  "Active client accounts where E2 has started at least once. E1: Hedgium-managed only; base = avg daily account value from E1 inception (never margin). E2: all included accounts; base = avg daily account value if E1 Hedgium-managed, else avg utilised+net, from E2 inception (month start of first closed cycle). Firm totals days-weight each account average by days live in the period over the period's calendar days. Account rows show the unweighted account average. Total = E1% + E2%. XIRR needs an approved cash flow and a latest account value. Period XIRR (Month, FY quarter, FY YTD) counts every account with an approved cash flow, same as All. Capital starts at the later of the opening cash flow and the total account value before the window, plus approved external flows after that. E1 ends at that capital plus the period's E1 pnl (Hedgium-managed). E2 ends at that capital plus the period's trade-cycle net PnL, the same figures as the ROI cards. Total is E1 + E2. Month, quarter, and YTD show the return over that period: (1 + XIRR)^(days/365) − 1, days from capital start to as-of. All is the annual XIRR. Monthly chart: closed months use E2 snapshot MoM; current month matches the Monthly card. Clients-tab filters do not apply.";

type FirmRoiMonthlyResponse = {
  months: FirmRoiMonthPoint[];
  profiles_included: number;
  from_month: string | null;
  to_month: string | null;
};

function signedClass(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "text-base-content/60";
  if (value > 0) return "text-success";
  if (value < 0) return "text-error";
  return "text-base-content/75";
}

function formatPct(pct: number | null | undefined): string {
  if (pct == null || Number.isNaN(pct)) return "—";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

function formatXirr(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return formatPct(value * 100);
}

function formatAsOf(value: string | null | undefined): string {
  if (!value) return "";
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return "";
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function addNullable(
  left: number | null | undefined,
  right: number | null | undefined
): number | null {
  const a = left == null || Number.isNaN(left) ? null : left;
  const b = right == null || Number.isNaN(right) ? null : right;
  if (a == null && b == null) return null;
  return (a ?? 0) + (b ?? 0);
}

function formatAmt(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return formatMoneyIN(value);
}

const BREAKDOWN_PERIODS: { key: FirmRoiPeriodKey; label: string }[] = [
  { key: "month", label: "Monthly" },
  { key: "quarter", label: "Quarterly" },
  { key: "ytd", label: "YTD" },
  { key: "all_time", label: "All time" },
];

function accountPeriodFigures(
  row: FirmRoiAccount,
  period: FirmRoiPeriodKey
): FirmRoiAccountPeriod {
  const fromApi = row.periods?.[period];
  if (fromApi) return fromApi;
  if (period === "all_time") {
    return {
      e1_return: row.e1_return,
      e1_base: row.e1_base,
      e2_return: row.e2_return,
      e2_base: row.e2_base,
    };
  }
  return {
    e1_return: null,
    e1_base: null,
    e2_return: null,
    e2_base: null,
  };
}

const XIRR_COLUMNS = [
  { key: "month", label: "Month", detailKey: "month" },
  { key: "quarter", label: "Quarter", detailKey: "quarter" },
  { key: "ytd", label: "YTD", detailKey: "fy" },
  { key: "all", label: "All (annual)", detailKey: null },
] as const;

function FirmXirrSkeleton() {
  const bar = "rounded bg-base-300/60";
  return (
    <div
      className="animate-pulse space-y-3 rounded-2xl border border-base-300/60 bg-base-200/35 px-4 py-3"
      aria-busy="true"
      aria-label="Loading firm ROI"
    >
      <div className="space-y-1.5">
        <div className={`h-5 w-40 ${bar}`} />
        <div className={`h-3 w-48 ${bar}`} />
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[36rem]">
          <div className="grid grid-cols-5 gap-2 pb-2">
            <div className={`h-3 w-10 ${bar}`} />
            {XIRR_COLUMNS.map(({ key }) => (
              <div key={key} className={`ml-auto h-3 w-12 ${bar}`} />
            ))}
          </div>
          {["E1", "E2", "Total"].map((leg) => (
            <div
              key={leg}
              className="grid grid-cols-5 gap-2 border-t border-base-300/40 py-2.5"
            >
              <div className="space-y-1.5">
                <div className={`h-4 w-10 ${bar}`} />
                <div className={`h-2.5 w-20 ${bar}`} />
              </div>
              {XIRR_COLUMNS.map(({ key }) => (
                <div key={key} className="flex flex-col items-end gap-1.5">
                  <div className={`h-4 w-16 ${bar}`} />
                  <div className={`h-3 w-20 ${bar}`} />
                </div>
              ))}
            </div>
          ))}
          <div className="grid grid-cols-5 gap-2 border-t border-base-300/40 pt-2">
            <div />
            {XIRR_COLUMNS.map(({ key }) => (
              <div key={key} className={`ml-auto h-2.5 w-28 ${bar}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FirmRoiPanel() {
  const alert = useAlert();
  const alertRef = useRef(alert);
  alertRef.current = alert;
  const [data, setData] = useState<FirmRoiResponse | null>(null);
  const [monthly, setMonthly] = useState<FirmRoiMonthlyResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [monthlyLoading, setMonthlyLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [monthlyError, setMonthlyError] = useState<string | null>(null);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [breakdownPeriod, setBreakdownPeriod] = useState<FirmRoiPeriodKey>("all_time");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const summaryGen = useRef(0);
  const monthlyGen = useRef(0);

  const loadSummary = useCallback(async () => {
    const gen = ++summaryGen.current;
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const res = await authFetch("positions/pnl/firm-roi/");
      if (summaryGen.current !== gen) return;
      if (!res.ok) throw new Error("Failed to load firm ROI");
      setData((await res.json()) as FirmRoiResponse);
      setPage(0);
    } catch (e) {
      console.error(e);
      if (summaryGen.current !== gen) return;
      setSummaryError("Failed to load firm ROI");
      alertRef.current.error("Failed to load firm ROI");
    } finally {
      if (summaryGen.current === gen) setSummaryLoading(false);
    }
  }, []);

  const loadMonthly = useCallback(async () => {
    const gen = ++monthlyGen.current;
    setMonthlyLoading(true);
    setMonthlyError(null);
    try {
      const res = await authFetch("positions/pnl/firm-roi/monthly/");
      if (monthlyGen.current !== gen) return;
      if (!res.ok) throw new Error("Failed to load monthly ROI");
      setMonthly((await res.json()) as FirmRoiMonthlyResponse);
    } catch (e) {
      console.error(e);
      if (monthlyGen.current !== gen) return;
      setMonthlyError("Failed to load monthly ROI");
      alertRef.current.error("Failed to load monthly ROI");
    } finally {
      if (monthlyGen.current === gen) setMonthlyLoading(false);
    }
  }, []);

  const load = useCallback(() => {
    void loadSummary();
    void loadMonthly();
  }, [loadSummary, loadMonthly]);

  useEffect(() => {
    load();
  }, [load]);

  const accounts = data?.accounts ?? [];
  const q = searchQuery.trim().toLowerCase();
  const filteredAccounts = !q
    ? accounts
    : accounts.filter(
        (row) =>
          row.client_id.toLowerCase().includes(q) ||
          row.user_email.toLowerCase().includes(q)
      );

  const pageCount = Math.max(1, Math.ceil(filteredAccounts.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filteredAccounts.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE
  );

  useEffect(() => {
    setPage(0);
  }, [searchQuery]);

  return (
    <div className="space-y-5">
    

      {summaryError && !data ? (
        <p className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
          {summaryError}
        </p>
      ) : null}

      {summaryLoading && !data ? (
        <FirmXirrSkeleton />
      ) : data ? (
        <div className={`space-y-3 rounded-2xl border border-base-300/60 bg-base-200/35 px-4 py-3 ${summaryLoading ? "opacity-60" : ""}`}>
          <div>
            <div className="text-lg font-semibold tracking-wider text-base-content">
              Firm ROI (XIRR)
            </div>
            <p className="text-[11px] text-base-content/60">
              Approved cash flow
              {data.xirr_as_of ? ` · as of ${formatAsOf(data.xirr_as_of)}` : ""}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="text-[11px] font-medium uppercase tracking-wide text-base-content/55">
                  <th className="pb-2 pr-4 text-left font-medium">Leg</th>
                  {XIRR_COLUMNS.map(({ key, label }) => (
                    <th key={key} className="pb-2 px-2 text-right font-medium">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    {
                      label: "E1",
                      rateKey: "e1_xirr" as const,
                      returnKey: "e1_return" as const,
                      gainKey: "e1_gain" as const,
                      fallbackRate: data.e1_xirr,
                      fallbackGain: data.e1_xirr_gain,
                      scope: "Hedgium managed",
                    },
                    {
                      label: "E2",
                      rateKey: "e2_xirr" as const,
                      returnKey: "e2_return" as const,
                      gainKey: "e2_gain" as const,
                      fallbackRate: data.e2_xirr,
                      fallbackGain: data.e2_xirr_gain,
                      scope: "All accounts",
                    },
                    {
                      label: "Total",
                      rateKey: "xirr" as const,
                      returnKey: "total_return" as const,
                      gainKey: "gain" as const,
                      fallbackRate: addNullable(data.e1_xirr, data.e2_xirr),
                      fallbackGain: addNullable(data.e1_xirr_gain, data.e2_xirr_gain),
                      scope: "E1 + E2",
                    },
                  ] as const
                ).map((leg) => (
                  <tr key={leg.label} className="border-t border-base-300/40">
                    <td className="py-2.5 pr-4 align-top">
                      <div className="font-medium text-base-content/80">{leg.label}</div>
                      <div className="text-[10px] text-base-content/50">{leg.scope}</div>
                    </td>
                    {XIRR_COLUMNS.map(({ key }) => {
                      const period = data.xirr_periods?.[key];
                      const rate =
                        key === "all"
                          ? (period?.[leg.rateKey] ?? leg.fallbackRate)
                          : period?.[leg.returnKey];
                      const gain =
                        key === "all" && period?.[leg.gainKey] == null
                          ? leg.fallbackGain
                          : period?.[leg.gainKey];
                      return (
                        <td key={key} className="px-2 py-2.5 text-right align-top">
                          <div className={`font-bold tabular-nums ${signedClass(rate)}`}>
                            {formatXirr(rate)}
                          </div>
                          <div className={`text-xs tabular-nums ${signedClass(gain)}`}>
                            {formatAmt(gain)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr className="border-t border-base-300/40">
                  <td />
                  {XIRR_COLUMNS.map(({ key, detailKey }) => {
                    const period = data.xirr_periods?.[key];
                    const detail = detailKey
                      ? data[detailKey]
                        ? `(${data[detailKey]})`
                        : null
                      : "(Inception → Till date)";
                    const e1 =
                      key === "all"
                        ? period?.e1_accounts ?? data.e1_xirr_accounts ?? 0
                        : period?.e1_accounts ?? 0;
                    const e2 =
                      key === "all"
                        ? period?.e2_accounts ?? data.e2_xirr_accounts ?? 0
                        : period?.e2_accounts ?? 0;
                    return (
                      <td
                        key={key}
                        className="px-2 pt-2 text-right align-top text-[11px] leading-snug text-base-content/60"
                      >
                        {detail}
                        {detail ? " · " : null}
                        E1 {e1} / E2 {e2} accounts
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

          <div className="rounded-xl border border-base-300 bg-base-100 p-4 shadow-sm">
            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <h3 className="text-sm font-semibold">Monthly ROI</h3>
              {monthly?.from_month && monthly?.to_month ? (
                <p className="text-xs text-base-content/55">
                  {monthly.from_month} → {monthly.to_month}
                  {monthly.profiles_included
                    ? ` · ${monthly.profiles_included} accounts`
                    : null}
                </p>
              ) : null}
            </div>
            {monthlyLoading && !monthly ? (
              <div className="h-64 animate-pulse rounded-xl bg-base-300/40" />
            ) : monthlyError && !monthly ? (
              <p className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
                {monthlyError}
              </p>
            ) : (
              <div className={monthlyLoading ? "opacity-60" : ""}>
                <FirmRoiMonthlyChart data={monthly?.months ?? []} />
              </div>
            )}
          </div>

          <div className="rounded-xl border border-base-300 bg-base-100 shadow-sm">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <button
                type="button"
                className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-3 text-left hover:opacity-80"
                aria-expanded={breakdownOpen}
                onClick={() => setBreakdownOpen((open) => !open)}
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  {breakdownOpen ? (
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                  )}
                  Account breakdown
                  <span className="text-xs font-normal text-base-content/55">
                    {data
                      ? `(${data.accounts.length} · ${
                          BREAKDOWN_PERIODS.find((opt) => opt.key === breakdownPeriod)?.label
                        })`
                      : summaryLoading
                        ? "(Loading…)"
                        : null}
                  </span>
                </span>
                <span className="text-xs text-base-content/50">
                  {breakdownOpen ? "Hide" : "Show"}
                </span>
              </button>
              <select
                className="select select-bordered select-sm w-auto min-w-[8.5rem]"
                aria-label="Account breakdown period"
                value={breakdownPeriod}
                onChange={(e) => {
                  setBreakdownPeriod(e.target.value as FirmRoiPeriodKey);
                  setPage(0);
                }}
              >
                {BREAKDOWN_PERIODS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {breakdownOpen ? (
              <div className="space-y-3 border-t border-base-300 px-4 py-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <label className="input input-bordered input-sm flex w-full items-center gap-2 sm:max-w-xs">
                    <Search className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
                    <input
                      type="search"
                      className="min-w-0 grow"
                      placeholder="Search client / email"
                      aria-label="Search account breakdown"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </label>
                  <p className="text-xs text-base-content/55">
                    {filteredAccounts.length === 0
                      ? "No matches"
                      : `Showing ${safePage * PAGE_SIZE + 1}–${Math.min(
                          (safePage + 1) * PAGE_SIZE,
                          filteredAccounts.length
                        )} of ${filteredAccounts.length}`}
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="table table-zebra table-sm">
                    <thead>
                      <tr className="text-xs uppercase tracking-wide text-base-content/60">
                        <th>Client</th>
                        <th className="text-right">E1 managed</th>
                        <th className="text-right">E1 return</th>
                        <th className="text-right">E1 base</th>
                        <th className="text-right">E2 return</th>
                        <th className="text-right">E2 base</th>
                        <th className="text-right">E2 base kind</th>
                        <th className="text-right">E1 XIRR</th>
                        <th className="text-right">E2 XIRR</th>
                        <th className="text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!data ? (
                        <tr>
                          <td colSpan={10} className="py-10 text-center text-base-content/55">
                            {summaryLoading ? (
                              <span className="loading loading-dots loading-sm" />
                            ) : (
                              summaryError ?? "Firm ROI is unavailable."
                            )}
                          </td>
                        </tr>
                      ) : pageRows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={10}
                            className="py-10 text-center text-base-content/55"
                          >
                            {data.accounts.length === 0
                              ? "No accounts with E2 started."
                              : "No accounts match your search."}
                          </td>
                        </tr>
                      ) : (
                        pageRows.map((row) => {
                          const figures = accountPeriodFigures(row, breakdownPeriod);
                          const totalXirr = addNullable(row.e1_xirr, row.e2_xirr);
                          return (
                          <tr key={row.profile_id}>
                            <td className="min-w-[12rem]">
                              <div className="font-mono text-sm font-medium">
                                {row.client_id || "—"}
                              </div>
                              <div
                                className="truncate text-xs text-base-content/70"
                                title={row.user_email}
                              >
                                {row.user_email || "—"}
                              </div>
                            </td>
                            <td className="text-right text-sm">
                              {row.e1_hedgium_managed ? "Yes" : "Self"}
                            </td>
                            <td
                              className={`text-right tabular-nums ${signedClass(figures.e1_return)}`}
                            >
                              {formatAmt(figures.e1_return)}
                            </td>
                            <td className="text-right tabular-nums">
                              {formatAmt(figures.e1_base)}
                            </td>
                            <td
                              className={`text-right tabular-nums ${signedClass(figures.e2_return)}`}
                            >
                              {formatAmt(figures.e2_return)}
                            </td>
                            <td className="text-right tabular-nums">
                              {formatAmt(figures.e2_base)}
                            </td>
                            <td className="text-right text-xs text-base-content/70">
                              {row.e2_base_kind === "margin"
                                ? "Margin"
                                : "Account value"}
                            </td>
                            <td className={`text-right tabular-nums ${signedClass(row.e1_xirr)}`}>
                              {formatXirr(row.e1_xirr)}
                            </td>
                            <td className={`text-right tabular-nums ${signedClass(row.e2_xirr)}`}>
                              {formatXirr(row.e2_xirr)}
                            </td>
                            <td className={`text-right tabular-nums ${signedClass(totalXirr)}`}>
                              {formatXirr(totalXirr)}
                            </td>
                          </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {filteredAccounts.length > PAGE_SIZE ? (
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      disabled={safePage <= 0}
                      onClick={() => setPage(safePage - 1)}
                    >
                      Previous
                    </button>
                    <span className="text-xs tabular-nums text-base-content/60">
                      Page {safePage + 1} of {pageCount}
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      disabled={safePage >= pageCount - 1}
                      onClick={() => setPage(safePage + 1)}
                    >
                      Next
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
    </div>
  );
}
