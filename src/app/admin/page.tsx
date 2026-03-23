"use client";

import { authFetch } from "@/utils/api";
import Link from "next/link";
import React from "react";
import { CheckCircle, ChevronRight, LayoutList } from "lucide-react";
import { formatMoneyIN } from "@/utils/formatNumber";

interface Version {
  version: number;
  approved: boolean;
}

interface Strategy {
  id: number;
  name: string;
  adjustment_count: number;
  trade_cycle_count: number;
  leg_count: number;
  total_pnl: number | null;
  completed: boolean;
  completed_at: string | null;
  versions: Version[];
}

const ORDER_OPTIONS = [
  { value: "-created_at", label: "Created (newest)" },
  { value: "created_at", label: "Created (oldest)" },
  { value: "-total_pnl", label: "Total PnL (best first)" },
  { value: "total_pnl", label: "Total PnL (worst first)" },
  { value: "name", label: "Name (A–Z)" },
  { value: "-name", label: "Name (Z–A)" },
] as const;

function buildStrategiesUrl(params: {
  completed: string;
  orderBy: string;
}): string {
  const search = new URLSearchParams();
  search.set("page", "1");
  search.set("page_size", "10");
  if (params.completed) search.set("completed", params.completed);
  if (params.orderBy) search.set("order_by", params.orderBy);
  return `myadmin/strategies/?${search.toString()}`;
}

export default function Page() {
  const [strategies, setStrategies] = React.useState<Strategy[]>([]);
  const [next, setNext] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [orderBy, setOrderBy] = React.useState("-created_at");
  const [completed, setCompleted] = React.useState("");

  async function fetchStrategies() {
    setLoading(true);
    const url = buildStrategiesUrl({ completed, orderBy });
    const res = await authFetch(url);
    const data = await res.json();
    if (data.next) {
      setNext(data.next.includes("api/") ? data.next.split("api/")[1] : data.next);
    } else {
      setNext(null);
    }
    setStrategies(data.results ?? []);
    setLoading(false);
  }

  async function loadMoreStrategies() {
    if (!next) return;
    setLoading(true);
    const res = await authFetch(next);
    const data = await res.json();
    if (data.next) {
      setNext(data.next.includes("api/") ? data.next.split("api/")[1] : data.next);
    } else {
      setNext(null);
    }
    setStrategies((prev) => [...prev, ...(data.results ?? [])]);
    setLoading(false);
  }

  React.useEffect(() => {
    fetchStrategies();
  }, [completed, orderBy]);

  const lastAdjustment = (s: Strategy): Version | null =>
    s.versions?.length ? s.versions[0] : null;

  const pnlColor = (val: number | null) => {
    if (val == null) return "";
    return val > 0 ? "text-emerald-600 dark:text-emerald-400" : val < 0 ? "text-red-600 dark:text-red-400" : "";
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <LayoutList className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Strategies</h1>
              <p className="text-sm text-base-content/60 mt-0.5">
                Manage and monitor deployed strategies
              </p>
            </div>
          </div>

          <div className="flex flex-nowrap items-center gap-2">
            <select
              value={orderBy}
              onChange={(e) => setOrderBy(e.target.value)}
              className="select select-bordered select-sm w-auto min-w-[160px]"
            >
              {ORDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={completed}
              onChange={(e) => setCompleted(e.target.value)}
              className="select select-bordered select-sm w-auto min-w-[110px]"
            >
              <option value="">All</option>
              <option value="true">Completed</option>
              <option value="false">Not completed</option>
            </select>
          </div>
        </header>

        <div className="rounded-xl border border-base-300/50 bg-base-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr className="border-b border-base-300/50">
                  <th className="font-medium text-base-content/70">ID</th>
                  <th className="font-medium text-base-content/70">Name</th>
                  <th className="font-medium text-base-content/70">Status</th>
                  <th className="font-medium text-base-content/70">Allocated</th>
                  <th className="font-medium text-base-content/70">Last adjustment</th>
                  <th className="font-medium text-base-content/70">Legs</th>
                  <th className="font-medium text-base-content/70 text-right">Total PnL</th>
                  <th className="font-medium text-base-content/70 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {strategies.length === 0 && !loading && (
                  <tr>
                    <td colSpan={8} className="text-center py-16">
                      <p className="text-base-content/60">No strategies found.</p>
                      <p className="text-sm text-base-content/50 mt-1">
                        Try changing filters or create a new strategy.
                      </p>
                    </td>
                  </tr>
                )}

                {strategies.map((strategy) => {
                  const last = lastAdjustment(strategy);
                  return (
                    <tr
                      key={strategy.id}
                      className="hover:bg-base-200/50 transition-colors border-b border-base-300/30 last:border-0"
                    >
                      <td className="font-mono text-sm text-base-content/70">
                        {strategy.id}
                      </td>
                      <td>
                        <span className="font-medium">{strategy.name}</span>
                      </td>
                      <td>
                        {strategy.completed ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                            <CheckCircle className="size-3.5" />
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded-md bg-base-300/50 text-base-content/80 text-xs font-medium">
                            Active
                          </span>
                        )}
                      </td>
                      <td>{strategy.trade_cycle_count}</td>
                      <td>
                        {last ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="font-medium text-base-content/90">
                              v{last.version}
                            </span>
                            <span
                              className={`badge badge-sm ${
                                last.approved
                                  ? "badge-success"
                                  : "badge-error badge-outline"
                              }`}
                            >
                              {last.approved ? "Approved" : "Pending"}
                            </span>
                          </span>
                        ) : (
                          <span className="text-base-content/50">—</span>
                        )}
                      </td>
                      <td>{strategy.leg_count ?? 0}</td>
                      <td className="text-right">
                        <span
                          className={`font-semibold tabular-nums ${pnlColor(
                            strategy.total_pnl
                          )}`}
                        >
                          {strategy.total_pnl != null
                            ? formatMoneyIN(Number(strategy.total_pnl))
                            : "—"}
                        </span>
                      </td>
                      <td>
                        <Link
                          href={`/admin/strategy/${strategy.id}`}
                          className="btn btn-ghost btn-sm gap-1 text-primary hover:bg-primary/10"
                        >
                          View
                          <ChevronRight className="size-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}

                {loading && strategies.length === 0 &&
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={`skeleton-${i}`} className="border-b border-base-300/30">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j}>
                          <div className="h-5 bg-base-300/40 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {next && !loading && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={loadMoreStrategies}
              className="btn btn-outline btn-sm"
            >
              Load more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
