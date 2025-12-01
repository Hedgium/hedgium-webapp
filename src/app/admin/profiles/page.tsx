"use client";

import { authFetch } from "@/utils/api";
import { useState, useEffect } from "react";
import { Profile } from "@/types/profile";
import ProfileItem from "@/components/admin/ProfileItem";
import ProfileForm from "@/components/admin/profiles/ProfileForm";
import useAlert from "@/hooks/useAlert";
import { Search } from "lucide-react";

export default function ProfilesPage() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(false);
    const [nextPage, setNextPage] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Filter states
    const [brokerFilter, setBrokerFilter] = useState<string>("");
    const [subscriptionFilter, setSubscriptionFilter] = useState<string>("");
    const [verifiedFilter, setVerifiedFilter] = useState<string>("");

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingProfile, setEditingProfile] = useState<Profile | null>(null);

    const alert = useAlert();

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchProfiles = async (reset = false) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();

            if (debouncedSearch) {
                params.append('search', debouncedSearch);
            }
            if (brokerFilter) {
                params.append('broker_name', brokerFilter);
            }
            if (subscriptionFilter) {
                params.append('subscription_plan', subscriptionFilter);
            }
            if (verifiedFilter) {
                params.append('verified', verifiedFilter);
            }

            const url = `profiles/?${params.toString()}`;
            const response = await authFetch(url);
            const data = await response.json();

            if (reset) {
                setProfiles(data.results);
            } else {
                setProfiles(data.results);
            }
            setNextPage(data.next);
        } catch (error) {
            console.error('Error fetching profiles:', error);
            alert.error("Failed to fetch profiles");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfiles(true);
    }, [debouncedSearch, brokerFilter, subscriptionFilter, verifiedFilter]);

    const fetchNextPage = async () => {
        if (!nextPage) return;
        setLoading(true);
        try {
            const url = new URL(nextPage);
            const response = await authFetch(url.pathname + url.search);
            const data = await response.json();
            setProfiles((prev) => [...prev, ...data.results]);
            setNextPage(data.next);
        } catch (error) {
            console.error('Error fetching next page:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (profile: Profile) => {
        setEditingProfile(profile);
        setIsEditModalOpen(true);
    };

    const handleUpdate = async (data: Partial<Profile>) => {
        if (!editingProfile) return;

        try {
            const response = await authFetch(`profiles/${editingProfile.id}/`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const updatedProfile = await response.json();
                setProfiles(prev => prev.map(p => p.id === updatedProfile.id ? updatedProfile : p));
                alert.success("Profile updated successfully");
                setIsEditModalOpen(false);
                setEditingProfile(null);
            } else {
                const errorData = await response.json();
                alert.error(errorData.detail || "Failed to update profile");
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert.error("An error occurred while updating profile");
        }
    };

    const clearAllFilters = () => {
        setBrokerFilter("");
        setSubscriptionFilter("");
        setVerifiedFilter("");
        setSearchQuery("");
    };

    const hasActiveFilters = brokerFilter || subscriptionFilter || verifiedFilter || searchQuery;

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold">User Profiles</h1>

                <div className="relative w-full md:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={18} className="text-gray-500 z-10" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search profiles..."
                        className="input input-bordered w-full pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-base-200 rounded-lg p-4 mb-6">
                <div className="flex flex-wrap items-center gap-4">
                    <label className="text-sm font-medium">Filters:</label>

                    {/* Broker Filter */}
                    <select
                        value={brokerFilter}
                        onChange={(e) => setBrokerFilter(e.target.value)}
                        className="select select-bordered select-sm w-40"
                    >
                        <option value="">All Brokers</option>
                        <option value="SHOONYA">Shoonya</option>
                        <option value="ZERODHA">Zerodha</option>
                    </select>

                    {/* Subscription Plan Filter */}
                    <select
                        value={subscriptionFilter}
                        onChange={(e) => setSubscriptionFilter(e.target.value)}
                        className="select select-bordered select-sm w-48"
                    >
                        <option value="">All Plans</option>
                        <option value="FREE">Free</option>
                        <option value="BASIC">Basic</option>
                        <option value="MASTERS">Masters</option>
                        <option value="LEGENDS">Legends</option>
                    </select>

                    {/* Verified Status Filter */}
                    <select
                        value={verifiedFilter}
                        onChange={(e) => setVerifiedFilter(e.target.value)}
                        className="select select-bordered select-sm w-40"
                    >
                        <option value="">All Status</option>
                        <option value="true">Verified</option>
                        <option value="false">Unverified</option>
                    </select>

                    {/* Clear Filters Button */}
                    {hasActiveFilters && (
                        <button
                            onClick={clearAllFilters}
                            className="btn btn-ghost btn-sm"
                        >
                            Clear All Filters
                        </button>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                {profiles.map((profile) => (
                    <ProfileItem
                        key={profile.id}
                        profile={profile}
                        onEdit={handleEdit}
                    />
                ))}
            </div>

            {loading && <p className="text-center text-gray-400 mt-4">Loading...</p>}

            {!loading && nextPage && (
                <div className="flex justify-center mt-6">
                    <button
                        onClick={fetchNextPage}
                        className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white transition-colors"
                    >
                        Load More
                    </button>
                </div>
            )}

            {!loading && profiles.length === 0 && (
                <p className="text-center text-gray-400">No profiles found.</p>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && editingProfile && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Edit Profile: {editingProfile.user.email}</h3>
                        <ProfileForm
                            initialData={editingProfile}
                            onSubmit={handleUpdate}
                            onCancel={() => setIsEditModalOpen(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}