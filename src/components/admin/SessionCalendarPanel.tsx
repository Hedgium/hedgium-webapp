"use client";

import { authFetch } from "@/utils/api";
import useAlert from "@/hooks/useAlert";
import { CalendarDays, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type SessionException = {
  id: number;
  date: string;
  venue: "NSE" | "MCX" | string;
  kind: "closed" | "evening_only" | string;
  note: string;
};

const VENUE_OPTIONS = ["NSE", "MCX"] as const;
const KIND_OPTIONS = [
  { value: "closed", label: "Closed" },
  { value: "evening_only", label: "Evening only (17:30–23:30)" },
] as const;

function normalizeNext(next: string | null): string | null {
  if (!next) return null;
  return next.includes("api/") ? next.split("api/")[1] : next;
}

function kindLabel(kind: string): string {
  if (kind === "evening_only") return "Evening only";
  if (kind === "closed") return "Closed";
  return kind;
}

export default function SessionCalendarPanel() {
  const [rows, setRows] = useState<SessionException[]>([]);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [venueFilter, setVenueFilter] = useState("");
  const [kindFilter, setKindFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SessionException | null>(null);
  const [saving, setSaving] = useState(false);
  const [formDate, setFormDate] = useState("");
  const [formVenue, setFormVenue] = useState<"NSE" | "MCX">("NSE");
  const [formKind, setFormKind] = useState<"closed" | "evening_only">("closed");
  const [formNote, setFormNote] = useState("");

  const alert = useAlert();
  const alertRef = useRef(alert);
  alertRef.current = alert;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const fetchRows = useCallback(
    async (nextPageUrl?: string) => {
      setLoading(true);
      try {
        let endpoint: string;
        if (nextPageUrl) {
          if (/^https?:\/\//i.test(nextPageUrl)) {
            try {
              const parsed = new URL(nextPageUrl);
              const q = parsed.search ? parsed.search.slice(1) : "";
              endpoint = q
                ? `market/session-exceptions/?${q}`
                : "market/session-exceptions/";
            } catch {
              endpoint = "market/session-exceptions/";
            }
          } else {
            endpoint = nextPageUrl;
          }
        } else {
          const params = new URLSearchParams();
          params.set("page_size", "50");
          if (debouncedSearch) params.set("search", debouncedSearch);
          if (venueFilter) params.set("venue", venueFilter);
          if (kindFilter) params.set("kind", kindFilter);
          endpoint = `market/session-exceptions/?${params.toString()}`;
        }

        const res = await authFetch(endpoint);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(
            (err as { detail?: string }).detail || "Failed to fetch session calendar"
          );
        }
        const data = await res.json();
        const resultRows = (data.results || []) as SessionException[];

        if (nextPageUrl) {
          setRows((prev) => [...prev, ...resultRows]);
        } else {
          setRows(resultRows);
        }
        setNextPage(normalizeNext(data.next as string | null));
      } catch (e) {
        console.error(e);
        alertRef.current.error(
          e instanceof Error ? e.message : "Failed to fetch session calendar"
        );
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, venueFilter, kindFilter]
  );

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const openCreate = () => {
    setEditing(null);
    setFormDate("");
    setFormVenue("NSE");
    setFormKind("closed");
    setFormNote("");
    setModalOpen(true);
  };

  const openEdit = (row: SessionException) => {
    setEditing(row);
    setFormDate(row.date);
    setFormVenue(row.venue === "MCX" ? "MCX" : "NSE");
    setFormKind(row.kind === "evening_only" ? "evening_only" : "closed");
    setFormNote(row.note || "");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDate) {
      alert.error("Date is required");
      return;
    }
    if (formKind === "evening_only" && formVenue !== "MCX") {
      alert.error("Evening only is valid only for MCX");
      return;
    }

    setSaving(true);
    try {
      const body = JSON.stringify({
        date: formDate,
        venue: formVenue,
        kind: formKind,
        note: formNote.trim(),
      });

      if (editing) {
        const res = await authFetch(`market/session-exceptions/${editing.id}/`, {
          method: "PATCH",
          body,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { detail?: string }).detail || "Update failed");
        }
        const updated = (await res.json()) as SessionException;
        setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        alert.success("Session exception updated");
      } else {
        const res = await authFetch("market/session-exceptions/", {
          method: "POST",
          body,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { detail?: string }).detail || "Create failed");
        }
        const created = (await res.json()) as SessionException;
        setRows((prev) => [created, ...prev]);
        alert.success("Session exception created");
      }

      closeModal();
    } catch (e) {
      console.error(e);
      alert.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: SessionException) => {
    if (!confirm(`Delete ${row.date} ${row.venue} (${kindLabel(row.kind)})?`)) return;
    try {
      const res = await authFetch(`market/session-exceptions/${row.id}/`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail || "Delete failed");
      }
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      alert.success("Session exception deleted");
    } catch (e) {
      console.error(e);
      alert.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const kindChoices =
    formVenue === "NSE"
      ? KIND_OPTIONS.filter((k) => k.value === "closed")
      : KIND_OPTIONS;

  return (
    <>
      <div className="mb-4 rounded-lg border border-base-300/80 bg-base-200/30 px-4 py-3 text-sm text-base-content/70">
        <div className="flex items-start gap-2">
          <CalendarDays className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <p>
            No row means a normal weekday session. Enter NSE and MCX separately from
            exchange circulars. On equity holidays with evening commodity trade, add NSE{" "}
            <span className="font-medium text-base-content">closed</span> and MCX{" "}
            <span className="font-medium text-base-content">evening only</span>.
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-[12rem] flex-1 flex-wrap items-center gap-2">
          <div className="relative max-w-md min-w-[12rem] flex-1">
            <Search className="absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 opacity-50" />
            <input
              type="search"
              placeholder="Search note, venue, kind..."
              aria-label="Search session exceptions"
              className="input input-bordered input-sm w-full pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="select select-bordered select-sm"
            aria-label="Filter by venue"
            value={venueFilter}
            onChange={(e) => setVenueFilter(e.target.value)}
          >
            <option value="">All venues</option>
            {VENUE_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <select
            className="select select-bordered select-sm"
            aria-label="Filter by kind"
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value)}
          >
            <option value="">All kinds</option>
            {KIND_OPTIONS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="btn btn-primary btn-sm gap-2" onClick={openCreate}>
          <Plus className="size-4" />
          Add exception
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-base-300 bg-base-100">
        <table className="table table-sm">
          <thead>
            <tr className="bg-base-200">
              <th>Date</th>
              <th>Venue</th>
              <th>Kind</th>
              <th>Note</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-base-content/60">
                  Loading session calendar...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-base-content/60">
                  No session exceptions. Normal Mon–Fri hours apply.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hover">
                  <td className="font-mono font-semibold">{r.date}</td>
                  <td>{r.venue}</td>
                  <td>
                    <span
                      className={`badge badge-sm ${
                        r.kind === "evening_only" ? "badge-warning" : "badge-ghost"
                      }`}
                    >
                      {kindLabel(r.kind)}
                    </span>
                  </td>
                  <td className="max-w-xs truncate text-base-content/70">
                    {r.note || "—"}
                  </td>
                  <td className="text-end">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        title="Edit"
                        onClick={() => openEdit(r)}
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs text-error"
                        title="Delete"
                        onClick={() => void handleDelete(r)}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {nextPage && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => void fetchRows(nextPage)}
            disabled={loading}
          >
            Load more
          </button>
        </div>
      )}

      {modalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="mb-4 text-lg font-bold">
              {editing ? `Edit exception #${editing.id}` : "Add session exception"}
            </h3>
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
              <label className="form-control w-full">
                <span className="label-text text-sm">Date (IST)</span>
                <input
                  type="date"
                  className="input input-bordered input-sm w-full"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                />
              </label>
              <label className="form-control w-full">
                <span className="label-text text-sm">Venue</span>
                <select
                  className="select select-bordered select-sm w-full"
                  value={formVenue}
                  onChange={(e) => {
                    const v = e.target.value === "MCX" ? "MCX" : "NSE";
                    setFormVenue(v);
                    if (v === "NSE") setFormKind("closed");
                  }}
                  required
                >
                  {VENUE_OPTIONS.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-control w-full">
                <span className="label-text text-sm">Kind</span>
                <select
                  className="select select-bordered select-sm w-full"
                  value={formKind}
                  onChange={(e) =>
                    setFormKind(
                      e.target.value === "evening_only" ? "evening_only" : "closed"
                    )
                  }
                  required
                >
                  {kindChoices.map((k) => (
                    <option key={k.value} value={k.value}>
                      {k.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-control w-full">
                <span className="label-text text-sm">Note (optional)</span>
                <input
                  className="input input-bordered input-sm w-full"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="e.g. Diwali / Holi circular"
                  maxLength={255}
                />
              </label>
              <div className="modal-action">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving..." : editing ? "Save" : "Create"}
                </button>
              </div>
            </form>
          </div>
          <button
            type="button"
            className="modal-backdrop bg-black/50"
            aria-label="Close"
            onClick={closeModal}
          />
        </div>
      )}
    </>
  );
}
