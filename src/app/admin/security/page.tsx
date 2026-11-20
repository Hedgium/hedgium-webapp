"use client";

import { authFetch } from "@/utils/api";
import useAlert from "@/hooks/useAlert";
import { Pencil, Plus, Search, Shield, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type LoginEventRow = {
  id: number;
  user_id: number | null;
  user_email: string | null;
  attempted_username: string;
  ip_address: string;
  user_agent: string;
  outcome: string;
  created_at: string;
};

type AllowedIpRow = {
  id: number;
  cidr: string;
  label: string;
  is_active: boolean;
  expires_at: string | null;
  is_permanent: boolean;
  created_at: string;
};

const OUTCOMES = [
  { value: "", label: "All outcomes" },
  { value: "success", label: "Success" },
  { value: "bad_password", label: "Bad password" },
  { value: "bad_2fa", label: "Bad 2FA" },
  { value: "expired_2fa", label: "Expired 2FA" },
] as const;

function normalizeNext(next: string | null): string | null {
  if (!next) return null;
  return next.includes("api/") ? next.split("api/")[1] : next;
}

function outcomeBadgeClass(outcome: string): string {
  if (outcome === "success") return "badge-success";
  if (outcome === "bad_password") return "badge-error";
  if (outcome === "bad_2fa" || outcome === "expired_2fa") return "badge-warning";
  return "badge-ghost";
}

function outcomeLabel(outcome: string): string {
  return OUTCOMES.find((o) => o.value === outcome)?.label || outcome;
}

export default function AdminSecurityPage() {
  const alert = useAlert();
  const alertRef = useRef(alert);
  alertRef.current = alert;

  const [events, setEvents] = useState<LoginEventRow[]>([]);
  const [eventsNext, setEventsNext] = useState<string | null>(null);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventSearch, setEventSearch] = useState("");
  const [debouncedEventSearch, setDebouncedEventSearch] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState("");

  const [ips, setIps] = useState<AllowedIpRow[]>([]);
  const [ipsNext, setIpsNext] = useState<string | null>(null);
  const [ipsLoading, setIpsLoading] = useState(true);
  const [ipSearch, setIpSearch] = useState("");
  const [debouncedIpSearch, setDebouncedIpSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AllowedIpRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [cidr, setCidr] = useState("");
  const [label, setLabel] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedEventSearch(eventSearch.trim()), 350);
    return () => clearTimeout(t);
  }, [eventSearch]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedIpSearch(ipSearch.trim()), 350);
    return () => clearTimeout(t);
  }, [ipSearch]);

  const fetchEvents = useCallback(
    async (nextPageUrl?: string) => {
      setEventsLoading(true);
      try {
        let endpoint: string;
        if (nextPageUrl) {
          try {
            const parsed = new URL(nextPageUrl);
            const q = parsed.search ? parsed.search.slice(1) : "";
            endpoint = q ? `users/login-events/?${q}` : "users/login-events/";
          } catch {
            endpoint = "users/login-events/";
          }
        } else {
          const params = new URLSearchParams();
          params.set("page_size", "50");
          if (debouncedEventSearch) params.set("search", debouncedEventSearch);
          if (outcomeFilter) params.set("outcome", outcomeFilter);
          endpoint = `users/login-events/?${params.toString()}`;
        }

        const res = await authFetch(endpoint);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { detail?: string }).detail || "Failed to fetch login events");
        }
        const data = await res.json();
        const rows = (data.results || []) as LoginEventRow[];
        if (nextPageUrl) {
          setEvents((prev) => [...prev, ...rows]);
        } else {
          setEvents(rows);
        }
        setEventsNext(normalizeNext(data.next as string | null));
      } catch (e) {
        console.error(e);
        alertRef.current.error(
          e instanceof Error ? e.message : "Failed to fetch login events"
        );
      } finally {
        setEventsLoading(false);
      }
    },
    [debouncedEventSearch, outcomeFilter]
  );

  const fetchIps = useCallback(
    async (nextPageUrl?: string) => {
      setIpsLoading(true);
      try {
        let endpoint: string;
        if (nextPageUrl) {
          try {
            const parsed = new URL(nextPageUrl);
            const q = parsed.search ? parsed.search.slice(1) : "";
            endpoint = q ? `users/admin-allowed-ips/?${q}` : "users/admin-allowed-ips/";
          } catch {
            endpoint = "users/admin-allowed-ips/";
          }
        } else {
          const params = new URLSearchParams();
          params.set("page_size", "50");
          if (debouncedIpSearch) params.set("search", debouncedIpSearch);
          endpoint = `users/admin-allowed-ips/?${params.toString()}`;
        }

        const res = await authFetch(endpoint);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { detail?: string }).detail || "Failed to fetch allowed IPs");
        }
        const data = await res.json();
        const rows = (data.results || []) as AllowedIpRow[];
        if (nextPageUrl) {
          setIps((prev) => [...prev, ...rows]);
        } else {
          setIps(rows);
        }
        setIpsNext(normalizeNext(data.next as string | null));
      } catch (e) {
        console.error(e);
        alertRef.current.error(
          e instanceof Error ? e.message : "Failed to fetch allowed IPs"
        );
      } finally {
        setIpsLoading(false);
      }
    },
    [debouncedIpSearch]
  );

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    void fetchIps();
  }, [fetchIps]);

  const openCreate = () => {
    setEditing(null);
    setCidr("");
    setLabel("");
    setIsActive(true);
    setModalOpen(true);
  };

  const openEdit = (row: AllowedIpRow) => {
    setEditing(row);
    setCidr(row.cidr);
    setLabel(row.label || "");
    setIsActive(row.is_active);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCidr = cidr.trim();
    if (!cleanCidr) {
      alert.error("IP / CIDR is required");
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        const res = await authFetch(`users/admin-allowed-ips/${editing.id}/`, {
          method: "PATCH",
          body: JSON.stringify({
            cidr: cleanCidr,
            label: label.trim(),
            is_active: isActive,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { detail?: string }).detail || "Update failed");
        }
        const updated = (await res.json()) as AllowedIpRow;
        setIps((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        alert.success("Allowed IP updated");
      } else {
        const res = await authFetch("users/admin-allowed-ips/", {
          method: "POST",
          body: JSON.stringify({
            cidr: cleanCidr,
            label: label.trim(),
            is_active: isActive,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { detail?: string }).detail || "Create failed");
        }
        const created = (await res.json()) as AllowedIpRow;
        setIps((prev) => [created, ...prev]);
        alert.success("Allowed IP added");
      }
      closeModal();
    } catch (err) {
      console.error(err);
      alert.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: AllowedIpRow) => {
    if (!confirm(`Delete allowed IP "${row.label || row.cidr}"?`)) return;
    try {
      const res = await authFetch(`users/admin-allowed-ips/${row.id}/`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail || "Delete failed");
      }
      setIps((prev) => prev.filter((r) => r.id !== row.id));
      alert.success("Allowed IP deleted");
    } catch (err) {
      console.error(err);
      alert.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto lg:px-8 space-y-10">
      <div className="flex items-center gap-3">
        <Shield className="size-8 text-primary" aria-hidden />
        <div>
          <h1 className="text-2xl font-bold">Security</h1>
          <p className="text-sm text-base-content/70">
            Login attempts and webapp admin IP allowlist.
          </p>
        </div>
      </div>

      <section aria-labelledby="allowed-ips-heading">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 id="allowed-ips-heading" className="text-lg font-semibold">
              Allowed IPs
            </h2>
            <p className="text-xs text-base-content/60">
              Admin-added entries are permanent. Self-enrolled IPs expire after 24 hours.
              When any valid entry exists, webapp admin is restricted to these IPs/CIDRs.
            </p>
          </div>
          <button type="button" className="btn btn-primary btn-sm gap-2" onClick={openCreate}>
            <Plus className="size-4" />
            Add IP
          </button>
        </div>

        <div className="relative mb-4 max-w-md">
          <Search className="absolute z-10 left-3 top-1/2 -translate-y-1/2 size-4 opacity-50" />
          <input
            type="search"
            placeholder="Search CIDR or label…"
            aria-label="Search allowed IPs"
            className="input input-bordered input-sm w-full pl-9"
            value={ipSearch}
            onChange={(e) => setIpSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto rounded-lg border border-base-300 bg-base-100">
          <table className="table table-sm">
            <thead>
              <tr className="bg-base-200">
                <th>CIDR / IP</th>
                <th>Label</th>
                <th>Active</th>
                <th>Expiry</th>
                <th>Created</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ipsLoading && ips.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-base-content/60">
                    Loading allowed IPs…
                  </td>
                </tr>
              ) : ips.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-base-content/60">
                    No allowed IPs yet. Admin IP restriction stays open until you add one.
                  </td>
                </tr>
              ) : (
                ips.map((row) => (
                  <tr key={row.id} className="hover">
                    <td className="font-mono text-xs font-semibold">{row.cidr}</td>
                    <td className="text-sm">{row.label || "—"}</td>
                    <td>
                      <span
                        className={`badge badge-sm ${
                          row.is_active ? "badge-success" : "badge-ghost"
                        }`}
                      >
                        {row.is_active ? "Active" : "Off"}
                      </span>
                    </td>
                    <td className="text-xs whitespace-nowrap">
                      {row.is_permanent || !row.expires_at ? (
                        <span className="badge badge-outline badge-sm">Permanent</span>
                      ) : (
                        new Date(row.expires_at).toLocaleString()
                      )}
                    </td>
                    <td className="text-xs whitespace-nowrap">
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                    <td className="text-end">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm min-h-11 min-w-11"
                          title="Edit"
                          aria-label={`Edit ${row.cidr}`}
                          onClick={() => openEdit(row)}
                        >
                          <Pencil className="size-3.5" aria-hidden />
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm min-h-11 min-w-11 text-error"
                          title="Delete"
                          aria-label={`Delete ${row.cidr}`}
                          onClick={() => void handleDelete(row)}
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {ipsNext ? (
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={ipsLoading}
              onClick={() => void fetchIps(ipsNext)}
            >
              {ipsLoading ? "Loading…" : "Load more"}
            </button>
          </div>
        ) : null}
      </section>

      <section aria-labelledby="login-events-heading">
        <div className="mb-4">
          <h2 id="login-events-heading" className="text-lg font-semibold">
            Login events
          </h2>
          <p className="text-xs text-base-content/60">
            Recent password and 2FA outcomes with client IP.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[12rem] max-w-md">
            <Search className="absolute z-10 left-3 top-1/2 -translate-y-1/2 size-4 opacity-50" />
            <input
              type="search"
              placeholder="Search username, email, or IP…"
              aria-label="Search login events"
              className="input input-bordered input-sm w-full pl-9"
              value={eventSearch}
              onChange={(e) => setEventSearch(e.target.value)}
            />
          </div>
          <select
            className="select select-bordered select-sm"
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value)}
            aria-label="Filter by outcome"
          >
            {OUTCOMES.map((o) => (
              <option key={o.value || "all"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto rounded-lg border border-base-300 bg-base-100">
          <table className="table table-sm">
            <thead>
              <tr className="bg-base-200">
                <th>When</th>
                <th>User</th>
                <th>IP</th>
                <th>Outcome</th>
                <th>User agent</th>
              </tr>
            </thead>
            <tbody>
              {eventsLoading && events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-base-content/60">
                    Loading login events…
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-base-content/60">
                    No login events found.
                  </td>
                </tr>
              ) : (
                events.map((row) => (
                  <tr key={row.id} className="hover">
                    <td className="text-xs whitespace-nowrap">
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                    <td className="text-sm">
                      <div className="font-medium">
                        {row.attempted_username || row.user_email || "—"}
                      </div>
                      {row.user_email && row.attempted_username !== row.user_email ? (
                        <div className="text-xs text-base-content/60">{row.user_email}</div>
                      ) : null}
                    </td>
                    <td className="font-mono text-xs">{row.ip_address || "—"}</td>
                    <td>
                      <span className={`badge badge-sm ${outcomeBadgeClass(row.outcome)}`}>
                        {outcomeLabel(row.outcome)}
                      </span>
                    </td>
                    <td
                      className="text-xs text-base-content/70 max-w-[18rem] truncate"
                      title={row.user_agent}
                    >
                      {row.user_agent || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {eventsNext ? (
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={eventsLoading}
              onClick={() => void fetchEvents(eventsNext)}
            >
              {eventsLoading ? "Loading…" : "Load more"}
            </button>
          </div>
        ) : null}
      </section>

      {modalOpen ? (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="font-bold text-lg mb-4">
              {editing ? "Edit allowed IP" : "Add allowed IP"}
            </h3>
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              <label className="form-control w-full">
                <span className="label-text mb-1">IP or CIDR</span>
                <input
                  className="input input-bordered input-sm w-full font-mono"
                  value={cidr}
                  onChange={(e) => setCidr(e.target.value)}
                  placeholder="203.0.113.10 or 203.0.113.0/24"
                  required
                  autoFocus
                />
              </label>
              <label className="form-control w-full">
                <span className="label-text mb-1">Label</span>
                <input
                  className="input input-bordered input-sm w-full"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Office / home"
                />
              </label>
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span className="label-text">Active</span>
              </label>
              <div className="modal-action">
                <button type="button" className="btn btn-ghost btn-sm" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                  {saving ? "Saving…" : editing ? "Save" : "Add"}
                </button>
              </div>
            </form>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button type="button" onClick={closeModal}>
              close
            </button>
          </form>
        </dialog>
      ) : null}
    </div>
  );
}
