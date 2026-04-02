"use client";

import { authFetch } from "@/utils/api";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Profile } from "@/types/profile";
import ProfileItem from "@/components/admin/ProfileItem";
import UserWithoutProfileItem, { UserWithoutProfile } from "@/components/admin/UserWithoutProfileItem";
import useAlert from "@/hooks/useAlert";
import { Search } from "lucide-react";
import ProfileItemSkeleton from "@/components/skeletons/ProfileItemSkeleton";

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
  const [activeTab, setActiveTab] = useState<"profiles" | "no-profiles">("profiles");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [subscriptionModalProfile, setSubscriptionModalProfile] = useState<Profile | null>(null);
  const [subscriptionModalMode, setSubscriptionModalMode] = useState<"add" | "modify">("add");

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
  }, [debouncedSearch, brokerFilter, subscriptionFilter, verifiedFilter, loggedInFilter]);

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

  const clearAllFilters = () => {
    setBrokerFilter("");
    setSubscriptionFilter("");
    setVerifiedFilter("");
    setLoggedInFilter("");
    setSearchQuery("");
  };

  const hasActiveFilters =
    brokerFilter ||
    subscriptionFilter ||
    verifiedFilter ||
    loggedInFilter ||
    searchQuery;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-base-300 pb-4">
          <h1 className="text-2xl font-semibold">User Profiles</h1>
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:flex-initial md:w-56">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-base-content/60 z-10" />
              </div>
              <input
                type="text"
                placeholder="Search profiles..."
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

      {loading ? (
        <ProfileItemSkeleton />
      ) : activeTab === "profiles" ? (
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
          {profiles.length === 0 && usersWithoutProfiles.length === 0 && (
            <p className="text-center text-base-content/60">No profiles or users found.</p>
          )}
          {profiles.length === 0 && usersWithoutProfiles.length > 0 && (
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
            />
          ))}
          {usersWithoutProfiles.length === 0 && (
            <p className="text-center text-base-content/60">No users without profiles.</p>
          )}
        </div>
      )}

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
