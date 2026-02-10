"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { authFetch } from "@/utils/api";
import useAlert from "@/hooks/useAlert";

const ProfileTab: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const alert = useAlert();
  const [loading, setLoading] = useState(false);
  const [autoTradeAllowed, setAutoTradeAllowed] = useState(false);
  const [profileId, setProfileId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** 🔍 Fetch active profile to get auto_trade_allowed */
  const fetchProfile = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const res = await authFetch("profiles/check-profile/");
      const data = await res.json();

      if (res.ok) {
        setAutoTradeAllowed(data.auto_trade_allowed ?? false);
        setProfileId(data.id ?? null);
      }
    } catch (err) {
      console.error("Profile fetch failed:", err);
      setError("Failed to load profile settings");
    } finally {
      setLoading(false);
    }
  };

  /** 🔄 Toggle auto trade allowed */
  const toggleAutoTrade = async () => {
    if (!user || profileId == null) return;
    setError(null);

    const newValue = !autoTradeAllowed;

    try {
      const res = await authFetch("profiles/me/", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ auto_trade_allowed: newValue }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to update auto trade setting");
      }

      setAutoTradeAllowed(newValue);
      alert.success(
        newValue 
          ? "Auto trading enabled" 
          : "Auto trading disabled"
      );
    } catch (err: unknown) {
      console.error("Auto trade toggle failed:", err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : "Failed to update auto trade setting.";
      setError(errorMessage);
      alert.error(errorMessage);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  if (!user) {
    return (
      <div className="card bg-base-100 border border-base-300 card-hover p-6">
        <h2 className="text-2xl font-bold mb-6">Profile</h2>
        <p className="text-base-content/70">No user data available.</p>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 border border-base-300 p-6">
      <h2 className="text-2xl font-bold mb-6">Profile</h2>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-base-content/70">Name</p>
          <p className="font-medium">{user.first_name} {user.last_name}</p>
        </div>
        <div>
          <p className="text-sm text-base-content/70">Email</p>
          <p className="font-medium">{user.email || "—"}</p>
        </div>
        <div>
          <p className="text-sm text-base-content/70">Phone</p>
          <p className="font-medium">{user.mobile || "—"}</p>
        </div>
        
        {loading ? (
          <div className="flex items-center gap-2">
            <span className="loading loading-spinner loading-sm"></span>
            <span className="text-sm text-base-content/70">Loading settings...</span>
          </div>
        ) : profileId ? (
          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-4">
              <span className="label-text font-medium">Auto Trade Allowed</span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={autoTradeAllowed}
                onChange={toggleAutoTrade}
              />
            </label>
            <p className="text-xs text-base-content/60 mt-1">
              Enable automatic trading for your strategies
            </p>
          </div>
        ) : (
          <div className="text-sm text-base-content/70">
            No active profile found. Please connect a broker first.
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileTab;
