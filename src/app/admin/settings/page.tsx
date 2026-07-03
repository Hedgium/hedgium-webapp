"use client";

import { authFetch } from "@/utils/api";
import useAlert from "@/hooks/useAlert";
import { Pencil, Plus, Search, Settings2, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type SystemConfigRow = {
  id: number;
  key: string;
  value: string;
  value_type: "int" | "float" | "str" | "bool";
  description: string;
  updated_at: string;
};

const VALUE_TYPES: SystemConfigRow["value_type"][] = ["int", "float", "str", "bool"];

function normalizeNext(next: string | null): string | null {
  if (!next) return null;
  return next.includes("api/") ? next.split("api/")[1] : next;
}

export default function AdminSystemConfigPage() {
  const [rows, setRows] = useState<SystemConfigRow[]>([]);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SystemConfigRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [valueType, setValueType] = useState<SystemConfigRow["value_type"]>("str");
  const [description, setDescription] = useState("");

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
            endpoint = q ? `core/system-config/?${q}` : "core/system-config/";
          } catch {
            endpoint = "core/system-config/";
          }
        } else {
          const params = new URLSearchParams();
          params.set("page_size", "50");
          if (debouncedSearch) params.set("search", debouncedSearch);
          endpoint = `core/system-config/?${params.toString()}`;
        }

        const res = await authFetch(endpoint);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { detail?: string }).detail || "Failed to fetch system config");
        }
        const data = await res.json();
        const resultRows = (data.results || []) as SystemConfigRow[];

        if (nextPageUrl) {
          setRows((prev) => [...prev, ...resultRows]);
        } else {
          setRows(resultRows);
        }
        setNextPage(normalizeNext(data.next as string | null));
      } catch (e) {
        console.error(e);
        alertRef.current.error(
          e instanceof Error ? e.message : "Failed to fetch system config"
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
    setKey("");
    setValue("");
    setValueType("str");
    setDescription("");
    setModalOpen(true);
  };

  const openEdit = (row: SystemConfigRow) => {
    setEditing(row);
    setKey(row.key);
    setValue(row.value);
    setValueType(row.value_type);
    setDescription(row.description || "");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = key.trim().toUpperCase().replace(/\s+/g, "_");
    const cleanValue = value.trim();

    if (!editing && !cleanKey) {
      alert.error("Key is required");
      return;
    }
    if (!cleanValue) {
      alert.error("Value is required");
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        const res = await authFetch(`core/system-config/${editing.id}/`, {
          method: "PATCH",
          body: JSON.stringify({
            value: cleanValue,
            value_type: valueType,
            description: description.trim(),
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { detail?: string }).detail || "Update failed");
        }
        const updated = (await res.json()) as SystemConfigRow;
        setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        alert.success("Config updated");
      } else {
        const res = await authFetch("core/system-config/", {
          method: "POST",
          body: JSON.stringify({
            key: cleanKey,
            value: cleanValue,
            value_type: valueType,
            description: description.trim(),
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { detail?: string }).detail || "Create failed");
        }
        const created = (await res.json()) as SystemConfigRow;
        setRows((prev) => [created, ...prev]);
        alert.success("Config created");
      }

      closeModal();
    } catch (e) {
      console.error(e);
      alert.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: SystemConfigRow) => {
    if (!confirm(`Delete config "${row.key}"?`)) return;
    try {
      const res = await authFetch(`core/system-config/${row.id}/`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail || "Delete failed");
      }
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      alert.success("Config deleted");
    } catch (e) {
      console.error(e);
      alert.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Settings2 className="size-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">System config</h1>
            <p className="text-sm text-base-content/70">
              Runtime tunables for order pricing, batching, and background loops.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 min-w-[12rem] max-w-md">
          <Search className="absolute z-10 left-3 top-1/2 -translate-y-1/2 size-4 opacity-50" />
          <input
            type="search"
            placeholder="Search key..."
            aria-label="Search configuration keys"
            className="input input-bordered input-sm w-full pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button type="button" className="btn btn-primary btn-sm gap-2" onClick={openCreate}>
          <Plus className="size-4" />
          Add config
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-base-300 bg-base-100">
        <table className="table table-sm">
          <thead>
            <tr className="bg-base-200">
              <th>Key</th>
              <th>Value</th>
              <th>Type</th>
              <th>Description</th>
              <th>Updated</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-base-content/60">
                  Loading system config...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-base-content/60">
                  No config entries found.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hover">
                  <td className="font-mono text-xs font-semibold">{r.key}</td>
                  <td className="font-mono text-xs max-w-[12rem] truncate" title={r.value}>
                    {r.value}
                  </td>
                  <td>
                    <span className="badge badge-outline badge-sm">{r.value_type}</span>
                  </td>
                  <td className="text-xs text-base-content/80 max-w-xs truncate" title={r.description}>
                    {r.description || "—"}
                  </td>
                  <td className="text-xs whitespace-nowrap">
                    {new Date(r.updated_at).toLocaleString()}
                  </td>
                  <td className="text-end">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm min-h-11 min-w-11"
                        title="Edit"
                        aria-label={`Edit ${r.key}`}
                        onClick={() => openEdit(r)}
                      >
                        <Pencil className="size-3.5" aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm min-h-11 min-w-11 text-error"
                        title="Delete"
                        aria-label={`Delete ${r.key}`}
                        onClick={() => void handleDelete(r)}
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

      {modalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg">
            <h3 className="font-bold text-lg mb-4">
              {editing ? `Edit ${editing.key}` : "Add system config"}
            </h3>
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
              <label className="form-control w-full">
                <span className="label-text text-sm">Key</span>
                <input
                  className="input input-bordered input-sm w-full font-mono"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="e.g. PRICE_MOD_BASE_FRACTION"
                  required
                  disabled={!!editing}
                />
                {!editing ? (
                  <span className="label-text-alt text-xs mt-1">
                    Uppercase letters, numbers, and underscores only.
                  </span>
                ) : null}
              </label>
              <label className="form-control w-full">
                <span className="label-text text-sm">Type</span>
                <select
                  className="select select-bordered select-sm w-full"
                  value={valueType}
                  onChange={(e) =>
                    setValueType(e.target.value as SystemConfigRow["value_type"])
                  }
                >
                  {VALUE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-control w-full">
                <span className="label-text text-sm">Value</span>
                <input
                  className="input input-bordered input-sm w-full font-mono"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={valueType === "bool" ? "true / false" : "Value"}
                  required
                />
              </label>
              <label className="form-control w-full">
                <span className="label-text text-sm">Description</span>
                <textarea
                  className="textarea textarea-bordered textarea-sm w-full"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What this setting controls"
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
