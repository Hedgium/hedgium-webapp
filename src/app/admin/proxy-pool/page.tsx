"use client";

import { authFetch } from "@/utils/api";
import { useCallback, useEffect, useRef, useState } from "react";
import useAlert from "@/hooks/useAlert";
import type { BrokerProxyPool, BrokerProxyPoolBroker } from "@/types/brokerProxyPool";
import { BROKER_PROXY_POOL_BROKERS } from "@/types/brokerProxyPool";
import { Network, Pencil, Plus, Search, Trash2 } from "lucide-react";

type ProfileOption = { id: number; label: string; broker_name: string };

export default function AdminProxyPoolPage() {
  const [rows, setRows] = useState<BrokerProxyPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [brokerFilter, setBrokerFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BrokerProxyPool | null>(null);
  const [saving, setSaving] = useState(false);
  const [profileOptions, setProfileOptions] = useState<ProfileOption[]>([]);

  const [brokerName, setBrokerName] = useState<BrokerProxyPoolBroker>("SHOONYA");
  const [ipAddress, setIpAddress] = useState("");
  const [host, setHost] = useState("");
  const [port, setPort] = useState("443");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [validity, setValidity] = useState("");
  const [assignedProfileId, setAssignedProfileId] = useState<string>("");

  const alert = useAlert();
  const alertRef = useRef(alert);
  alertRef.current = alert;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const loadProfileOptions = useCallback(async () => {
    try {
      const res = await authFetch("profiles/?page_size=100");
      const data = await res.json();
      const list = (data.results || []) as Array<{
        id: number | null;
        user?: { email?: string; first_name?: string; last_name?: string };
        broker_name?: string;
      }>;
      const opts: ProfileOption[] = [];
      for (const p of list) {
        if (p.id == null) continue;
        const email = p.user?.email || "";
        const name = [p.user?.first_name, p.user?.last_name].filter(Boolean).join(" ").trim();
        const namePart = name ? `${name} · ` : "";
        opts.push({
          id: p.id,
          label: `#${p.id} ${namePart}${email}`.trim(),
          broker_name: p.broker_name || "",
        });
      }
      setProfileOptions(opts);
    } catch {
      alertRef.current.error("Failed to load profiles for assignment");
    }
  }, []);

  const fetchRows = useCallback(
    async (nextPageUrl?: string) => {
      setLoading(true);
      try {
        let endpoint: string;
        if (nextPageUrl) {
          try {
            const parsed = new URL(nextPageUrl);
            const q = parsed.search ? parsed.search.slice(1) : "";
            endpoint = q ? `profiles/broker-proxy-pool/?${q}` : "profiles/broker-proxy-pool/";
          } catch {
            endpoint = "profiles/broker-proxy-pool/";
          }
        } else {
          const params = new URLSearchParams();
          params.set("page_size", "50");
          if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
          if (brokerFilter) params.set("broker_name", brokerFilter);
          endpoint = `profiles/broker-proxy-pool/?${params.toString()}`;
        }
        const res = await authFetch(endpoint);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { detail?: string }).detail || res.statusText);
        }
        const data = await res.json();
        const results = (data.results || []) as BrokerProxyPool[];
        if (nextPageUrl) {
          setRows((prev) => [...prev, ...results]);
        } else {
          setRows(results);
        }
        const n = data.next as string | null;
        setNextPage(n ? (n.includes("api/") ? n.split("api/")[1] : n) : null);
      } catch (e) {
        console.error(e);
        alertRef.current.error("Failed to fetch proxy pool");
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, brokerFilter]
  );

  const matchingProfileOptions = profileOptions.filter(
    (o) => o.broker_name === brokerName
  );

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const openCreate = () => {
    setEditing(null);
    setBrokerName("SHOONYA");
    setIpAddress("");
    setHost("");
    setPort("443");
    setUsername("");
    setPassword("");
    setIsActive(true);
    setValidity("");
    setAssignedProfileId("");
    void loadProfileOptions();
    setModalOpen(true);
  };

  const openEdit = (row: BrokerProxyPool) => {
    setEditing(row);
    setBrokerName(row.broker_name);
    setIpAddress(row.ip_address || "");
    setHost(row.host || "");
    setPort(String(row.port ?? 443));
    setUsername(row.username || "");
    setPassword("");
    setIsActive(row.is_active);
    setValidity(row.validity ? row.validity.slice(0, 10) : "");
    setAssignedProfileId(
      row.assigned_profile ? String(row.assigned_profile.id) : ""
    );
    void loadProfileOptions();
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const portNum = parseInt(port, 10);
      if (Number.isNaN(portNum) || portNum < 1) {
        alert.error("Port must be a positive number");
        setSaving(false);
        return;
      }

      const assigned =
        assignedProfileId === "" ? null : parseInt(assignedProfileId, 10);
      if (assignedProfileId !== "" && Number.isNaN(assigned)) {
        alert.error("Invalid profile id");
        setSaving(false);
        return;
      }

      const validityValue = validity.trim() ? validity.trim() : null;

      if (editing) {
        const body: Record<string, unknown> = {
          broker_name: brokerName,
          ip_address: ipAddress.trim(),
          host: host.trim(),
          port: portNum,
          username: username.trim() || null,
          is_active: isActive,
          validity: validityValue,
          assigned_profile_id: assigned,
        };
        if (password.trim()) body.password = password.trim();

        const res = await authFetch(`profiles/broker-proxy-pool/${editing.id}/`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { detail?: string }).detail || "Update failed");
        }
        const updated = (await res.json()) as BrokerProxyPool;
        setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        alert.success("Proxy pool updated");
      } else {
        const body: Record<string, unknown> = {
          broker_name: brokerName,
          ip_address: ipAddress.trim(),
          host: host.trim(),
          port: portNum,
          username: username.trim() || null,
          is_active: isActive,
          validity: validityValue,
        };
        if (password.trim()) body.password = password.trim();
        if (assigned != null) body.assigned_profile_id = assigned;

        const res = await authFetch("profiles/broker-proxy-pool/", {
          method: "POST",
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { detail?: string }).detail || "Create failed");
        }
        const created = (await res.json()) as BrokerProxyPool;
        setRows((prev) => [created, ...prev]);
        alert.success("Proxy pool created");
      }
      closeModal();
    } catch (err) {
      console.error(err);
      alert.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: BrokerProxyPool) => {
    if (
      !confirm(
        `Delete proxy pool #${row.id} (IP: ${row.ip_address || "—"}, host: ${row.host || "—"})?`
      )
    ) {
      return;
    }
    try {
      const res = await authFetch(`profiles/broker-proxy-pool/${row.id}/`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail || "Delete failed");
      }
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      alert.success("Proxy pool deleted");
    } catch (err) {
      console.error(err);
      alert.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const loadMore = () => {
    if (nextPage) void fetchRows(nextPage);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Network className="size-8 text-primary" aria-hidden />
          <div>
            <h1 className="text-2xl font-bold">Broker proxy pool</h1>
            <p className="text-sm text-base-content/70">
              Static-IP proxies for order APIs.
            </p>
          </div>
        </div>
        <button type="button" className="btn btn-primary gap-2" onClick={openCreate}>
          <Plus className="size-4" />
          Add pool
        </button>
      </div>

      <div className="bg-base-200 rounded-lg mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[12rem] max-w-md">
          <Search className="absolute z-10 left-3 top-1/2 -translate-y-1/2 size-4 opacity-50" />
          <input
            type="search"
            placeholder="Search IP address or proxy host…"
            aria-label="Search IP address or proxy host"
            className="input input-bordered input-sm w-full pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="select select-bordered select-sm"
          value={brokerFilter}
          onChange={(e) => setBrokerFilter(e.target.value)}
          aria-label="Filter by broker"
        >
          <option value="">All brokers</option>
          {BROKER_PROXY_POOL_BROKERS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-base-300 bg-base-100">
        <table className="table table-sm">
          <thead>
            <tr className="bg-base-200">
              <th>ID</th>
              <th>Broker</th>
              <th>IP address</th>
              <th>Proxy host</th>
              <th>Port</th>
              <th>Username</th>
              <th>Active</th>
              <th>Validity</th>
              <th>Assigned profile</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-12 text-base-content/60">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-12 text-base-content/60">
                  No proxy pool rows yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hover">
                  <td className="font-mono">{r.id}</td>
                  <td>{r.broker_name}</td>
                  <td className="font-mono text-xs">{r.ip_address || "—"}</td>
                  <td className="font-mono text-xs max-w-[200px] truncate" title={r.host}>
                    {r.host || "—"}
                  </td>
                  <td>{r.port}</td>
                  <td className="max-w-[120px] truncate" title={r.username || ""}>
                    {r.username ? "••••••••" : "—"}
                  </td>
                  <td>{r.is_active ? "Yes" : "No"}</td>
                  <td className="font-mono text-xs">{r.validity || "—"}</td>
                  <td className="text-sm max-w-[280px]">
                    {r.assigned_profile ? (
                      <div className="space-y-0.5">
                        <div className="font-medium text-base-content/90">
                          {[r.assigned_profile.first_name, r.assigned_profile.last_name]
                            .filter(Boolean)
                            .join(" ")
                            .trim() || "—"}
                        </div>
                        <div className="text-base-content/60 text-xs break-all">
                          #{r.assigned_profile.id} · {r.assigned_profile.broker_user_id ?? "—"} ·{" "}
                          {r.assigned_profile.broker_name}
                        </div>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="text-end">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        onClick={() => openEdit(r)}
                        title="Edit"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs text-error"
                        onClick={() => void handleDelete(r)}
                        title="Delete"
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
            disabled={loading}
            onClick={loadMore}
          >
            Load more
          </button>
        </div>
      )}

      {modalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg">
            <h3 className="font-bold text-lg mb-4">
              {editing ? `Edit pool #${editing.id}` : "Add proxy pool"}
            </h3>
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
              <label className="form-control w-full">
                <span className="label-text text-sm">Broker</span>
                <span className="text-xs text-base-content/60 block -mt-0.5 mb-1">
                  Static IPs are whitelisted per broker — pool rows must match the profile broker.
                </span>
                <select
                  className="select select-bordered select-sm w-full"
                  value={brokerName}
                  onChange={(e) => {
                    setBrokerName(e.target.value as BrokerProxyPoolBroker);
                    setAssignedProfileId("");
                  }}
                  required
                >
                  {BROKER_PROXY_POOL_BROKERS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-control w-full">
                <span className="label-text text-sm">IP address (whitelisted)</span>
                <span className="text-xs text-base-content/60 block -mt-0.5 mb-1">
                  Static IP the broker associates with this customer (e.g. 103.204.210.45).
                </span>
                <input
                  className="input input-bordered input-sm w-full font-mono"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  placeholder="e.g. 103.204.210.45"
                />
              </label>
              <label className="form-control w-full">
                <span className="label-text text-sm">Proxy host (CONNECT)</span>
                <span className="text-xs text-base-content/60 block -mt-0.5 mb-1">
                  Hostname your HTTP client uses to reach the proxy (provider DNS).
                </span>
                <input
                  className="input input-bordered input-sm w-full font-mono"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="e.g. dc-mum-001.staticip.in"
                  required
                />
              </label>
              <label className="form-control w-full">
                <span className="label-text text-sm">Port</span>
                <input
                  type="number"
                  min={1}
                  className="input input-bordered input-sm w-full"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                />
              </label>
              <label className="form-control w-full">
                <span className="label-text text-sm">Username</span>
                <input
                  className="input input-bordered input-sm w-full"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </label>
              <label className="form-control w-full">
                <span className="label-text text-sm">
                  Password {editing && "(leave blank to keep current)"}
                </span>
                <input
                  type="password"
                  className="input input-bordered input-sm w-full"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </label>
              <label className="cursor-pointer flex items-center gap-2">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span className="text-sm">Active (used for order proxy resolution)</span>
              </label>
              <label className="form-control w-full">
                <span className="label-text text-sm">Validity</span>
                <span className="text-xs text-base-content/60 block -mt-0.5 mb-1">
                  Lease end date from the proxy provider. Leave blank if unknown.
                </span>
                <input
                  type="date"
                  className="input input-bordered input-sm w-full"
                  value={validity}
                  onChange={(e) => setValidity(e.target.value)}
                />
              </label>
              <label className="form-control w-full">
                <span className="label-text text-sm">Assign profile ({brokerName})</span>
                <select
                  className="select select-bordered select-sm w-full"
                  value={assignedProfileId}
                  onChange={(e) => setAssignedProfileId(e.target.value)}
                >
                  <option value="">— Unassigned —</option>
                  {matchingProfileOptions.map((o) => (
                    <option key={o.id} value={String(o.id)}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {!matchingProfileOptions.length && (
                  <span className="text-xs text-base-content/60 mt-1">
                    No profiles with broker {brokerName}.
                  </span>
                )}
              </label>
              <div className="modal-action">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving…" : editing ? "Save" : "Create"}
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
