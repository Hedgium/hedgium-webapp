"use client";

import React, { useState } from "react";
import { User, Profile } from "@/types/profile";
import type { BrokerProxyPool } from "@/types/brokerProxyPool";
import { Edit2, UserPlus } from "lucide-react";
import { authFetch } from "@/utils/api";
import useAlert from "@/hooks/useAlert";

export interface UserWithoutProfile {
  id: null;
  user_id: number;
  user: User;
  is_user_without_profile: true;
}

interface UserWithoutProfileItemProps {
  item: UserWithoutProfile;
  onUpdate?: (updated: UserWithoutProfile) => void;
  onProfileCreated?: (profile: Profile) => void;
}

const SIGNUP_STEPS = [
  { value: "initiated", label: "Initiated" },
  { value: "email_verified", label: "Email Verified" },
  { value: "documents_uploaded", label: "Documents Uploaded" },
  { value: "broker_profile_added", label: "Broker Profile Added" },
  { value: "verified", label: "Verified" },
];

export default function UserWithoutProfileItem({ item, onUpdate, onProfileCreated }: UserWithoutProfileItemProps) {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addProfileModalOpen, setAddProfileModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [brokerProxyPoolId, setBrokerProxyPoolId] = useState("");
  const [poolOptions, setPoolOptions] = useState<{ id: number; label: string }[]>([]);
  const [poolsLoading, setPoolsLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: item.user.first_name || "",
    last_name: item.user.last_name || "",
    mobile: item.user.mobile || "",
    pan_number: item.user.pan_number || "",
    aadhar_number: item.user.aadhar_number || "",
    signup_step: item.user.signup_step || "initiated",
    verified: item.user.verified ?? false,
  });
  const alert = useAlert();

  const { user } = item;
  const displayName = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email;

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await authFetch(`users/${item.user_id}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdate?.({
          ...item,
          user: { ...item.user, ...updated } as User,
        });
        alert.success("User updated");
        setEditModalOpen(false);
      } else {
        const err = await res.json();
        alert.error(err.detail || "Failed to update");
      }
    } catch {
      alert.error("Failed to update user");
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = () => {
    setFormData({
      first_name: item.user.first_name || "",
      last_name: item.user.last_name || "",
      mobile: item.user.mobile || "",
      pan_number: user.pan_number || "",
      aadhar_number: user.aadhar_number || "",
      signup_step: item.user.signup_step || "initiated",
      verified: item.user.verified ?? false,
    });
    setEditModalOpen(true);
  };

  const loadUnassignedPools = async () => {
    setPoolsLoading(true);
    try {
      const res = await authFetch("profiles/broker-proxy-pool/?page_size=200");
      if (!res.ok) {
        throw new Error("bad response");
      }
      const data = await res.json();
      const rows = (data.results || []) as BrokerProxyPool[];
      const unassigned = rows.filter((r) => !r.assigned_profile);
      setPoolOptions(
        unassigned.map((r) => ({
          id: r.id,
          label: `#${r.id} · IP ${(r.ip_address || "").trim() || "—"}${r.host ? ` · ${r.host}` : ""}`,
        }))
      );
    } catch {
      alert.error("Failed to load proxy pools");
      setPoolOptions([]);
    } finally {
      setPoolsLoading(false);
    }
  };

  const openAddProfile = () => {
    setBrokerProxyPoolId("");
    void loadUnassignedPools();
    setAddProfileModalOpen(true);
  };

  const handleAddProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingProfile(true);
    try {
      const body: Record<string, unknown> = { user_id: item.user_id };
      if (brokerProxyPoolId) {
        const pid = parseInt(brokerProxyPoolId, 10);
        if (!Number.isFinite(pid)) {
          alert.error("Invalid proxy pool selection");
          setSubmittingProfile(false);
          return;
        }
        body.broker_proxy_pool_id = pid;
      }

      const res = await authFetch("profiles/admin/bootstrap-user/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const profile = (await res.json()) as Profile;
        onProfileCreated?.(profile);
        alert.success("Profile created");
        setAddProfileModalOpen(false);
      } else {
        const err = await res.json().catch(() => ({}));
        alert.error((err as { detail?: string }).detail || "Failed to create profile");
      }
    } catch {
      alert.error("Failed to create profile");
    } finally {
      setSubmittingProfile(false);
    }
  };

  return (
    <>
      <div className="bg-base-100 rounded-lg p-4 mb-4 border border-base-300">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-gray-400 text-sm">User</p>
            <p className="font-medium">{user.email}</p>
            <p className="text-sm text-gray-500">{displayName !== user.email ? displayName : ""}</p>
            <p className="text-sm text-gray-500">ID: {item.user_id}</p>
            {user.last_login && (
              <p className="text-sm text-gray-500">
                Last login: {new Date(user.last_login).toLocaleString()}
              </p>
            )}
          </div>
          <div>
            <p className="text-gray-400 text-sm">Aadhar / PAN / Documents</p>
            <p className="text-xs text-gray-500">
              {user.aadhar_number ? (
                <span>Aadhar: {user.aadhar_number}</span>
              ) : (
                <span className="opacity-60">Aadhar: —</span>
              )}
            </p>
            <p className="text-xs text-gray-500">
              {user.pan_number ? (
                <span>PAN: {user.pan_number}</span>
              ) : (
                <span className="opacity-60">PAN: —</span>
              )}
            </p>
            <div className="flex gap-2 mt-1 flex-wrap items-center">
              {user.pan_document_url ? (
                <a
                  href={user.pan_document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                  title="View PAN"
                >
                  <img
                    src={user.pan_document_url}
                    alt="PAN"
                    className="w-10 h-10 object-cover rounded border border-base-300"
                  />
                  <span className="link link-primary text-xs">PAN</span>
                </a>
              ) : (
                <span className="text-xs opacity-60">PAN —</span>
              )}
              {user.aadhar_document_url ? (
                <a
                  href={user.aadhar_document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                  title="View Aadhar"
                >
                  <img
                    src={user.aadhar_document_url}
                    alt="Aadhar"
                    className="w-10 h-10 object-cover rounded border border-base-300"
                  />
                  <span className="link link-primary text-xs">Aadhar</span>
                </a>
              ) : (
                <span className="text-xs opacity-60">Aadhar —</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Action</p>
            <div className="flex flex-wrap gap-2 mt-1">
              <div className="tooltip tooltip-right" data-tip="Add profile (proxy)">
                <button
                  type="button"
                  onClick={openAddProfile}
                  className="btn btn-ghost btn-xs btn-square text-success"
                  title="Add profile (proxy)"
                >
                  <UserPlus size={16} />
                </button>
              </div>
              <div className="tooltip tooltip-right" data-tip="Edit user">
                <button
                  type="button"
                  onClick={openEdit}
                  className="btn btn-ghost btn-xs btn-square text-blue-400"
                  title="Edit user"
                >
                  <Edit2 size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {addProfileModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-lg rounded-xl">
            <h3 className="font-semibold text-lg mb-2">Add profile: {user.email}</h3>
            <p className="text-sm text-base-content/60 mb-4">
              Creates a shell profile with default broker settings. Optionally link an <strong>unassigned</strong> broker
              proxy pool row for static-IP order APIs, or leave &quot;None&quot; for no pool assignment. Add pool rows
              under Admin → Proxy pool. You can edit the full profile later from the Profiles tab.
            </p>
            <form onSubmit={handleAddProfileSubmit} className="space-y-4">
              <div className="rounded-xl border border-base-300 bg-base-200/30 p-4 space-y-3">
                <h4 className="text-sm font-semibold text-base-content/80">Broker proxy pool</h4>
                <p className="text-xs text-base-content/60">
                  Each row is tied to a whitelisted <strong>IP address</strong> (shown as “IP …” in the list). Only pools
                  with no profile assigned appear here. Choose None if this user should not use a pool row yet.
                </p>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Assign pool (by IP / host)</span>
                  </label>
                  <select
                    className="select select-bordered select-sm w-full"
                    value={brokerProxyPoolId}
                    onChange={(e) => setBrokerProxyPoolId(e.target.value)}
                    disabled={poolsLoading}
                  >
                    <option value="">— None —</option>
                    {poolOptions.map((o) => (
                      <option key={o.id} value={String(o.id)}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  {poolsLoading && (
                    <span className="label-text-alt text-base-content/50">Loading pools…</span>
                  )}
                  {!poolsLoading && poolOptions.length === 0 && (
                    <span className="label-text-alt text-warning">
                      No unassigned pools. Create one in Proxy pool admin (leave profile unassigned).
                    </span>
                  )}
                </div>
              </div>
              <div className="modal-action pt-2">
                <button
                  type="button"
                  onClick={() => setAddProfileModalOpen(false)}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submittingProfile} className="btn btn-primary btn-sm">
                  {submittingProfile ? "Creating…" : "Create profile"}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => setAddProfileModalOpen(false)} />
        </div>
      )}

      {editModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-lg rounded-xl">
            <h3 className="font-semibold text-lg mb-4">Edit user: {user.email}</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label"><span className="label-text">First name</span></label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData((f) => ({ ...f, first_name: e.target.value }))}
                    className="input input-bordered input-sm w-full"
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Last name</span></label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData((f) => ({ ...f, last_name: e.target.value }))}
                    className="input input-bordered input-sm w-full"
                  />
                </div>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Mobile</span></label>
                <input
                  type="text"
                  value={formData.mobile}
                  onChange={(e) => setFormData((f) => ({ ...f, mobile: e.target.value }))}
                  className="input input-bordered input-sm w-full"
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">PAN number</span></label>
                <input
                  type="text"
                  value={formData.pan_number}
                  onChange={(e) => setFormData((f) => ({ ...f, pan_number: e.target.value }))}
                  placeholder="10 alphanumeric"
                  className="input input-bordered input-sm w-full uppercase"
                  maxLength={10}
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Aadhaar number</span></label>
                <input
                  type="text"
                  value={formData.aadhar_number}
                  onChange={(e) => setFormData((f) => ({ ...f, aadhar_number: e.target.value.replace(/\D/g, "").slice(0, 12) }))}
                  placeholder="12 digits"
                  className="input input-bordered input-sm w-full"
                  maxLength={12}
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Signup step</span></label>
                <select
                  value={formData.signup_step}
                  onChange={(e) => setFormData((f) => ({ ...f, signup_step: e.target.value }))}
                  className="select select-bordered select-sm w-full"
                >
                  {SIGNUP_STEPS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <span className="label-text">Verified</span>
                  <input
                    type="checkbox"
                    checked={formData.verified}
                    onChange={(e) => setFormData((f) => ({ ...f, verified: e.target.checked }))}
                    className="checkbox checkbox-sm"
                  />
                </label>
              </div>
              <div className="modal-action pt-4">
                <button type="button" onClick={() => setEditModalOpen(false)} className="btn btn-ghost btn-sm">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
                  {submitting ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => setEditModalOpen(false)} />
        </div>
      )}
    </>
  );
}
