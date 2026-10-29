"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, RefreshCw, Search, X } from "lucide-react";
import { authFetch } from "@/utils/api";
import { formatMoneyIN } from "@/utils/formatNumber";
import useAlert from "@/hooks/useAlert";
import { Profile } from "@/types/profile";

type CashFlowStatus = "pending" | "approved" | "rejected";

type CashFlowRow = {
  id: number;
  profile_id: number;
  profile_email?: string | null;
  profile_label?: string | null;
  flow_date: string;
  amount: number;
  kind: string;
  note: string;
  status: CashFlowStatus;
  reviewed_at?: string | null;
};

type CashFlowListResponse = {
  count: number;
  results: CashFlowRow[];
  xirr?: number | null;
  xirr_gain?: number | null;
  xirr_as_of?: string | null;
};

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

function formatXirr(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(2)}%`;
}

function signedClass(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "text-base-content/60";
  if (value > 0) return "text-success font-medium tabular-nums";
  if (value < 0) return "text-error font-medium tabular-nums";
  return "text-base-content/75 tabular-nums";
}

export default function CashFlowPanel() {
  const alert = useAlert();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileId, setProfileId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [rows, setRows] = useState<CashFlowRow[]>([]);
  const [xirr, setXirr] = useState<number | null>(null);
  const [xirrGain, setXirrGain] = useState<number | null>(null);
  const [xirrAsOf, setXirrAsOf] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);

  const loadProfiles = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: "1",
        page_size: "200",
        is_active: "true",
      });
      const res = await authFetch(`profiles/?${params.toString()}`);
      if (!res.ok) return;
      const data = await res.json();
      setProfiles(Array.isArray(data?.results) ? data.results : []);
    } catch {
      /* ignore */
    }
  }, []);

  const loadFlows = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (profileId) params.set("profile_id", profileId);
      if (statusFilter) params.set("status", statusFilter);
      const q = params.toString();
      const res = await authFetch(
        q ? `profiles/cash-flows/?${q}` : "profiles/cash-flows/"
      );
      if (!res.ok) {
        alert.error("Failed to load cash flows");
        return;
      }
      const data = (await res.json()) as CashFlowListResponse;
      setRows(data.results || []);
      setXirr(data.xirr ?? null);
      setXirrGain(data.xirr_gain ?? null);
      setXirrAsOf(data.xirr_as_of ?? null);
    } catch {
      alert.error("Failed to load cash flows");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- alert is stable enough for this panel
  }, [profileId, statusFilter]);

  useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);

  useEffect(() => {
    void loadFlows();
  }, [loadFlows]);

  const profileOptions = useMemo(() => {
    return profiles.map((p) => {
      const name = `${p.user?.first_name || ""} ${p.user?.last_name || ""}`.trim();
      const label = name || p.user?.email || `Profile ${p.id}`;
      return { id: p.id, label: `${label} · ${p.broker_name} · HID ${p.id}` };
    });
  }, [profiles]);

  async function review(id: number, action: "approve" | "reject") {
    setActingId(id);
    try {
      const res = await authFetch(`profiles/cash-flows/${id}/${action}/`, {
        method: "POST",
      });
      if (!res.ok) {
        alert.error(`Failed to ${action} cash flow`);
        return;
      }
      const updated = (await res.json()) as CashFlowRow & {
        xirr?: number | null;
        xirr_gain?: number | null;
        xirr_as_of?: string | null;
      };
      // Apply cached XIRR from this profile immediately (reject of approved must refresh gain).
      if (profileId && String(updated.profile_id) === profileId) {
        setXirr(updated.xirr ?? null);
        setXirrGain(updated.xirr_gain ?? null);
        setXirrAsOf(updated.xirr_as_of ?? null);
      }
      if (action === "approve") {
        alert.success("Cash flow approved");
      } else {
        alert.success("Cash flow rejected");
      }
      await loadFlows();
    } catch {
      alert.error(`Failed to ${action} cash flow`);
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="form-control w-full max-w-md">
          <span className="label-text text-xs">Profile</span>
          <select
            className="select select-bordered select-sm"
            value={profileId}
            onChange={(e) => setProfileId(e.target.value)}
          >
            <option value="">All profiles</option>
            {profileOptions.map((p) => (
              <option key={p.id} value={String(p.id)}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label className="form-control w-full max-w-xs">
          <span className="label-text text-xs">Status</span>
          <select
            className="select select-bordered select-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
        <button
          type="button"
          className="btn btn-primary btn-sm gap-2"
          onClick={() => void loadFlows()}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {profileId ? (
        <div className="rounded-xl border border-base-300 bg-base-100 px-4 py-3 text-sm shadow-sm">
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <span>
              XIRR{" "}
              <strong className={signedClass(xirr)}>{formatXirr(xirr)}</strong>
            </span>
            <span>
              Gain{" "}
              <strong className={signedClass(xirrGain)}>
                {xirrGain == null ? "—" : formatMoneyIN(xirrGain)}
              </strong>
            </span>
            <span className="text-base-content/60">
              As of {formatDate(xirrAsOf)}
            </span>
          </div>
          <p className="mt-1 text-xs text-base-content/50">
            Cached from approved cash flows only. Approve adds a row; reject on
            an approved row removes it and refreshes gain.
          </p>
        </div>
      ) : (
        <p className="text-sm text-base-content/60">
          Select a profile to see its approved XIRR.
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-base-300 bg-base-100 shadow-sm">
        <table className="table table-zebra table-sm md:table-md">
          <thead>
            <tr>
              <th>Date</th>
              <th>Profile</th>
              <th className="text-right">Amount</th>
              <th>Kind</th>
              <th>Note</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-base-content/60">
                  Loading…
                </td>
              </tr>
            ) : null}
            {!loading && rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-base-content/60">
                  <span className="inline-flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    No cash flows match these filters
                  </span>
                </td>
              </tr>
            ) : null}
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="whitespace-nowrap">{formatDate(row.flow_date)}</td>
                <td className="min-w-[10rem]">
                  <div className="font-medium">
                    {row.profile_label || `Profile ${row.profile_id}`}
                  </div>
                  <div className="text-xs text-base-content/50">
                    HID {row.profile_id}
                    {row.profile_email ? ` · ${row.profile_email}` : ""}
                  </div>
                </td>
                <td className={`text-right ${signedClass(row.amount)}`}>
                  {formatMoneyIN(row.amount)}
                </td>
                <td className="capitalize">{row.kind}</td>
                <td className="max-w-[20rem] truncate text-xs" title={row.note}>
                  {row.note || "—"}
                </td>
                <td>
                  <span
                    className={`badge badge-sm capitalize ${
                      row.status === "approved"
                        ? "badge-success"
                        : row.status === "rejected"
                          ? "badge-error"
                          : "badge-warning"
                    }`}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="text-right">
                  <div className="inline-flex gap-1">
                    {row.status !== "approved" ? (
                      <button
                        type="button"
                        className="btn btn-success btn-xs gap-1"
                        disabled={actingId === row.id}
                        onClick={() => void review(row.id, "approve")}
                      >
                        <Check className="h-3 w-3" />
                        Approve
                      </button>
                    ) : null}
                    {row.status !== "rejected" ? (
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs gap-1 text-error"
                        disabled={actingId === row.id}
                        onClick={() => void review(row.id, "reject")}
                      >
                        <X className="h-3 w-3" />
                        Reject
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
