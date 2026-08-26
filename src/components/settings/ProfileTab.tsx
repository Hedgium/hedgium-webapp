"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { isDemoUser } from "@/lib/demo";
import { authFetch } from "@/utils/api";
import useAlert from "@/hooks/useAlert";
import VerifyEmail from "@/components/VerifyEmail";
import ActionOtpModal from "@/components/settings/ActionOtpModal";
import {
  confirmAutoTrade,
  confirmStrategiesPaused,
  type ProfileActionOtpPurpose,
} from "@/services/profileActions";

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
  const [strategiesPaused, setStrategiesPaused] = useState(false);
  const [profileId, setProfileId] = useState<number | null>(null);
  const [relationshipManager, setRelationshipManager] =
    useState<RelationshipManagerInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifyEmailModalOpen, setVerifyEmailModalOpen] = useState(false);
  const [otpAction, setOtpAction] = useState<
    | { purpose: ProfileActionOtpPurpose; nextValue: boolean }
    | null
  >(null);
  const verifyEmailDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const node = verifyEmailDialogRef.current;
    if (!node) return;
    if (verifyEmailModalOpen && !node.open) {
      node.showModal();
    } else if (!verifyEmailModalOpen && node.open) {
      node.close();
    }
  }, [verifyEmailModalOpen]);

  /** Load active profile (auto trade + pause + relationship manager) from /profiles/me/ */
  const fetchProfile = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const res = await authFetch("profiles/me/");
      const data = await res.json();

      if (res.status === 404) {
        setAutoTradeAllowed(false);
        setStrategiesPaused(false);
        setProfileId(null);
        setRelationshipManager(null);
        return;
      }

      if (res.ok) {
        setAutoTradeAllowed(data.auto_trade_allowed ?? false);
        setStrategiesPaused(data.strategies_paused ?? false);
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

  const requestAutoTradeChange = () => {
    if (!user || profileId == null || isDemoUser(user)) return;
    setError(null);
    setOtpAction({ purpose: "auto_trade", nextValue: !autoTradeAllowed });
  };

  const requestPauseChange = () => {
    if (!user || profileId == null || isDemoUser(user)) return;
    setError(null);
    setOtpAction({ purpose: "strategies_paused", nextValue: !strategiesPaused });
  };

  const handleOtpConfirm = async (otp: string) => {
    if (!otpAction) return;
    if (otpAction.purpose === "auto_trade") {
      const profile = await confirmAutoTrade(otpAction.nextValue, otp);
      setAutoTradeAllowed(profile.auto_trade_allowed ?? otpAction.nextValue);
      alert.success(
        otpAction.nextValue ? "Auto trading enabled" : "Auto trading disabled"
      );
    } else {
      const profile = await confirmStrategiesPaused(otpAction.nextValue, otp);
      setStrategiesPaused(profile.strategies_paused ?? otpAction.nextValue);
      alert.success(
        otpAction.nextValue
          ? "Strategies paused. You will not be assigned new strategies."
          : "Strategies resumed. You can receive new strategies again."
      );
    }
    setOtpAction(null);
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
              {!isDemoUser(user) ? (
              <button
                type="button"
                className="btn btn-outline btn-sm normal-case"
                onClick={() => setVerifyEmailModalOpen(true)}
              >
                Verify email
              </button>
              ) : null}
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
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-4">
                    <span className="label-text font-medium">Auto Trade Allowed</span>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={autoTradeAllowed}
                      onChange={requestAutoTradeChange}
                      disabled={isDemoUser(user)}
                      aria-disabled={isDemoUser(user)}
                    />
                  </label>
                  <p className="text-xs text-base-content/70 mt-1">
                    {isDemoUser(user)
                      ? "Preview account — settings are read-only."
                      : "Enable automatic trading for your strategies. Changing this requires a verification code."}
                  </p>
                </div>

                <div className="form-control">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="label-text font-medium">Strategy assignment</span>
                    <button
                      type="button"
                      className={`btn btn-sm normal-case ${
                        strategiesPaused ? "btn-primary" : "btn-outline"
                      }`}
                      onClick={requestPauseChange}
                      disabled={isDemoUser(user)}
                      aria-disabled={isDemoUser(user)}
                    >
                      {strategiesPaused ? "Resume strategies" : "Pause strategies"}
                    </button>
                    {strategiesPaused ? (
                      <span className="badge badge-warning badge-sm">Paused</span>
                    ) : null}
                  </div>
                  <p className="text-xs text-base-content/70 mt-1">
                    {isDemoUser(user)
                      ? "Preview account — settings are read-only."
                      : strategiesPaused
                        ? "You will not be assigned new strategies. Strategies you already have keep running."
                        : "Pause to stop receiving new strategies. Current live strategies keep running."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-sm text-base-content/70">
                No active profile found. Please connect a broker first.
              </div>
            )}
          </>
        )}

        {error && (
          <div className="alert alert-error" role="alert">
            <span className="text-sm">{error}</span>
          </div>
        )}

        <dialog
          ref={verifyEmailDialogRef}
          className="modal"
          aria-label="Verify email"
          onClose={() => setVerifyEmailModalOpen(false)}
          onCancel={() => setVerifyEmailModalOpen(false)}
        >
          <div className="modal-box max-h-[85vh] overflow-y-auto w-11/12 max-w-md">
            {verifyEmailModalOpen && (
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
            )}
            <div className="modal-action pt-2">
              <button
                type="button"
                className="btn btn-ghost btn-sm normal-case focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={() => setVerifyEmailModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button aria-label="Close">close</button>
          </form>
        </dialog>

        {otpAction ? (
          <ActionOtpModal
            open={otpAction != null}
            purpose={otpAction.purpose}
            title={
              otpAction.purpose === "auto_trade"
                ? otpAction.nextValue
                  ? "Enable auto trade"
                  : "Disable auto trade"
                : otpAction.nextValue
                  ? "Pause strategies"
                  : "Resume strategies"
            }
            description={
              otpAction.purpose === "auto_trade"
                ? "Enter the verification code to confirm this auto-trade change."
                : otpAction.nextValue
                  ? "Enter the verification code to pause new strategy assignment. Live strategies keep running."
                  : "Enter the verification code to start receiving new strategies again."
            }
            confirmLabel="Confirm"
            onConfirm={handleOtpConfirm}
            onClose={() => setOtpAction(null)}
          />
        ) : null}
      </div>
    </div>
  );
};

export default ProfileTab;
