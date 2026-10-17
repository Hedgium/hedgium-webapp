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
  periods?: Partial<Record<FirmRoiPeriodKey, FirmRoiAccountPeriod>>;
};

type FirmRoiResponse = {
  profiles_considered: number;
  profiles_included: number;
  periods: Record<FirmRoiPeriodKey, FirmRoiPeriod>;
  accounts: FirmRoiAccount[];
  month: string | null;
  quarter: string | null;
  fy: string | null;
};

const PAGE_SIZE = 25;

const METHODOLOGY_TIP =
  "Active client accounts where E2 has started at least once. E1: Hedgium-managed only; base = avg daily account value. E2: all included accounts; base = avg daily account value if E1 Hedgium-managed, else avg utilised+net. Firm totals days-weight each account average by days live in the period (inception, or created date if blank) over the period's calendar days. Account rows show the unweighted account average. Total = E1% + E2%. Monthly chart: closed months use E2 snapshot MoM; current month matches the Monthly card. Clients-tab filters do not apply.";

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

function formatAmt(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return formatMoneyIN(value);
}

function davTip(base: number | null | undefined): string | undefined {
  if (base == null || Number.isNaN(base)) return undefined;
  return `DAV: ₹${formatMoneyIN(base)}`;
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

const PERIOD_META: {
  key: FirmRoiPeriodKey;
  label: string;
  detailKey: "month" | "quarter" | "fy" | null;
  highlight?: boolean;
}[] = [
  { key: "month", label: "Monthly (Current)", detailKey: "month" },
  { key: "quarter", label: "Quarterly (Current)", detailKey: "quarter" },
  { key: "ytd", label: "YTD (Current)", detailKey: "fy", highlight: true },
  { key: "all_time", label: "All time", detailKey: null },
];

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" aria-hidden />
            <h2 className="text-lg font-semibold tracking-tight">Firm ROI</h2>
            <button
              type="button"
              className="tooltip tooltip-right cursor-pointer inline-flex text-base-content/45 hover:text-base-content/70 before:z-30 before:max-w-[18rem] before:text-left before:whitespace-normal before:px-3 before:py-2 before:normal-case before:tracking-normal after:z-30"
              data-tip={METHODOLOGY_TIP}
              aria-label={METHODOLOGY_TIP}
            >
              <Info className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            </button>
          </div>
          {data ? (
            <p className="text-xs text-base-content/55">
              {data.profiles_included} of {data.profiles_considered} active client
              profiles included
              {data.month || data.quarter || data.fy
                ? ` · ${[data.month, data.quarter, data.fy].filter(Boolean).join(" / ")}`
                : null}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm gap-2 self-start"
          onClick={load}
          disabled={summaryLoading || monthlyLoading}
        >
          <RefreshCw
            className={`h-4 w-4 ${summaryLoading || monthlyLoading ? "animate-spin" : ""}`}
            aria-hidden
          />
          Refresh
        </button>
      </div>

      {summaryLoading && !data ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-base-300/40" />
          ))}
        </div>
      ) : summaryError && !data ? (
        <p className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
          {summaryError}
        </p>
      ) : data ? (
          <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 ${summaryLoading ? "opacity-60" : ""}`}>
            {PERIOD_META.map((meta) => {
              const period = data.periods[meta.key];
              const detail =
                meta.detailKey && data[meta.detailKey]
                  ? `(${data[meta.detailKey]})`
                  : meta.key === "all_time"
                    ? "(Inception → Till date)"
                    : null;
              const tipSide =
                meta.key === "month" || meta.key === "ytd"
                  ? "tooltip-right"
                  : "tooltip-left";
              const e1Dav = davTip(period.e1_base);
              const e2Dav = davTip(period.e2_base);
              return (
                <div
                  key={meta.key}
                  className={
                    meta.highlight
                      ? "relative z-0 hover:z-20 focus-within:z-20 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-base-100/80 p-4"
                      : "relative z-0 hover:z-20 focus-within:z-20 rounded-2xl border border-base-300/60 bg-base-200/35 p-4"
                  }
                >
                  <div className="mb-2 text-xs font-medium uppercase tracking-wider text-base-content">
                    {meta.label}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="inline-flex items-center gap-0.5 shrink-0 text-[11px] font-medium uppercase tracking-wide text-base-content/55">
                        E1
                        {e1Dav ? (
                          <button
                            type="button"
                            className={`tooltip z-30 cursor-pointer inline-flex text-base-content/45 hover:text-base-content/70 before:z-30 before:max-w-[14rem] before:text-left before:whitespace-normal before:px-3 before:py-2 before:normal-case before:tracking-normal after:z-30 ${tipSide}`}
                            data-tip={e1Dav}
                            aria-label={e1Dav}
                          >
                            <Info className="h-3 w-3" strokeWidth={2.5} aria-hidden />
                          </button>
                        ) : null}
                      </span>
                      <div className="min-w-0 text-right">
                        <div
                          className={`text-sm font-semibold tabular-nums ${signedClass(period.e1_return)}`}
                        >
                          {formatAmt(period.e1_return)}
                        </div>
                        <div
                          className={`text-[11px] font-semibold tabular-nums ${signedClass(period.e1_pct)}`}
                        >
                          {formatPct(period.e1_pct)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="inline-flex items-center gap-0.5 shrink-0 text-[11px] font-medium uppercase tracking-wide text-base-content/55">
                        E2
                        {e2Dav ? (
                          <button
                            type="button"
                            className={`tooltip z-30 cursor-pointer inline-flex text-base-content/45 hover:text-base-content/70 before:z-30 before:max-w-[14rem] before:text-left before:whitespace-normal before:px-3 before:py-2 before:normal-case before:tracking-normal after:z-30 ${tipSide}`}
                            data-tip={e2Dav}
                            aria-label={e2Dav}
                          >
                            <Info className="h-3 w-3" strokeWidth={2.5} aria-hidden />
                          </button>
                        ) : null}
                      </span>
                      <div className="min-w-0 text-right">
                        <div
                          className={`text-sm font-semibold tabular-nums ${signedClass(period.e2_return)}`}
                        >
                          {formatAmt(period.e2_return)}
                        </div>
                        <div
                          className={`text-[11px] font-semibold tabular-nums ${signedClass(period.e2_pct)}`}
                        >
                          {formatPct(period.e2_pct)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-baseline justify-between gap-2 border-t border-base-300/50 pt-2">
                      <span className="text-[11px] font-medium uppercase tracking-wide text-base-content/80">
                        Total
                      </span>
                      <div
                        className={`text-base font-bold tabular-nums md:text-lg ${signedClass(period.total_pct)}`}
                      >
                        {formatPct(period.total_pct)}
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] leading-snug text-base-content/60">
                    {detail}
                    {detail ? " · " : null}
                    E1 {period.e1_accounts} / E2 {period.e2_accounts} accounts
                  </p>
                </div>
              );
            })}
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
                      </tr>
                    </thead>
                    <tbody>
                      {!data ? (
                        <tr>
                          <td colSpan={7} className="py-10 text-center text-base-content/55">
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
                            colSpan={7}
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
