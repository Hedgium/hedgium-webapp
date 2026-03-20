"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { authFetch } from "@/utils/api";
import { Profile } from "@/types/profile";
import { formatMoneyIN } from "@/utils/formatNumber";
import useAlert from "@/hooks/useAlert";
import { ArrowLeft, Edit2, TrendingUp, Calendar, Plus } from "lucide-react";

const ProfileForm = dynamic(
  () => import("@/components/admin/profiles/ProfileForm"),
  { ssr: false }
);

const SubscriptionPlanModal = dynamic(
  () => import("@/components/admin/profiles/SubscriptionPlanModal"),
  { ssr: false }
);

export default function ProfileDetailPage() {
  const params = useParams();
  const router = useRouter();
  const profileId = params.profileId as string;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [subscriptionModalMode, setSubscriptionModalMode] = useState<"add" | "modify" | null>(null);
  const alert = useAlert();

  const fetchProfile = useCallback(async () => {
    try {
      const res = await authFetch(`profiles/${profileId}/`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else {
        alert.error("Profile not found");
        router.push("/admin/profiles");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      alert.error("Failed to load profile");
      router.push("/admin/profiles");
    } finally {
      setLoading(false);
    }
  }, [profileId, alert, router]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleUpdate = async (
    data: Partial<Profile> & {
      mobile?: string | null;
      signup_step?: string | null;
      user_verified?: boolean;
    }
  ) => {
    if (!profile) return;
    try {
      const res = await authFetch(`profiles/${profile.id}/`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        alert.success("Profile updated successfully");
        setIsEditModalOpen(false);
      } else {
        const err = await res.json();
        alert.error(err.detail || "Failed to update profile");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      alert.error("An error occurred");
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="h-6 bg-base-300 rounded w-24 mb-4 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-base-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const u = profile.user;
  const sub = profile.subscription;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Link
        href="/admin/profiles"
        className="btn btn-sm btn-ghost gap-2 mb-4"
      >
        <ArrowLeft size={16} /> Back to Profiles
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-base-300 pb-4 mb-6">
        <h1 className="text-2xl font-semibold">
          Profile: {u.email}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="btn btn-primary btn-sm gap-2"
          >
            <Edit2 size={16} /> Edit Profile
          </button>
          {profile.broker_logged_in && (
            <Link
              href={`/admin/profiles/${profile.id}/live`}
              className="btn btn-outline btn-sm gap-2"
            >
              <TrendingUp size={16} /> Live Positions
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-base-200 rounded-xl p-4 border border-base-300">
          <p className="text-sm text-base-content/60 mb-1">User</p>
          <p className="font-medium">{u.email}</p>
          <p className="text-sm">
            {u.first_name} {u.last_name}
          </p>
          <p className="text-xs text-base-content/50">ID: {u.id}</p>
          {u.last_login && (
            <p className="text-xs text-base-content/50 mt-1">
              Last login: {new Date(u.last_login).toLocaleString()}
            </p>
          )}
        </div>

        <div className="bg-base-200 rounded-xl p-4 border border-base-300">
          <p className="text-sm text-base-content/60 mb-1">Broker</p>
          <p className="font-medium">{profile.broker_name}</p>
          <p className="text-xs text-base-content/50">
            HID: {profile.id} | Broker ID: {profile.broker_user_id || "—"}
          </p>
          <span
            className={`badge badge-sm mt-1 ${
              profile.broker_logged_in ? "badge-success" : "badge-ghost"
            }`}
          >
            {profile.broker_logged_in ? "Broker Logged In" : "Not Logged In"}
          </span>
        </div>

        <div className="bg-base-200 rounded-xl p-4 border border-base-300">
          <p className="text-sm text-base-content/60 mb-1">Margin Equity</p>
          <p className="font-medium text-lg">
            {formatMoneyIN(profile.margin_equity, { decimals: 0 })}
          </p>
          <div className="flex gap-2 mt-2">
            <span
              className={`badge badge-sm ${
                profile.verified ? "badge-success" : "badge-warning"
              }`}
            >
              {profile.verified ? "Verified" : "Unverified"}
            </span>
            <span
              className={`badge badge-sm ${
                profile.is_active ? "badge-info" : "badge-ghost"
              }`}
            >
              {profile.is_active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-base-200 rounded-xl p-4 border border-base-300 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-medium flex items-center gap-2 mb-2">
              <Calendar size={18} /> Subscription
            </h3>
            {sub ? (
              <div className="space-y-1">
                <p>
                  Plan: <strong>{sub.plan.name}</strong>
                </p>
                <p className="text-sm text-base-content/70">
                  {new Date(sub.start_date).toLocaleDateString()} —{" "}
                  {new Date(sub.end_date).toLocaleDateString()}
                </p>
                <span
                  className={`badge badge-sm ${
                    sub.is_valid ? "badge-success" : "badge-warning"
                  }`}
                >
                  {sub.is_valid ? "Valid" : "Expired"}
                </span>
              </div>
            ) : (
              <p className="text-base-content/60">No active subscription</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSubscriptionModalMode("add")}
              className="btn btn-primary btn-sm gap-2"
            >
              <Plus size={16} /> Add Plan
            </button>
            {sub && (
              <button
                onClick={() => setSubscriptionModalMode("modify")}
                className="btn btn-outline btn-sm"
              >
                Modify Dates
              </button>
            )}
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-3xl rounded-xl">
            <h3 className="font-semibold text-xl mb-4">
              Edit Profile: {profile.user.email}
            </h3>
            <ProfileForm
              initialData={profile}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditModalOpen(false)}
            />
          </div>
          <div className="modal-backdrop" onClick={() => setIsEditModalOpen(false)} />
        </div>
      )}

      {subscriptionModalMode && (
        <SubscriptionPlanModal
          profile={profile}
          subscription={subscriptionModalMode === "modify" ? sub ?? undefined : undefined}
          mode={subscriptionModalMode}
          onSuccess={() => {
            setSubscriptionModalMode(null);
            fetchProfile();
          }}
          onCancel={() => setSubscriptionModalMode(null)}
        />
      )}
    </div>
  );
}
