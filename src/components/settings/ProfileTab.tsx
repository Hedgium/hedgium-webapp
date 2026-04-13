"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { authFetch } from "@/utils/api";
import useAlert from "@/hooks/useAlert";
import VerifyEmail from "@/components/VerifyEmail";

/** Shown if API omits relationship_manager (should be set on the server). */
const DEFAULT_RELATIONSHIP_MANAGER = {
  displayName: "Kamlesh Ramchandani",
  email: "kamlesh.ramchandani@hedgium.in",
  phone: "8454838304",
};

type RelationshipManagerInfo = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  mobile?: string | null;
};

const ProfileTab: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const alert = useAlert();
  const [loading, setLoading] = useState(false);
  const [autoTradeAllowed, setAutoTradeAllowed] = useState(false);
  const [profileId, setProfileId] = useState<number | null>(null);
  const [relationshipManager, setRelationshipManager] =
    useState<RelationshipManagerInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifyEmailModalOpen, setVerifyEmailModalOpen] = useState(false);

  /** Load active profile (auto trade + relationship manager) from /profiles/me/ */
  const fetchProfile = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const res = await authFetch("profiles/me/");
      const data = await res.json();

      if (res.status === 404) {
        setAutoTradeAllowed(false);
        setProfileId(null);
        setRelationshipManager(null);
        return;
      }

      if (res.ok) {
        setAutoTradeAllowed(data.auto_trade_allowed ?? false);
        setProfileId(data.id ?? null);
        setRelationshipManager(data.relationship_manager ?? null);
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
          {user.email_verified ? (
            <p className="text-xs text-success mt-1">Email verified</p>
          ) : (
            <div className="mt-2">
              <p className="text-xs text-base-content/70 mb-2">
                Verify your email to secure your account and receive important updates.
              </p>
              <button
                type="button"
                className="btn btn-outline btn-sm normal-case"
                onClick={() => setVerifyEmailModalOpen(true)}
              >
                Verify email
              </button>
            </div>
          )}
        </div>
        <div>
          <p className="text-sm text-base-content/70">Phone</p>
          <p className="font-medium">{user.mobile || "—"}</p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-2">
            <span className="loading loading-spinner loading-sm"></span>
            <span className="text-sm text-base-content/70">Loading profile settings…</span>
          </div>
        ) : (
          <>
            <div className="pt-2 border-t border-base-300">
              <p className="text-sm text-base-content/70 mb-2">Relationship manager</p>
              {(() => {
                const rm = relationshipManager;
                const displayName = rm
                  ? `${rm.first_name || ""} ${rm.last_name || ""}`.trim() ||
                    DEFAULT_RELATIONSHIP_MANAGER.displayName
                  : DEFAULT_RELATIONSHIP_MANAGER.displayName;
                const email = rm?.email?.trim() || DEFAULT_RELATIONSHIP_MANAGER.email;
                const phone =
                  (rm?.mobile && String(rm.mobile).trim()) ||
                  DEFAULT_RELATIONSHIP_MANAGER.phone;
                return (
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{displayName}</p>
                    <p>
                      <a className="link link-primary" href={`mailto:${email}`}>
                        {email}
                      </a>
                    </p>
                    <p>
                      <a className="link link-primary" href={`tel:${phone.replace(/\s/g, "")}`}>
                        {phone}
                      </a>
                    </p>
                  </div>
                );
              })()}
            </div>

            {profileId ? (
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
          </>
        )}

        {error && (
          <div className="alert alert-error">
            <span className="text-sm">{error}</span>
          </div>
        )}

        {verifyEmailModalOpen && (
          <dialog open className="modal modal-open">
            <div className="modal-box max-h-[85vh] overflow-y-auto w-11/12 max-w-md">
              <VerifyEmail
                autoSendOnMount={true}
                showSkip={false}
                successPath=""
                skipPath=""
                onVerified={() => {
                  setVerifyEmailModalOpen(false);
                  updateUser({ email_verified: true, signup_step: "email_verified" });
                }}
              />
              <div className="modal-action pt-2">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm normal-case"
                  onClick={() => setVerifyEmailModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
            <div
              className="modal-backdrop"
              onClick={() => setVerifyEmailModalOpen(false)}
              onKeyDown={(e) => e.key === "Escape" && setVerifyEmailModalOpen(false)}
              role="button"
              tabIndex={0}
              aria-label="Close modal"
            />
          </dialog>
        )}
      </div>
    </div>
  );
};

export default ProfileTab;
