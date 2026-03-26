"use client";

import { authFetch } from "@/utils/api";
import { useState, useEffect, useCallback, useRef } from "react";
import useAlert from "@/hooks/useAlert";
import { MessageCircle, Pencil } from "lucide-react";
import LeadsTableSkeleton from "@/components/skeletons/LeadsTableSkeleton";
import {
  TIME_OPTIONS_15MIN,
  parseScheduledAtToLocalDateAndTime,
} from "@/utils/timeOptions";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "918454838304";
const FOLLOW_UP_MESSAGE = "Hi, I'm following up on your Hedgium inquiry.";

const SOURCE_LABELS: Record<string, string> = {
  website: "Website",
  ads: "Ads",
  social_media: "Social media",
  direct_contact: "Direct contact",
  other: "Other",
};

type Lead = {
  id: number;
  mobile: string;
  name: string;
  source: string;
  status: string;
  notes: string;
  created_at: string;
  investment_value: string;
  scheduled_at: string | null;
};

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [editingNotesId, setEditingNotesId] = useState<number | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [editingScheduledAtId, setEditingScheduledAtId] = useState<number | null>(null);
  const [scheduledAtDateDraft, setScheduledAtDateDraft] = useState("");
  const [scheduledAtTimeDraft, setScheduledAtTimeDraft] = useState("09:00");
  const [savingScheduledAt, setSavingScheduledAt] = useState(false);
  const alert = useAlert();
  const alertRef = useRef(alert);
  alertRef.current = alert;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const fetchLeads = useCallback(
    async (nextPageUrl?: string) => {
      setLoading(true);
      try {
        let endpoint: string;
        if (nextPageUrl) {
          try {
            const parsed = new URL(nextPageUrl);
            const query = parsed.search ? parsed.search.slice(1) : "";
            endpoint = query ? "leads/?" + query : "leads/";
          } catch {
            endpoint = "leads/";
          }
        } else {
          const params = new URLSearchParams();
          params.set("page_size", "20");
          if (statusFilter) params.set("status", statusFilter);
          if (sourceFilter) params.set("source", sourceFilter);
          if (debouncedSearch) params.set("search", debouncedSearch);
          endpoint = "leads/?" + params.toString();
        }
        const res = await authFetch(endpoint);
        const data = await res.json();
        setLeads(data.results || []);
        setNextPage(data.next || null);
      } catch (e) {
        console.error(e);
        alertRef.current.error("Failed to fetch leads");
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, sourceFilter, debouncedSearch]
  );

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const fetchNext = () => {
    if (!nextPage) return;
    fetchLeads(nextPage);
  };

  const handleStatusChange = async (leadId: number, newStatus: string) => {
    try {
      const res = await authFetch(`leads/${leadId}/`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)));
        alert.success("Status updated");
      } else {
        alert.error("Failed to update status");
      }
    } catch {
      alert.error("Failed to update status");
    }
  };

  const saveNotes = async (leadId: number) => {
    setSavingNotes(true);
    try {
      const res = await authFetch(`leads/${leadId}/`, {
        method: "PATCH",
        body: JSON.stringify({ notes: notesDraft }),
      });
      if (res.ok) {
        setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, notes: notesDraft } : l)));
        setEditingNotesId(null);
        alert.success("Notes saved");
      } else {
        alert.error("Failed to save notes");
      }
    } catch {
      alert.error("Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  };

  const saveScheduledAt = async (leadId: number) => {
    setSavingScheduledAt(true);
    try {
      const iso = new Date(`${scheduledAtDateDraft}T${scheduledAtTimeDraft}`).toISOString();
      const res = await authFetch(`leads/${leadId}/`, {
        method: "PATCH",
        body: JSON.stringify({ scheduled_at: iso }),
      });
      if (res.ok) {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === leadId ? { ...l, scheduled_at: iso } : l
          )
        );
        setEditingScheduledAtId(null);
        alert.success("Scheduled time updated");
      } else {
        alert.error("Failed to update scheduled time");
      }
    } catch {
      alert.error("Failed to update scheduled time");
    } finally {
      setSavingScheduledAt(false);
    }
  };

  const openWhatsApp = (mobile: string) => {
    const num = mobile.replace(/\D/g, "");
    const link = `https://wa.me/${num}?text=${encodeURIComponent(FOLLOW_UP_MESSAGE)}`;
    window.open(link, "_blank");
  };

  return (
    <div className="p-6 max-w-7xl mx-auto lg:px-8">
      <h1 className="text-2xl font-bold mb-6">CTA Leads</h1>

      <div className="bg-base-200 rounded-lg p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <label className="text-sm font-medium">Filters:</label>
          <input
            type="text"
            placeholder="Search mobile or name..."
            className="input input-bordered input-sm w-48"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select select-bordered select-sm w-40"
          >
            <option value="">All status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="scheduled">Scheduled</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="select select-bordered select-sm w-48"
          >
            <option value="">All source</option>
            <option value="website">Website</option>
            <option value="ads">Ads</option>
            <option value="social_media">Social media</option>
            <option value="direct_contact">Direct contact</option>
            <option value="other">Other</option>
          </select>
          {(statusFilter || sourceFilter || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter("");
                setSourceFilter("");
                setSearchQuery("");
              }}
              className="btn btn-ghost btn-sm"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <LeadsTableSkeleton rows={8} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-base-300">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Created</th>
                  <th>Mobile</th>
                  <th>Name</th>
                  <th>Source</th>
                  <th className="w-36 min-w-[140px]">Status</th>
                  <th>Investment</th>
                  <th>Scheduled at</th>
                  <th className="min-w-[220px] max-w-[320px]">Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td className="text-sm text-base-content/80">
                      {lead.created_at ? new Date(lead.created_at).toLocaleString() : "—"}
                    </td>
                    <td className="font-medium">{lead.mobile}</td>
                    <td>{lead.name || "—"}</td>
                    <td>
                      <span className="badge badge-ghost badge-sm">
                        {SOURCE_LABELS[lead.source] ?? (lead.source || "—")}
                      </span>
                    </td>
                    <td className="w-36 min-w-[140px]">
                      <select
                        className="select select-bordered select-sm w-full"
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td className="text-sm text-base-content/80">
                      {lead.investment_value
                        ? lead.investment_value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
                        : "—"}
                    </td>
                    <td className="text-sm text-base-content/80">
                      {editingScheduledAtId === lead.id ? (
                        <div className="flex flex-col gap-2">
                          <input
                            type="date"
                            className="input input-bordered input-sm w-full"
                            value={scheduledAtDateDraft}
                            onChange={(e) => setScheduledAtDateDraft(e.target.value)}
                          />
                          <select
                            className="select select-bordered select-sm w-full"
                            value={scheduledAtTimeDraft}
                            onChange={(e) => setScheduledAtTimeDraft(e.target.value)}
                          >
                            {TIME_OPTIONS_15MIN.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              disabled={savingScheduledAt}
                              onClick={() => saveScheduledAt(lead.id)}
                            >
                              {savingScheduledAt ? "..." : "Save"}
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => setEditingScheduledAtId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span>
                            {lead.scheduled_at
                              ? new Date(lead.scheduled_at).toLocaleString()
                              : "—"}
                          </span>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs btn-square shrink-0"
                            onClick={() => {
                              const { date, time } = parseScheduledAtToLocalDateAndTime(lead.scheduled_at);
                              setScheduledAtDateDraft(date);
                              setScheduledAtTimeDraft(time);
                              setEditingScheduledAtId(lead.id);
                            }}
                            title="Edit scheduled time"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="min-w-[220px] max-w-[280px]">
                      {editingNotesId === lead.id ? (
                        <div className="flex flex-col gap-2">
                          <textarea
                            rows={4}
                            className="textarea textarea-bordered textarea-sm w-full min-h-[80px]"
                            value={notesDraft}
                            onChange={(e) => setNotesDraft(e.target.value)}
                            placeholder="Notes..."
                          />
                          <div className="flex gap-1">
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              disabled={savingNotes}
                              onClick={() => saveNotes(lead.id)}
                            >
                              {savingNotes ? "..." : "Save"}
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                setEditingNotesId(null);
                                setNotesDraft("");
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="text-sm block max-w-[280px] whitespace-pre-wrap break-words" title={lead.notes}>
                            {lead.notes || "—"}
                          </span>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs btn-square shrink-0"
                            onClick={() => {
                              setEditingNotesId(lead.id);
                              setNotesDraft(lead.notes || "");
                            }}
                            title="Edit notes"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs gap-1"
                        onClick={() => openWhatsApp(lead.mobile)}
                        title="Open WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {nextPage && (
            <div className="flex justify-center mt-4">
              <button type="button" onClick={fetchNext} className="btn btn-outline btn-sm">
                Load more
              </button>
            </div>
          )}

          {!loading && leads.length === 0 && (
            <p className="text-center text-base-content/60 py-8">No leads found.</p>
          )}
        </>
      )}
    </div>
  );
}
