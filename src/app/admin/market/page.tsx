"use client";

import { authFetch } from "@/utils/api";
import useAlert from "@/hooks/useAlert";
import { CandlestickChart, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type StrikeStep = {
  id: number;
  symbol: string;
  strike_step: number | string;
};

const MARKET_TABS = [{ id: "strike-steps", label: "Strike steps" }] as const;

function normalizeNext(next: string | null): string | null {
  if (!next) return null;
  return next.includes("api/") ? next.split("api/")[1] : next;
}

export default function AdminMarketPage() {
  const [activeTab, setActiveTab] = useState<(typeof MARKET_TABS)[number]["id"]>(
    "strike-steps"
  );
  const [rows, setRows] = useState<StrikeStep[]>([]);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StrikeStep | null>(null);
  const [saving, setSaving] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [strikeStep, setStrikeStep] = useState("");

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
          try {
            const parsed = new URL(nextPageUrl);
            const q = parsed.search ? parsed.search.slice(1) : "";
            endpoint = q ? `market/strike-steps/?${q}` : "market/strike-steps/";
          } catch {
            endpoint = "market/strike-steps/";
          }
        } else {
          const params = new URLSearchParams();
          params.set("page_size", "50");
          if (debouncedSearch) params.set("search", debouncedSearch);
          endpoint = `market/strike-steps/?${params.toString()}`;
        }

        const res = await authFetch(endpoint);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { detail?: string }).detail || "Failed to fetch strike steps");
        }
        const data = await res.json();
        const resultRows = (data.results || []) as StrikeStep[];

        if (nextPageUrl) {
          setRows((prev) => [...prev, ...resultRows]);
        } else {
          setRows(resultRows);
        }
        setNextPage(normalizeNext(data.next as string | null));
      } catch (e) {
        console.error(e);
        alertRef.current.error(
          e instanceof Error ? e.message : "Failed to fetch strike steps"
        );
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch]
  );

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const openCreate = () => {
    setEditing(null);
    setSymbol("");
    setStrikeStep("");
    setModalOpen(true);
  };

  const openEdit = (row: StrikeStep) => {
    setEditing(row);
    setSymbol(row.symbol);
    setStrikeStep(String(row.strike_step));
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSymbol = symbol.trim().toUpperCase();
    const parsedStep = Number(strikeStep);
    if (!cleanSymbol) {
      alert.error("Symbol is required");
      return;
    }
    if (!Number.isFinite(parsedStep) || parsedStep <= 0) {
      alert.error("Strike step must be a positive number");
      return;
    }

    setSaving(true);
    try {
      const body = JSON.stringify({
        symbol: cleanSymbol,
        strike_step: parsedStep,
      });

      if (editing) {
        const res = await authFetch(`market/strike-steps/${editing.id}/`, {
          method: "PATCH",
          body,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { detail?: string }).detail || "Update failed");
        }
        const updated = (await res.json()) as StrikeStep;
        setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        alert.success("Strike step updated");
      } else {
        const res = await authFetch("market/strike-steps/", {
          method: "POST",
          body,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { detail?: string }).detail || "Create failed");
        }
        const created = (await res.json()) as StrikeStep;
        setRows((prev) => [created, ...prev]);
        alert.success("Strike step created");
      }

      closeModal();
    } catch (e) {
      console.error(e);
      alert.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: StrikeStep) => {
    if (!confirm(`Delete strike step for ${row.symbol}?`)) return;
    try {
      const res = await authFetch(`market/strike-steps/${row.id}/`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail || "Delete failed");
      }
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      alert.success("Strike step deleted");
    } catch (e) {
      console.error(e);
      alert.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <CandlestickChart className="size-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Market</h1>
            <p className="text-sm text-base-content/70">
              Admin controls for market-related configurations.
            </p>
          </div>
        </div>
      </div>

      <div className="tabs tabs-boxed tabs-sm mb-5">
        {MARKET_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            className={`tab ${activeTab === tab.id ? "tab-active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "strike-steps" && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="relative flex-1 min-w-[12rem] max-w-md">
              <Search className="absolute z-10 left-3 top-1/2 -translate-y-1/2 size-4 opacity-50" />
              <input
                type="search"
                placeholder="Search symbol..."
                className="input input-bordered input-sm w-full pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button type="button" className="btn btn-primary btn-sm gap-2" onClick={openCreate}>
              <Plus className="size-4" />
              Add strike step
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-base-300 bg-base-100">
            <table className="table table-sm">
              <thead>
                <tr className="bg-base-200">
                  <th>ID</th>
                  <th>Symbol</th>
                  <th>Strike step</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && rows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-base-content/60">
                      Loading strike steps...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-base-content/60">
                      No strike steps found.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id} className="hover">
                      <td className="font-mono">{r.id}</td>
                      <td className="font-semibold">{r.symbol}</td>
                      <td>{r.strike_step}</td>
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
            <div className="flex justify-center mt-4">
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
        </>
      )}

      {modalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="font-bold text-lg mb-4">
              {editing ? `Edit strike step #${editing.id}` : "Add strike step"}
            </h3>
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
              <label className="form-control w-full">
                <span className="label-text text-sm">Symbol</span>
                <input
                  className="input input-bordered input-sm w-full"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder="e.g. NIFTY"
                  required
                />
              </label>
              <label className="form-control w-full">
                <span className="label-text text-sm">Strike step</span>
                <input
                  type="number"
                  min={1}
                  step="0.01"
                  className="input input-bordered input-sm w-full"
                  value={strikeStep}
                  onChange={(e) => setStrikeStep(e.target.value)}
                  required
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
    </div>
  );
}
