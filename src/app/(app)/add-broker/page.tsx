"use client";

import React, { useEffect, useId, useState } from "react";
import { useRouter } from "nextjs-toploader/app";
import { useSearchParams } from "next/navigation";
import { authFetch } from "@/utils/api";
import { brokerLoginWithPolling } from "@/utils/brokerLogin";
import { useAuthStore } from "@/store/authStore";
import useAlert from "@/hooks/useAlert";
import BrokerCredentialHelpModal from "@/components/BrokerCredentialHelpModal";
import {
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Loader2,
  ArrowLeft,
  Network,
  Copy,
  Lock,
} from "lucide-react";

type Step = "credentials" | "login" | "result";
type ResultStatus = "loading" | "success" | "error" | null;

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

  /** Static IP from assigned broker proxy pool (whitelist at broker). */
  const [orderProxyWhitelistIp, setOrderProxyWhitelistIp] = useState<string | null>(null);

  const brokerNameId = useId();
  const brokerUserIdId = useId();
  const apiKeyId = useId();
  const secretKeyId = useId();
  const brokerTwofaId = useId();
  const brokerPasswordId = useId();

  const copyWhitelistIp = async () => {
    if (!orderProxyWhitelistIp) return;
    try {
      await navigator.clipboard.writeText(orderProxyWhitelistIp);
      alert.success("IP address copied");
    } catch {
      alert.error("Could not copy. Select the IP and copy manually.");
    }
  };

  /** Same resolution as admin/settings: use API top-level field, then pool, then legacy numeric proxy_host. */
  const resolveWhitelistIpFromPayload = (data: Record<string, unknown>): string | null => {
    const direct = data.order_proxy_whitelist_ip;
    if (typeof direct === "string" && direct.trim()) return direct.trim();
    const pool = data.broker_proxy_pool as { ip_address?: string } | null | undefined;
    const fromPool = pool?.ip_address;
    if (typeof fromPool === "string" && fromPool.trim()) return fromPool.trim();
    const ph = data.proxy_host;
    if (typeof ph === "string" && ph.trim()) {
      const t = ph.trim();
      if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(t)) return t;
    }
    return null;
  };

  const applyWhitelistIpFromPayload = (data: Record<string, unknown>) => {
    const ip = resolveWhitelistIpFromPayload(data);
    setOrderProxyWhitelistIp(ip);
  };

  const loadWhitelistIp = async (selectedBroker: string) => {
    if (!selectedBroker) {
      setOrderProxyWhitelistIp(null);
      return;
    }
    const brokerParam = encodeURIComponent(selectedBroker);
    const endpoints = [
      `profiles/my-pool-ip/?broker_name=${brokerParam}`,
      "profiles/check-profile/",
      "profiles/me/",
    ];
    for (const endpoint of endpoints) {
      const res = await authFetch(endpoint);
      if (!res.ok) continue;
      const data = (await res.json()) as Record<string, unknown>;
      const profileBroker = data.broker_name;
      if (
        typeof profileBroker === "string" &&
        profileBroker &&
        profileBroker !== selectedBroker
      ) {
        continue;
      }
      const ip = resolveWhitelistIpFromPayload(data);
      if (ip) {
        setOrderProxyWhitelistIp(ip);
        return;
      }
    }
    setOrderProxyWhitelistIp(null);
  };

  // Load whitelist IP on the login step (after profile + pool are assigned).
  useEffect(() => {
    if (step !== "login" || !savedBrokerName) return;
    let cancelled = false;
    void (async () => {
      try {
        await loadWhitelistIp(savedBrokerName);
      } catch {
        if (!cancelled) setOrderProxyWhitelistIp(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [step, savedBrokerName]);

  // If arriving from "Complete Setup" (existing unverified profile),
  // the profileId and broker name are passed as query params → skip to login step.
  useEffect(() => {
    const profileId = searchParams.get("profileId");
    const broker = searchParams.get("broker");
    if (profileId && broker) {
      setSavedProfileId(Number(profileId));
      setSavedBrokerName(broker);
      // setStep("login");
    }
  }, [searchParams]);

  // ── Step 1: Save credentials ──
  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!brokerName) { setFormError("Select a broker"); return; }
    if (!brokerUserId) { setFormError(brokerName === "IIFLCAPITAL" ? "Enter Client ID" : "Enter Broker User ID"); return; }
    if (brokerName === "KOTAKNEO" && !apiKey) { setFormError("Enter API Key"); return; }
    if (brokerName === "IIFLCAPITAL" && !apiKey) { setFormError("Enter App Key"); return; }
    if (brokerName === "PROSTOCKS" && !apiKey) { setFormError("Enter API Key"); return; }
    if ((brokerName === "ZERODHA" || brokerName === "SHOONYA") && !secretKey) {
      setFormError("Enter Secret Key");
      return;
    }
    if (brokerName === "IIFLCAPITAL" && !secretKey) {
      setFormError("Enter App Secret");
      return;
    }
    if (!brokerTwofa) { setFormError("Enter TOTP Secret"); return; }

    try {
      setSubmitting(true);

      const credPayload: {
        broker_name: string;
        broker_user_id: string;
        broker_api_key?: string;
        broker_secret_key?: string;
        broker_twofa?: string;
      } = {
        broker_name: brokerName,
        broker_user_id: brokerUserId,
      };
      if (brokerName === "KOTAKNEO" || brokerName === "IIFLCAPITAL" || brokerName === "PROSTOCKS") credPayload.broker_api_key = apiKey;
      if (brokerName === "ZERODHA" || brokerName === "SHOONYA" || brokerName === "IIFLCAPITAL") {
        credPayload.broker_secret_key = secretKey;
      }
      credPayload.broker_twofa = brokerTwofa;

      // If a profile already exists (in-session or on server), update it via PUT
      // so the user can correct wrong credentials without creating a duplicate.
      // Only allow create when server explicitly confirms "no profile" (404).
      let existingProfileId = savedProfileId;
      let canCreateProfile = !existingProfileId;
      if (!existingProfileId) {
        const checkRes = await authFetch("profiles/check-profile/");
        if (checkRes.ok) {
          const existing = (await checkRes.json()) as Record<string, unknown>;
          existingProfileId = (existing.id as number) || null;
          canCreateProfile = false;
          applyWhitelistIpFromPayload(existing);
        } else if (checkRes.status === 404) {
          canCreateProfile = true;
        } else {
          const err = await checkRes.json().catch(() => ({}));
          throw new Error(
            err.detail || err.message || "Could not confirm existing profile. Please try again."
          );
        }
      }

      if (existingProfileId) {
        const res = await authFetch("profiles/me/", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credPayload),
        });
        if (res.ok) {
          const data = (await res.json()) as Record<string, unknown>;
          applyWhitelistIpFromPayload(data);
          await loadWhitelistIp(brokerName);
          setSavedProfileId(existingProfileId);
          setSavedBrokerName(brokerName);
          setStep("login");
        } else {
          const err = await res.json().catch(() => ({}));
          setFormError(err.detail || err.message || "Failed to update broker credentials");
        }
      } else if (canCreateProfile) {
        // No existing profile — create a new one
        const res = await authFetch("profiles/", {
          method: "POST",
          body: JSON.stringify({ user_id: user!.id, ...credPayload }),
        });
        if (res.ok) {
          const data = (await res.json()) as Record<string, unknown>;
          applyWhitelistIpFromPayload(data);
          await loadWhitelistIp(brokerName);
          setSavedProfileId((data.id as number) || null);
          setSavedBrokerName(brokerName);
          setStep("login");
        } else {
          const err = await res.json().catch(() => ({}));
          setFormError(err.detail || err.message || "Failed to save broker credentials");
        }
      } else {
        setFormError("Could not identify your existing profile. Please try again.");
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

      const result = await brokerLoginWithPolling({
        brokerName: savedBrokerName,
        profileId,
        secret: brokerPassword,
      });

      if (result.status === "success") {
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
        setLoginError(result.message || "Login failed. Please check your credentials and try again.");
      }
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoggingIn(false);
    }
  };

  const whitelistIpBanner = (broker: string) => (
    <div className="rounded-lg border border-primary/25 bg-primary/5 px-3 py-2.5 text-sm">
      <div className="flex gap-2 items-start">
        <Network className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-base-content pr-1">
              Whitelist this IP at {broker}
            </p>
            {broker === "KOTAKNEO" || broker === "IIFLCAPITAL" || broker === "PROSTOCKS" ? (
              <button
                type="button"
                onClick={() => {
                  setHelpField("whitelist_ip");
                  setHelpOpen(true);
                }}
                className="text-primary hover:opacity-80 p-0.5 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                title={`How to add IP in ${broker === "IIFLCAPITAL" ? "IIFL Capital" : broker === "PROSTOCKS" ? "ProStocks" : "Kotak Neo"}`}
                aria-label={`Help: whitelist IP in ${broker === "IIFLCAPITAL" ? "IIFL Capital" : broker === "PROSTOCKS" ? "ProStocks" : "Kotak Neo"}`}
              >
                <HelpCircle className="h-4 w-4 cursor-pointer" aria-hidden="true" />
              </button>
            ) : null}
          </div>
          {orderProxyWhitelistIp ? (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <p className="text-base-content/90 font-mono text-sm tabular-nums tracking-tight break-all">
                {orderProxyWhitelistIp}
              </p>
              <button
                type="button"
                onClick={() => void copyWhitelistIp()}
                className="btn btn-ghost btn-xs gap-1 h-7 min-h-7 px-2 shrink-0 normal-case focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                title="Copy IP address"
              >
                <Copy className="size-3.5" aria-hidden="true" />
                Copy
              </button>
            </div>
          ) : (
            <p className="mt-1 text-xs text-warning leading-relaxed">
              Static IP not assigned yet for {broker}. Contact support if this does not appear
              shortly.
            </p>
          )}
          <p className="text-xs text-base-content/70 mt-1.5 leading-relaxed">
            Add this IP to your broker&apos;s allowlist (API / app settings) before logging in,
            so orders are not blocked.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-base-200 flex flex-col items-center justify-center px-4 py-8 lg:py-12">
      <div className="w-full max-w-md">

        {/* Back button */}
        {step !== "result" && (
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center cursor-pointer gap-1.5 text-sm text-base-content/70 hover:text-base-content mb-6 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
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

            <p className="sr-only" role="status">
              Step {stepOrder.indexOf(step) + 1} of {stepOrder.length}: {stepLabels[step]}
            </p>
            <div className="flex items-center gap-2" aria-hidden="true">
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
                            : "bg-base-300 text-base-content/60"
                        }`}
                      >
                        {isCompleted ? "✓" : idx + 1}
                      </div>
                      <span
                        className={`text-xs hidden sm:inline transition-colors ${
                          isCurrent ? "text-base-content font-medium" : "text-base-content/60"
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
              <form onSubmit={handleSaveCredentials} noValidate className="space-y-4">
                <div>
                  <label htmlFor={brokerNameId} className="block text-xs font-medium text-base-content/80 mb-1.5">Broker</label>
                  <select
                    id={brokerNameId}
                    name="brokerName"
                    required
                    aria-required="true"
                    value={brokerName}
                    onChange={(e) => { setBrokerName(e.target.value); setFormError(null); }}
                    className="select select-bordered select-sm w-full h-9 text-sm bg-base-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <option value="">Select broker</option>
                    <option value="KOTAKNEO">Kotak Neo</option>
                    {/* <option value="ZERODHA">Zerodha</option> */}
                    <option value="SHOONYA">Shoonya</option>
                    <option value="IIFLCAPITAL">IIFL Capital</option>
                    <option value="PROSTOCKS">ProStocks</option>
                  </select>
                </div>


                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label htmlFor={brokerUserIdId} className="text-xs font-medium text-base-content/80">
                      {brokerName === "IIFLCAPITAL" ? "Client ID" : "Broker User ID"}
                    </label>
                    {brokerName && (
                      <button
                        type="button"
                        onClick={() => { setHelpField("broker_user_id"); setHelpOpen(true); }}
                        className="text-primary hover:opacity-80 p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                        aria-label="How to get Broker User ID"
                      >
                        <HelpCircle className="h-3.5 w-3.5 cursor-pointer" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  <input
                    id={brokerUserIdId}
                    name="brokerUserId"
                    required
                    aria-required="true"
                    type="text"
                    value={brokerUserId}
                    onChange={(e) => { setBrokerUserId(e.target.value); setFormError(null); }}
                    className="input input-bordered input-sm w-full h-9 text-sm bg-base-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    placeholder={brokerName === "IIFLCAPITAL" ? "Client ID" : "Broker user ID"}
                  />
                </div>

                {(brokerName === "KOTAKNEO" || brokerName === "IIFLCAPITAL" || brokerName === "PROSTOCKS") && (
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <label htmlFor={apiKeyId} className="text-xs font-medium text-base-content/80">
                        {brokerName === "IIFLCAPITAL" ? "App Key" : "API Key"}
                      </label>
                      <button
                        type="button"
                        onClick={() => { setHelpField("api_key"); setHelpOpen(true); }}
                        className="text-primary hover:opacity-80 p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                        aria-label="How to get API Key"
                      >
                        <HelpCircle className="h-3.5 w-3.5 cursor-pointer" aria-hidden="true" />
                      </button>
                    </div>
                    <input
                      id={apiKeyId}
                      name="apiKey"
                      required
                      aria-required="true"
                      type="text"
                      value={apiKey}
                      onChange={(e) => { setApiKey(e.target.value); setFormError(null); }}
                      className="input input-bordered input-sm w-full h-9 text-sm bg-base-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      placeholder={brokerName === "IIFLCAPITAL" ? "App key" : "API key"}
                    />
                  </div>
                )}

                {(brokerName === "ZERODHA" || brokerName === "SHOONYA" || brokerName === "IIFLCAPITAL") && (
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <label htmlFor={secretKeyId} className="text-xs font-medium text-base-content/80">
                        {brokerName === "IIFLCAPITAL" ? "App Secret" : "Secret Key"}
                      </label>
                      <button
                        type="button"
                        onClick={() => { setHelpField("secret_key"); setHelpOpen(true); }}
                        className="text-primary hover:opacity-80 p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                        aria-label="How to get Secret Key"
                      >
                        <HelpCircle className="h-3.5 w-3.5 cursor-pointer" aria-hidden="true" />
                      </button>
                    </div>
                    <input
                      id={secretKeyId}
                      name="secretKey"
                      required
                      aria-required="true"
                      type="text"
                      value={secretKey}
                      onChange={(e) => { setSecretKey(e.target.value); setFormError(null); }}
                      className="input input-bordered input-sm w-full h-9 text-sm bg-base-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      placeholder={brokerName === "IIFLCAPITAL" ? "App secret" : "Secret key"}
                    />
                  </div>
                )}

                {brokerName && (
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <label htmlFor={brokerTwofaId} className="text-xs font-medium text-base-content/80">TOTP Secret</label>
                      <button
                        type="button"
                        onClick={() => { setHelpField("broker_twofa"); setHelpOpen(true); }}
                        className="text-primary hover:opacity-80 p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                        aria-label="How to get TOTP Secret"
                      >
                        <HelpCircle className="h-3.5 w-3.5 cursor-pointer" aria-hidden="true" />
                      </button>
                    </div>
                    <input
                      id={brokerTwofaId}
                      name="brokerTwofa"
                      required
                      aria-required="true"
                      type="text"
                      value={brokerTwofa}
                      onChange={(e) => { setBrokerTwofa(e.target.value); setFormError(null); }}
                      className="input input-bordered input-sm w-full h-9 text-sm bg-base-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      placeholder="TOTP secret"
                    />
                  </div>
                )}

                {formError && (
                  <div role="alert" className="flex items-center gap-1.5 text-error text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{formError}</span>
                  </div>
                )}

                <p className="mt-2 flex items-start gap-1.5 text-xs leading-snug text-base-content/70">
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                  <span>Hedgium encrypts sensitive credentials at rest using strong cryptographic standards, with secure key management practices to prevent unauthorized access.</span>
                </p>

                <button
                  type="submit"
                  disabled={submitting}
                  aria-busy={submitting}
                  className="btn btn-primary btn-sm w-full h-9 text-sm font-medium normal-case mt-1 disabled:!bg-primary disabled:!text-primary-content disabled:opacity-90 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Saving…
                    </>
                  ) : (
                    "Save & Continue"
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ── Step 2: Login ── */}
          {step === "login" && savedBrokerName && (
            <div className="p-6 space-y-4">
              {whitelistIpBanner(savedBrokerName)}
              <p className="text-sm text-base-content/70">
                Log in to your{" "}
                <span className="font-medium text-base-content">{savedBrokerName}</span> account
                to verify the connection and fetch your margin.
              </p>

              <div>
                <label htmlFor={brokerPasswordId} className="block text-sm font-medium text-base-content/80 mb-1.5">
                  {savedBrokerName === "KOTAKNEO" ? "MPIN" : "Password"}
                </label>

                <input
                  id={brokerPasswordId}
                  name="brokerPassword"
                  autoComplete="current-password"
                  type="password"
                  value={brokerPassword}
                  onChange={(e) => { setBrokerPassword(e.target.value); setLoginError(null); }}
                  className={`input input-bordered input-sm w-full h-9 text-sm bg-base-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${loginError ? "input-error" : ""}`}
                  placeholder={`Enter ${savedBrokerName === "KOTAKNEO" ? "MPIN" : "password"}`}
                  onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
                  aria-invalid={loginError ? true : undefined}
                  aria-describedby={loginError ? `${brokerPasswordId}-error` : undefined}
                />

                <p className="text-xs pt-2 leading-snug text-base-content/70 mb-1.5">
                  Hedgium does not store your{" "}
                  {savedBrokerName === "KOTAKNEO" ? "MPIN" : "password"} on our servers—it is only
                  used for this login.
                </p>
                {loginError && (
                  <div id={`${brokerPasswordId}-error`} role="alert" className="flex items-center gap-1.5 text-error text-sm mt-2">
                    <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{loginError}</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleLogin}
                disabled={loggingIn || !brokerPassword}
                aria-busy={loggingIn}
                className="btn btn-primary btn-sm w-full h-9 text-sm normal-case disabled:!bg-primary disabled:!text-primary-content disabled:opacity-90 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100"
              >
                {loggingIn
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />Logging in…</>
                  : `Login to ${savedBrokerName}`
                }
              </button>

              <button
                type="button"
                onClick={() => { setStep("credentials"); setLoginError(null); }}
                className="btn btn-ghost btn-sm w-full text-sm normal-case text-base-content/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Edit credentials
              </button>
            </div>
          )}

          {/* ── Step 3: Result ── */}
          {step === "result" && (
            <div className="p-6 text-center space-y-4" role="status" aria-live="polite" aria-busy={resultStatus === "loading"}>
              {resultStatus === "loading" ? (
                <>
                  <div className="flex justify-center py-2">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-base-content">Verifying connection…</h4>
                    <p className="text-sm text-base-content/70 mt-1">
                      Fetching your margin from {savedBrokerName}. Please wait.
                    </p>
                  </div>
                </>
              ) : resultStatus === "success" ? (
                <>
                  <div className="flex justify-center">
                    <div className="rounded-full bg-success/10 p-4">
                      <CheckCircle className="w-10 h-10 text-success" aria-hidden="true" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-base-content">Profile Added Successfully!</h4>
                    <p className="text-sm text-base-content/70 mt-1">
                      Your broker account is connected and margin has been fetched.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push("/home")}
                    className="btn btn-primary btn-sm normal-case w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100"
                  >
                    Go to Home
                  </button>
                </>
              ) : (
                <>
                  <div className="flex justify-center">
                    <div className="rounded-full bg-error/10 p-4">
                      <AlertCircle className="w-10 h-10 text-error" aria-hidden="true" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-base-content">Something Went Wrong</h4>
                    <p className="text-sm text-base-content/70 mt-1">
                      {resultError || "We couldn't complete the broker setup."}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setResultStatus(null); setResultError(null); setStep("login"); setLoginError(null); }}
                      className="btn btn-outline btn-sm flex-1 normal-case focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      Try Again
                    </button>
                    <a href="mailto:support@hedgium.in" className="btn btn-primary btn-sm flex-1 normal-case focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100">
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
