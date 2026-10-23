"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Info, RefreshCw } from "lucide-react";
import { authFetch } from "@/utils/api";
import { formatMoneyIN } from "@/utils/formatNumber";
import useAlert from "@/hooks/useAlert";
import type { Profile } from "@/types/profile";

export type ExternalCashFlowRow = {
  id: number;
  profile_id: number;
  client_id: string;
  user_email: string;
  broker_name: string;
  flow_date: string;
  suggested_amount: number;
  amount: number;
  status: "suggested" | "confirmed" | "rejected" | string;
  prev_tav: number | null;
  tav: number | null;
  known_e1_pnl: number | null;
  known_e2_pnl: number | null;
  note: string;
  updated_at?: string | null;
};

type StatusFilter = "all" | "suggested" | "confirmed" | "rejected";

type ListResponse = {
  count: number;
  page: number;
  page_size: number;
  num_pages: number;
  results: ExternalCashFlowRow[];
};

const PAGE_SIZE = 50;

const TIP =
  "Suggested when |Δ total account value| is at least 5% of the previous day (or first funding from ₹0). Amount is the raw TAV change. Positive = deposit, negative = withdrawal. Only confirmed rows affect XIRR. Re-scan updates suggested rows and drops stale ones.";

function signedClass(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "text-base-content/60";
  if (value > 0) return "text-success tabular-nums";
  if (value < 0) return "text-error tabular-nums";
  return "text-base-content/75 tabular-nums";
}

function formatAmt(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return formatMoneyIN(value);
}

/** External flow as % of previous TAV (same base as the suggest threshold). */
function changePctOfPrevTav(
  amount: number | null | undefined,
  prevTav: number | null | undefined
): number | null {
  if (amount == null || Number.isNaN(amount)) return null;
  if (prevTav == null || Number.isNaN(prevTav) || prevTav === 0) return null;
  return (amount / prevTav) * 100;
}

function formatChangePct(pct: number | null | undefined): string {
  if (pct == null || Number.isNaN(pct)) return "—";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return "—";
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusBadge(status: string): string {
  if (status === "confirmed") return "badge-success";
  if (status === "rejected") return "badge-ghost";
  return "badge-warning";
}

function profileOptionLabel(p: Profile): string {
  const clientId = (p.broker_user_id || "").trim() || `#${p.id}`;
  const email = p.user?.email || "";
  const broker = p.broker_name || "";
  return email
    ? `${clientId} · ${broker} · ${email}`
    : `${clientId} · ${broker}`;
}

type ExternalCashFlowsPanelProps = {
  profiles?: Profile[];
};

export default function ExternalCashFlowsPanel({
  profiles = [],
}: ExternalCashFlowsPanelProps) {
  const alert = useAlert();
  const alertRef = useRef(alert);
  alertRef.current = alert;
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("suggested");
  const [profileId, setProfileId] = useState<number | "all">("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [amountEdits, setAmountEdits] = useState<Record<number, string>>({});

  const profileOptions = useMemo(
    () =>
      [...profiles].sort((a, b) =>
        profileOptionLabel(a).localeCompare(profileOptionLabel(b), "en", {
          sensitivity: "base",
        })
      ),
    [profiles]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(PAGE_SIZE),
      });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (profileId !== "all") params.set("profile_id", String(profileId));
      const res = await authFetch(`profiles/external-cash-flows/?${params}`);
      if (!res.ok) {
        setData(null);
        alertRef.current.error("Could not load external cash flows");
        return;
      }
      setData((await res.json()) as ListResponse);
    } catch {
      setData(null);
      alertRef.current.error("Could not load external cash flows");
    } finally {
      setLoading(false);
    }
  }, [page, profileId, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, profileId]);

  const patchFlow = async (
    id: number,
    body: { status?: string; amount?: number; note?: string }
  ) => {
    setBusyId(id);
    try {
      const res = await authFetch(`profiles/external-cash-flows/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        alertRef.current.error("Update failed");
        return;
      }
      await load();
    } catch {
      alertRef.current.error("Update failed");
    } finally {
      setBusyId(null);
    }
  };

  const handleSuggest = async () => {
    setSuggesting(true);
    try {
      const qs =
        profileId !== "all" ? `?profile_id=${profileId}` : "";
      const res = await authFetch(
        `profiles/external-cash-flows/suggest/${qs}`,
        { method: "POST" }
      );
      if (!res.ok) {
        alertRef.current.error("Suggest scan failed");
        return;
      }
      const totals = (await res.json()) as {
        created?: number;
        updated?: number;
        skipped_reviewed?: number;
        deleted_stale?: number;
      };
      alertRef.current.success(
        `Scan done: created ${totals.created ?? 0}, updated ${totals.updated ?? 0}, ` +
          `skipped reviewed ${totals.skipped_reviewed ?? 0}, ` +
          `deleted stale ${totals.deleted_stale ?? 0}`
      );
      setStatusFilter("suggested");
      setPage(1);
      await load();
    } catch {
      alertRef.current.error("Suggest scan failed");
    } finally {
      setSuggesting(false);
    }
  };

  const rows = data?.results ?? [];
  const numPages = data?.num_pages ?? 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">External cash flows</h2>
            <button
              type="button"
              className="tooltip tooltip-right cursor-pointer text-base-content/45 hover:text-base-content/70"
              data-tip={TIP}
              aria-label={TIP}
            >
              <Info className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            </button>
          </div>
          <p className="text-xs text-base-content/60">
            Confirm deposits and withdrawals used by report XIRR.{" "}
            {data != null ? `${data.count} row(s)` : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="select select-bordered select-sm max-w-[18rem]"
            value={profileId === "all" ? "all" : String(profileId)}
            onChange={(e) => {
              const v = e.target.value;
              setProfileId(v === "all" ? "all" : Number(v));
            }}
            aria-label="Filter by profile"
          >
            <option value="all">All profiles</option>
            {profileOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {profileOptionLabel(p)}
              </option>
            ))}
          </select>
          <select
            className="select select-bordered select-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            aria-label="Filter by status"
          >
            <option value="suggested">Suggested</option>
            <option value="confirmed">Confirmed</option>
            <option value="rejected">Rejected</option>
            <option value="all">All statuses</option>
          </select>
          <button
            type="button"
            className="btn btn-ghost btn-sm gap-1"
            onClick={() => void load()}
            disabled={loading || suggesting}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden />
            Refresh
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => void handleSuggest()}
            disabled={suggesting || loading}
            title={
              profileId !== "all"
                ? "Re-scan the selected profile only"
                : "Re-scan all profiles"
            }
          >
            {suggesting
              ? "Scanning…"
              : profileId !== "all"
                ? "Re-scan profile"
                : "Re-scan suggestions"}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-base-300 bg-base-100 shadow-sm">
        <table className="table table-zebra table-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-base-content/60">
              <th>Client</th>
              <th className="text-right">Date</th>
              <th className="text-right">Suggested</th>
              <th className="text-right">Amount</th>
              <th className="text-right" title="Amount ÷ previous total account value">
                Change %
              </th>
              <th className="text-right">Prev TAV</th>
              <th className="text-right">TAV</th>
              <th className="text-right">E1</th>
              <th className="text-right">E2</th>
              <th>Status</th>
              <th>Note</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              [...Array(4)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={12}>
                    <div className="h-8 animate-pulse rounded bg-base-300/40" />
                  </td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-12 text-center text-base-content/55">
                  No cash flows for this filter. Run a re-scan after margin snapshots exist.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const editValue =
                  amountEdits[row.id] ?? String(row.amount ?? "");
                const busy = busyId === row.id;
                const editedAmount = Number(editValue);
                const changePct = changePctOfPrevTav(
                  Number.isFinite(editedAmount) ? editedAmount : row.amount,
                  row.prev_tav
                );
                return (
                  <tr key={row.id}>
                    <td className="min-w-[10rem] max-w-[14rem]">
                      <div className="flex flex-col gap-0.5">
                        <Link
                          href={`/admin/profiles/${row.profile_id}/reports`}
                          className="link link-primary font-mono text-sm font-medium"
                        >
                          {row.client_id || `#${row.profile_id}`}{" "}
                          <span className="text-xs text-base-content/55">
                            {row.broker_name}
                          </span>
                        </Link>
                        <span
                          className="truncate text-xs text-base-content/70"
                          title={row.user_email}
                        >
                          {row.user_email || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="text-right whitespace-nowrap">
                      {formatDate(row.flow_date)}
                    </td>
                    <td className={`text-right ${signedClass(row.suggested_amount)}`}>
                      {formatAmt(row.suggested_amount)}
                    </td>
                    <td className="text-right">
                      <input
                        type="number"
                        step="0.01"
                        className="input input-bordered input-xs w-28 text-right tabular-nums"
                        value={editValue}
                        disabled={busy}
                        onChange={(e) =>
                          setAmountEdits((prev) => ({
                            ...prev,
                            [row.id]: e.target.value,
                          }))
                        }
                        onBlur={() => {
                          const parsed = Number(editValue);
                          if (
                            !Number.isFinite(parsed) ||
                            Math.abs(parsed - row.amount) < 0.005
                          ) {
                            return;
                          }
                          void patchFlow(row.id, { amount: parsed });
                        }}
                      />
                    </td>
                    <td
                      className={`text-right font-medium ${signedClass(changePct)}`}
                      title="Amount as % of previous total account value"
                    >
                      {formatChangePct(changePct)}
                    </td>
                    <td className="text-right tabular-nums text-base-content/70">
                      {formatAmt(row.prev_tav)}
                    </td>
                    <td className="text-right tabular-nums text-base-content/70">
                      {formatAmt(row.tav)}
                    </td>
                    <td className={`text-right ${signedClass(row.known_e1_pnl)}`}>
                      {formatAmt(row.known_e1_pnl)}
                    </td>
                    <td className={`text-right ${signedClass(row.known_e2_pnl)}`}>
                      {formatAmt(row.known_e2_pnl)}
                    </td>
                    <td>
                      <span className={`badge badge-sm ${statusBadge(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="max-w-[12rem]">
                      <span
                        className="line-clamp-2 text-xs text-base-content/65"
                        title={row.note || undefined}
                      >
                        {row.note || "—"}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex flex-wrap justify-end gap-1">
                        {row.status !== "confirmed" ? (
                          <button
                            type="button"
                            className="btn btn-success btn-xs"
                            disabled={busy}
                            onClick={() =>
                              void patchFlow(row.id, { status: "confirmed" })
                            }
                          >
                            Confirm
                          </button>
                        ) : null}
                        {row.status !== "rejected" ? (
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            disabled={busy}
                            onClick={() =>
                              void patchFlow(row.id, { status: "rejected" })
                            }
                          >
                            Reject
                          </button>
                        ) : null}
                        {row.status !== "suggested" ? (
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            disabled={busy}
                            onClick={() =>
                              void patchFlow(row.id, { status: "suggested" })
                            }
                          >
                            Reset
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {numPages > 1 ? (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <span className="text-xs text-base-content/60">
            Page {page} / {numPages}
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={page >= numPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
