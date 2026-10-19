"use client";

import { authFetch } from "@/utils/api";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Profile } from "@/types/profile";
import ProfileItem from "@/components/admin/ProfileItem";
import UserWithoutProfileItem, { UserWithoutProfile } from "@/components/admin/UserWithoutProfileItem";
import useAlert from "@/hooks/useAlert";
import { MessageCircle, Search } from "lucide-react";
import {
  listWhatsAppBroadcastTemplates,
  sendWhatsAppBroadcast,
} from "@/services/profile";
import type { WhatsAppBroadcastTemplate } from "@/types/profile";
import ProfileItemSkeleton from "@/components/skeletons/ProfileItemSkeleton";
import { USER_ROLE_FILTER_OPTIONS } from "@/constants/userRoles";

const ProfileForm = dynamic(
  () => import("@/components/admin/profiles/ProfileForm"),
  { ssr: false }
);

const SubscriptionPlanModal = dynamic(
  () => import("@/components/admin/profiles/SubscriptionPlanModal"),
  { ssr: false }
);

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [usersWithoutProfiles, setUsersWithoutProfiles] = useState<UserWithoutProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [brokerFilter, setBrokerFilter] = useState<string>("");
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>("");
  const [verifiedFilter, setVerifiedFilter] = useState<string>("");
  const [loggedInFilter, setLoggedInFilter] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"profiles" | "no-profiles">("profiles");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [subscriptionModalProfile, setSubscriptionModalProfile] = useState<Profile | null>(null);
  const [subscriptionModalMode, setSubscriptionModalMode] = useState<"add" | "modify">("add");
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastTemplates, setBroadcastTemplates] = useState<WhatsAppBroadcastTemplate[]>([]);
  const [broadcastTemplateKey, setBroadcastTemplateKey] = useState("");
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastSending, setBroadcastSending] = useState(false);

  const alert = useAlert();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (brokerFilter) params.append("broker_name", brokerFilter);
      if (subscriptionFilter) params.append("subscription_plan", subscriptionFilter);
      if (verifiedFilter) params.append("verified", verifiedFilter);
      if (loggedInFilter) params.append("logged_in", loggedInFilter);
      if (roleFilter) params.append("user_role", roleFilter);

      params.append("include_users_without_profiles", "true");
      const response = await authFetch(`profiles/?${params.toString()}`);
      const data = await response.json();
      setProfiles(data.results || []);
      setUsersWithoutProfiles(data.users_without_profiles || []);
      setNextPage(data.next);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      alert.error("Failed to fetch profiles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [debouncedSearch, brokerFilter, subscriptionFilter, verifiedFilter, loggedInFilter, roleFilter]);

  const fetchNextPage = async () => {
    if (!nextPage) return;
    setLoading(true);
    try {
      const url = new URL(nextPage);
      const path = url.pathname.replace(/^\/api\//, "") || "profiles/";
      let query = url.search || "?";
      if (!query.includes("include_users_without_profiles")) {
        query += (query === "?" ? "" : "&") + "include_users_without_profiles=true";
      }
      const response = await authFetch(path + query);
      const data = await response.json();
      setProfiles((prev) => [...prev, ...(data.results || [])]);
      setUsersWithoutProfiles(data.users_without_profiles || []);
      setNextPage(data.next);
    } catch (error) {
      console.error("Error fetching next page:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (profile: Profile) => {
    setEditingProfile(profile);
    setIsEditModalOpen(true);
  };

  const handleAddPlan = (profile: Profile) => {
    setSubscriptionModalProfile(profile);
    setSubscriptionModalMode("add");
  };

  const handleModifyPlan = (profile: Profile) => {
    setSubscriptionModalProfile(profile);
    setSubscriptionModalMode("modify");
  };

  const handleUpdate = async (
    data: Partial<Profile> & {
      mobile?: string | null;
      signup_step?: string | null;
      user_verified?: boolean;
    }
  ) => {
    if (!editingProfile) return;
    try {
      const response = await authFetch(`profiles/${editingProfile.id}/`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (response.ok) {
        const updatedProfile = await response.json();
        setProfiles((prev) =>
          prev.map((p) => (p.id === updatedProfile.id ? updatedProfile : p))
        );
        alert.success("Profile updated successfully");
        setIsEditModalOpen(false);
        setEditingProfile(null);
      } else {
        const errorData = await response.json();
        alert.error(errorData.detail || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert.error("An error occurred while updating profile");
    }
  };

  const openBroadcast = async () => {
    setBroadcastOpen(true);
    setBroadcastLoading(true);
    try {
      const templates = await listWhatsAppBroadcastTemplates();
      setBroadcastTemplates(templates);
      setBroadcastTemplateKey((current) => current || templates[0]?.key || "");
    } catch (error) {
      console.error("Error loading WhatsApp templates:", error);
      alert.error(error instanceof Error ? error.message : "Failed to load WhatsApp templates");
      setBroadcastOpen(false);
    } finally {
      setBroadcastLoading(false);
    }
  };

  const closeBroadcast = () => {
    if (broadcastSending) return;
    setBroadcastOpen(false);
  };

  const handleSendBroadcast = async () => {
    if (!broadcastTemplateKey) return;
    setBroadcastSending(true);
    try {
      const result = await sendWhatsAppBroadcast(broadcastTemplateKey);
      const queuedLabel = result.queued === 1 ? "1 client" : `${result.queued} clients`;
      const skipped =
        result.skipped > 0
          ? ` Skipped ${result.skipped} who are not verified or have no verified mobile.`
          : "";
      alert.success(`WhatsApp queued for ${queuedLabel}.${skipped}`);
      setBroadcastOpen(false);
    } catch (error) {
      console.error("Error sending WhatsApp broadcast:", error);
      alert.error(error instanceof Error ? error.message : "Failed to send WhatsApp message");
    } finally {
      setBroadcastSending(false);
    }
  };

  const selectedBroadcast = broadcastTemplates.find((item) => item.key === broadcastTemplateKey);

  const clearAllFilters = () => {
    setBrokerFilter("");
    setSubscriptionFilter("");
    setVerifiedFilter("");
    setLoggedInFilter("");
    setRoleFilter("");
    setSearchQuery("");
  };

  const hasActiveFilters =
    brokerFilter ||
    subscriptionFilter ||
    verifiedFilter ||
    loggedInFilter ||
    roleFilter ||
    searchQuery;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-base-300 pb-4">
          <div className="flex items-center gap-3 shrink-0">
            <h1 className="text-2xl font-semibold">User Profiles</h1>
            <button
              type="button"
              className="btn btn-outline btn-sm gap-2"
              onClick={openBroadcast}
            >
              <MessageCircle size={16} />
              Send WhatsApp
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:flex-initial md:w-56">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-base-content/60 z-10" />
              </div>
              <input
                type="search"
                name="profile-search-query"
                autoComplete="off"
                placeholder="Search profiles..."
                aria-label="Search profiles"
                className="input input-bordered input-sm w-full pl-10 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              value={brokerFilter}
              onChange={(e) => setBrokerFilter(e.target.value)}
              className="select select-bordered select-sm h-9 w-40"
            >
              <option value="">All Brokers</option>
              <option value="SHOONYA">Shoonya</option>
              <option value="ZERODHA">Zerodha</option>
              <option value="KOTAKNEO">Kotak Neo</option>
              <option value="IIFLCAPITAL">IIFL Capital</option>
              <option value="PROSTOCKS">ProStocks</option>
              <option value="SHAREINDIA">Share India</option>
            </select>
            <select
              value={subscriptionFilter}
              onChange={(e) => setSubscriptionFilter(e.target.value)}
              className="select select-bordered select-sm h-9 w-40"
            >
              <option value="">All Plans</option>
              <option value="FREE">Free</option>
              <option value="BASIC">Basic</option>
              <option value="MASTERS">Masters</option>
              <option value="LEGENDS">Legends</option>
            </select>
            <select
              value={verifiedFilter}
              onChange={(e) => setVerifiedFilter(e.target.value)}
              className="select select-bordered select-sm h-9 w-36"
            >
              <option value="">All Status</option>
              <option value="true">Verified</option>
              <option value="false">Unverified</option>
            </select>
            <select
              value={loggedInFilter}
              onChange={(e) => setLoggedInFilter(e.target.value)}
              className="select select-bordered select-sm h-9 w-40"
            >
              <option value="">All Login Status</option>
              <option value="true">Logged In</option>
              <option value="false">Not Logged In</option>
            </select>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="select select-bordered select-sm h-9 w-44"
              aria-label="Filter by user role"
            >
              {USER_ROLE_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="btn btn-ghost btn-sm h-9"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="tabs tabs-boxed tabs-sm mb-4">
        <button
          type="button"
          role="tab"
          className={`tab ${activeTab === "profiles" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("profiles")}
        >
          Profiles {profiles.length > 0 && `(${profiles.length})`}
        </button>
        <button
          type="button"
          role="tab"
          className={`tab ${activeTab === "no-profiles" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("no-profiles")}
        >
          Users without profiles {usersWithoutProfiles.length > 0 && `(${usersWithoutProfiles.length})`}
        </button>
      </div>

      { activeTab === "profiles" ? (
        <div className="space-y-4">
          {profiles.map((profile) => (
            <ProfileItem
              key={profile.id}
              profile={profile}
              onEdit={handleEdit}
              onAddPlan={handleAddPlan}
              onModifyPlan={handleModifyPlan}
            />
          ))}
          {profiles.length === 0 && usersWithoutProfiles.length === 0 && !loading && (
            <p className="text-center text-base-content/60">No profiles or users found.</p>
          )}
          {profiles.length === 0 && usersWithoutProfiles.length > 0 && !loading && (
            <p className="text-center text-base-content/60">No profiles. Switch to &quot;Users without profiles&quot; tab.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {usersWithoutProfiles.map((item) => (
            <UserWithoutProfileItem
              key={`no-profile-${item.user_id}`}
              item={item}
              onUpdate={(updated) => {
                setUsersWithoutProfiles((prev) =>
                  prev.map((i) => (i.user_id === updated.user_id ? updated : i))
                );
              }}
              onProfileCreated={(profile) => {
                setUsersWithoutProfiles((prev) => prev.filter((i) => i.user_id !== item.user_id));
                setProfiles((prev) => [
                  { ...profile, user: { ...item.user, ...profile.user } },
                  ...prev,
                ]);
              }}
            />
          ))}
          {(usersWithoutProfiles.length === 0 && !loading) && (
            <p className="text-center text-base-content/60">No users without profiles.</p>
          )}
        </div>
      )}

      {loading  &&  <ProfileItemSkeleton /> }

      {!loading && activeTab === "profiles" && nextPage && (
        <div className="flex justify-center mt-6">
          <button
            onClick={fetchNextPage}
            className="btn btn-outline btn-sm"
          >
            Load More
          </button>
        </div>
      )}

      {isEditModalOpen && editingProfile && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl">
            <h3 className="font-semibold text-xl mb-4">
              Edit Profile: {editingProfile.user.email}
            </h3>
            <ProfileForm
              initialData={editingProfile}
              onSubmit={handleUpdate}
              onCancel={() => {
                setIsEditModalOpen(false);
                setEditingProfile(null);
              }}
            />
          </div>
          <div className="modal-backdrop" onClick={() => setIsEditModalOpen(false)} />
        </div>
      )}

      {broadcastOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg rounded-xl">
            <h3 className="font-semibold text-lg">Send WhatsApp</h3>
            <p className="text-sm text-base-content/70 mt-2">
              Sends one message to every verified client who has a profile and a verified mobile number.
            </p>
            {broadcastLoading ? (
              <div className="py-8 flex justify-center">
                <span className="loading loading-spinner loading-md" />
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <label className="form-control w-full">
                  <span className="label-text mb-1">Template</span>
                  <select
                    className="select select-bordered select-sm w-full"
                    value={broadcastTemplateKey}
                    onChange={(e) => setBroadcastTemplateKey(e.target.value)}
                    disabled={broadcastSending}
                    aria-label="WhatsApp template"
                  >
                    {broadcastTemplates.map((item) => (
                      <option key={item.key} value={item.key}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                {selectedBroadcast && (
                  <pre className="whitespace-pre-wrap text-sm bg-base-200 rounded-lg p-3 font-sans">
                    {selectedBroadcast.body_preview}
                  </pre>
                )}
              </div>
            )}
            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={closeBroadcast}
                disabled={broadcastSending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSendBroadcast}
                disabled={broadcastLoading || broadcastSending || !broadcastTemplateKey}
              >
                {broadcastSending ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : null}
                Send
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={closeBroadcast} />
        </div>
      )}

      {subscriptionModalProfile && (
        <SubscriptionPlanModal
          profile={subscriptionModalProfile}
          subscription={subscriptionModalMode === "modify" ? subscriptionModalProfile.subscription ?? undefined : undefined}
          mode={subscriptionModalMode}
          onSuccess={() => {
            setSubscriptionModalProfile(null);
            fetchProfiles();
          }}
          onCancel={() => setSubscriptionModalProfile(null)}
        />
      )}
    </div>
  );
}
