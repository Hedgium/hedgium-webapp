"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "nextjs-toploader/app";
import { useSearchParams } from "next/navigation";
import { authFetch } from "@/utils/api";
import { useAuthStore } from "@/store/authStore";
import useAlert from "@/hooks/useAlert";
import BrokerCredentialHelpModal from "@/components/BrokerCredentialHelpModal";
import {
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";

type Step = "credentials" | "login" | "result";
type ResultStatus = "loading" | "success" | "error" | null;

const BROKER_ENDPOINTS: Record<string, string> = {
  SHOONYA: "users/shoonya-login/",
  ZERODHA: "users/zerodha-login/",
  KOTAKNEO: "users/kotakneo-login/",
};

const stepLabels: Record<Step, string> = {
  credentials: "Credentials",
  login: "Login",
  result: "Verify",
};
const stepOrder: Step[] = ["credentials", "login", "result"];

export default function AddBrokerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const alert = useAlert();
  const { user, setBrokerNeedsRefresh } = useAuthStore();

  // ── Step state ──
  const [step, setStep] = useState<Step>("credentials");
  const [resultStatus, setResultStatus] = useState<ResultStatus>(null);
  const [resultError, setResultError] = useState<string | null>(null);

  // ── Credentials form ──
  const [brokerName, setBrokerName] = useState("");
  const [brokerUserId, setBrokerUserId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [brokerTwofa, setBrokerTwofa] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ── Login step ──
  const [savedProfileId, setSavedProfileId] = useState<number | null>(null);
  const [savedBrokerName, setSavedBrokerName] = useState<string | null>(null);
  const [brokerPassword, setBrokerPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // ── Help modal ──
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpField, setHelpField] = useState<string | null>(null);

  // If arriving from "Complete Setup" (existing unverified profile),
  // the profileId and broker name are passed as query params → skip to login step.
  useEffect(() => {
    const profileId = searchParams.get("profileId");
    const broker = searchParams.get("broker");
    if (profileId && broker) {
      setSavedProfileId(Number(profileId));
      setSavedBrokerName(broker);
      setStep("login");
    }
  }, [searchParams]);

  // ── Step 1: Save credentials ──
  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!brokerName) { setFormError("Select a broker"); return; }
    if (!brokerUserId) { setFormError("Enter Broker User ID"); return; }
    if (!apiKey) { setFormError("Enter API Key"); return; }
    if (brokerName === "ZERODHA" && !secretKey) { setFormError("Enter Secret Key"); return; }
    if (!brokerTwofa) { setFormError("Enter TOTP Secret"); return; }

    try {
      setSubmitting(true);

      const credPayload: {
        broker_name: string;
        broker_user_id: string;
        broker_api_key: string;
        broker_secret_key?: string;
        broker_twofa?: string;
      } = {
        broker_name: brokerName,
        broker_user_id: brokerUserId,
        broker_api_key: apiKey,
      };
      if (brokerName === "ZERODHA") credPayload.broker_secret_key = secretKey;
      credPayload.broker_twofa = brokerTwofa;

      // If a profile already exists (in-session or on server), update it via PUT
      // so the user can correct wrong credentials without creating a duplicate
      let existingProfileId = savedProfileId;
      if (!existingProfileId) {
        const checkRes = await authFetch("profiles/check-profile/");
        if (checkRes.ok) {
          const existing = await checkRes.json();
          existingProfileId = existing.id || null;
        }
      }

      if (existingProfileId) {
        const res = await authFetch("profiles/me/", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credPayload),
        });
        if (res.ok) {
          setSavedProfileId(existingProfileId);
          setSavedBrokerName(brokerName);
          setStep("login");
        } else {
          const err = await res.json().catch(() => ({}));
          setFormError(err.detail || err.message || "Failed to update broker credentials");
        }
      } else {
        // No existing profile — create a new one
        const res = await authFetch("profiles/", {
          method: "POST",
          body: JSON.stringify({ user_id: user!.id, ...credPayload }),
        });
        if (res.ok) {
          const data = await res.json();
          setSavedProfileId(data.id || null);
          setSavedBrokerName(brokerName);
          setStep("login");
        } else {
          const err = await res.json().catch(() => ({}));
          setFormError(err.detail || err.message || "Failed to save broker credentials");
        }
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step 2: Login to broker, then fetch margin ──
  const handleLogin = async () => {
    setLoginError(null);
    if (!brokerPassword) { setLoginError("Please enter your password / MPIN"); return; }
    if (!savedBrokerName) { setLoginError("Broker information missing"); return; }

    setLoggingIn(true);
    try {
      // Resolve profileId if missing
      let profileId = savedProfileId;
      if (!profileId) {
        const profileRes = await authFetch("profiles/check-profile/");
        if (profileRes.ok) {
          const d = await profileRes.json();
          profileId = d.id || null;
          setSavedProfileId(profileId);
        }
      }
      if (!profileId) throw new Error("Could not find profile. Please go back and try again.");

      const endpoint = BROKER_ENDPOINTS[savedBrokerName];
      if (!endpoint) throw new Error(`Login not supported for ${savedBrokerName}`);

      const payload: { profile_id: string; mpin?: string; pwd?: string } = {
        profile_id: String(profileId),
      };
      if (savedBrokerName === "KOTAKNEO") payload.mpin = brokerPassword;
      else payload.pwd = brokerPassword;

      const res = await authFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.status === "success") {
        // Move to result step with loading state while margin is being fetched
        setStep("result");
        setResultStatus("loading");
        try {
          const marginRes = await authFetch("profiles/refresh-margin/");
          const marginData = await marginRes.json();
          if (!marginRes.ok) throw new Error(marginData.detail || "Failed to fetch margin");
          setResultStatus("success");
          // Signal BrokerConnect to refresh its state
          setBrokerNeedsRefresh(true);
        } catch (marginErr) {
          setResultStatus("error");
          setResultError(marginErr instanceof Error ? marginErr.message : "Failed to fetch margin");
        }
      } else {
        // Surface the exact error from the broker
        setLoginError(data.message || "Login failed. Please check your credentials and try again.");
      }
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="bg-base-200 flex flex-col items-center justify-center px-4 py-8 lg:py-12">
      <div className="w-full max-w-md">

        {/* Back button */}
        {step !== "result" && (
          <button
            onClick={() => router.back()}
            className="flex items-center cursor-pointer gap-1.5 text-sm text-base-content/60 hover:text-base-content mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}

        {/* Card */}
        <div className="bg-base-100 rounded-xl border border-base-300 shadow-sm">

          {/* Header + step indicator */}
          <div className="p-6 pb-4 border-b border-base-300">
            <h1 className="text-xl font-semibold text-base-content tracking-tight mb-4">
              Connect Broker
            </h1>

            <div className="flex items-center gap-2">
              {stepOrder.map((s, idx) => {
                const currentIdx = stepOrder.indexOf(step);
                const isCompleted = idx < currentIdx;
                const isCurrent = idx === currentIdx;
                return (
                  <div key={s} className="flex items-center gap-2 flex-1 last:flex-none">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                          isCompleted
                            ? "bg-success text-success-content"
                            : isCurrent
                            ? "bg-primary text-primary-content"
                            : "bg-base-300 text-base-content/40"
                        }`}
                      >
                        {isCompleted ? "✓" : idx + 1}
                      </div>
                      <span
                        className={`text-xs hidden sm:inline transition-colors ${
                          isCurrent ? "text-base-content font-medium" : "text-base-content/40"
                        }`}
                      >
                        {stepLabels[s]}
                      </span>
                    </div>
                    {idx < stepOrder.length - 1 && (
                      <div
                        className={`flex-1 h-px transition-colors ${
                          isCompleted ? "bg-success" : "bg-base-300"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Step 1: Credentials ── */}
          {step === "credentials" && (
            <div className="p-6">
              <form onSubmit={handleSaveCredentials} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-base-content/80 mb-1.5">Broker</label>
                  <select
                    value={brokerName}
                    onChange={(e) => { setBrokerName(e.target.value); setFormError(null); }}
                    className="select select-bordered select-sm w-full h-9 text-sm bg-base-100"
                  >
                    <option value="">Select broker</option>
                    <option value="KOTAKNEO">Kotak Neo</option>
                    {/* <option value="ZERODHA">Zerodha</option> */}
                    <option value="SHOONYA">Shoonya</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label className="text-xs font-medium text-base-content/80">Broker User ID</label>
                    {brokerName && (
                      <button type="button" onClick={() => { setHelpField("broker_user_id"); setHelpOpen(true); }} className="text-primary hover:opacity-80 p-0.5">
                        <HelpCircle className="h-3.5 w-3.5 cursor-pointer" />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={brokerUserId}
                    onChange={(e) => { setBrokerUserId(e.target.value); setFormError(null); }}
                    className="input input-bordered input-sm w-full h-9 text-sm bg-base-100"
                    placeholder="Broker user ID"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label className="text-xs font-medium text-base-content/80">API Key</label>
                    {brokerName && (
                      <button type="button" onClick={() => { setHelpField("api_key"); setHelpOpen(true); }} className="text-primary hover:opacity-80 p-0.5">
                        <HelpCircle className="h-3.5 w-3.5 cursor-pointer" />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => { setApiKey(e.target.value); setFormError(null); }}
                    className="input input-bordered input-sm w-full h-9 text-sm bg-base-100"
                    placeholder="API key"
                  />
                </div>

                {brokerName === "ZERODHA" && (
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <label className="text-xs font-medium text-base-content/80">Secret Key</label>
                      <button type="button" onClick={() => { setHelpField("secret_key"); setHelpOpen(true); }} className="text-primary hover:opacity-80 p-0.5">
                        <HelpCircle className="h-3.5 w-3.5 cursor-pointer" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={secretKey}
                      onChange={(e) => { setSecretKey(e.target.value); setFormError(null); }}
                      className="input input-bordered input-sm w-full h-9 text-sm bg-base-100"
                      placeholder="Secret key"
                    />
                  </div>
                )}

                {brokerName && (
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <label className="text-xs font-medium text-base-content/80">TOTP Secret</label>
                      <button type="button" onClick={() => { setHelpField("broker_twofa"); setHelpOpen(true); }} className="text-primary hover:opacity-80 p-0.5">
                        <HelpCircle className="h-3.5 w-3.5 cursor-pointer" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={brokerTwofa}
                      onChange={(e) => { setBrokerTwofa(e.target.value); setFormError(null); }}
                      className="input input-bordered input-sm w-full h-9 text-sm bg-base-100"
                      placeholder="TOTP secret"
                    />
                  </div>
                )}

                {formError && (
                  <div className="flex items-center gap-1.5 text-error text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary btn-sm w-full h-9 text-sm font-medium normal-case mt-1"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save & Continue"}
                </button>
              </form>
            </div>
          )}

          {/* ── Step 2: Login ── */}
          {step === "login" && (
            <div className="p-6 space-y-4">
              <p className="text-sm text-base-content/70">
                Credentials saved. Log in to your{" "}
                <span className="font-medium text-base-content">{savedBrokerName}</span> account
                to verify the connection and fetch your margin.
              </p>

              <div>
                <label className="block text-xs font-medium text-base-content/80 mb-1.5">
                  {savedBrokerName === "KOTAKNEO" ? "MPIN" : "Password"}
                </label>
                <input
                  type="password"
                  value={brokerPassword}
                  onChange={(e) => { setBrokerPassword(e.target.value); setLoginError(null); }}
                  className={`input input-bordered input-sm w-full h-9 text-sm bg-base-100 ${loginError ? "input-error" : ""}`}
                  placeholder={`Enter ${savedBrokerName === "KOTAKNEO" ? "MPIN" : "password"}`}
                  onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
                />
                {loginError && (
                  <div className="flex items-center gap-1.5 text-error text-sm mt-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleLogin}
                disabled={loggingIn || !brokerPassword}
                className="btn btn-primary btn-sm w-full h-9 text-sm normal-case"
              >
                {loggingIn
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Logging in...</>
                  : `Login to ${savedBrokerName}`
                }
              </button>

              <button
                type="button"
                onClick={() => { setStep("credentials"); setLoginError(null); }}
                className="btn btn-ghost btn-sm w-full text-sm normal-case text-base-content/60"
              >
                ← Edit credentials
              </button>
            </div>
          )}

          {/* ── Step 3: Result ── */}
          {step === "result" && (
            <div className="p-6 text-center space-y-4">
              {resultStatus === "loading" ? (
                <>
                  <div className="flex justify-center py-2">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-base-content">Verifying connection...</h4>
                    <p className="text-sm text-base-content/60 mt-1">
                      Fetching your margin from {savedBrokerName}. Please wait.
                    </p>
                  </div>
                </>
              ) : resultStatus === "success" ? (
                <>
                  <div className="flex justify-center">
                    <div className="rounded-full bg-success/10 p-4">
                      <CheckCircle className="w-10 h-10 text-success" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-base-content">Profile Added Successfully!</h4>
                    <p className="text-sm text-base-content/60 mt-1">
                      Your broker account is connected and margin has been fetched.
                    </p>
                  </div>
                  <button
                    onClick={() => router.push("/hedgium/dashboard")}
                    className="btn btn-primary btn-sm normal-case w-full"
                  >
                    Go to Dashboard
                  </button>
                </>
              ) : (
                <>
                  <div className="flex justify-center">
                    <div className="rounded-full bg-error/10 p-4">
                      <AlertCircle className="w-10 h-10 text-error" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-base-content">Something Went Wrong</h4>
                    <p className="text-sm text-base-content/60 mt-1">
                      {resultError || "We couldn't complete the broker setup."}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setResultStatus(null); setResultError(null); setStep("login"); setLoginError(null); }}
                      className="btn btn-outline btn-sm flex-1 normal-case"
                    >
                      Try Again
                    </button>
                    <a href="mailto:support@hedgium.in" className="btn btn-primary btn-sm flex-1 normal-case">
                      Contact Us
                    </a>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <BrokerCredentialHelpModal
        open={helpOpen}
        onClose={() => { setHelpOpen(false); setHelpField(null); }}
        brokerKey={brokerName}
        field={helpField}
      />
    </div>
  );
}
