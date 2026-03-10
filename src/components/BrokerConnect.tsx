"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/utils/api";
import { formatMoneyIN } from "@/utils/formatNumber";
import { useAuthStore } from "@/store/authStore";
import {
  RotateCw,
  Plus,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Loader2,
} from "lucide-react";
import useAlert from "@/hooks/useAlert";
import BrokerCredentialHelpModal from "@/components/BrokerCredentialHelpModal";

interface BrokerState {
  loading: boolean;
  hasProfile: boolean;
  verified: boolean;
  loggedIn: boolean;
  name: string | null;
  userId?: string | null;
  margin?: number | null;
  profileId?: number | null;
}

type AddBrokerStep = "credentials" | "login" | "result";
type ResultStatus = "success" | "error" | null;

export default function BrokerLoginStatus() {
  const alert = useAlert();
  const { user } = useAuthStore();

  const [broker, setBroker] = useState<BrokerState>({
    loading: true,
    hasProfile: false,
    verified: false,
    loggedIn: false,
    name: null,
    userId: null,
    margin: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Existing broker login modal (for already-added profiles)
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  // Add broker multi-step modal
  const [showAddBrokerModal, setShowAddBrokerModal] = useState(false);
  const [addBrokerStep, setAddBrokerStep] = useState<AddBrokerStep>("credentials");
  const [resultStatus, setResultStatus] = useState<ResultStatus>(null);
  const [resultError, setResultError] = useState<string | null>(null);

  // Credentials form state
  const [brokerName, setBrokerName] = useState("");
  const [brokerUserId, setBrokerUserId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [brokerTwofa, setBrokerTwofa] = useState("");
  const [submittingCredentials, setSubmittingCredentials] = useState(false);
  const [savedProfileId, setSavedProfileId] = useState<number | null>(null);
  const [savedBrokerName, setSavedBrokerName] = useState<string | null>(null);

  // Login step state
  const [brokerPassword, setBrokerPassword] = useState("");
  const [loggingInBroker, setLoggingInBroker] = useState(false);

  // Help modal
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [helpField, setHelpField] = useState<string | null>(null);

  const fetchActiveProfile = async () => {
    if (!user) return;
    setBroker((b) => ({ ...b, loading: true }));
    setError(null);

    try {
      const res = await authFetch("profiles/check-profile/");
      if (!res.ok) {
        setBroker({ loading: false, hasProfile: false, verified: false, loggedIn: false, name: null });
        return;
      }
      const data = await res.json();
      setBroker({
        loading: false,
        hasProfile: !!data.id,
        verified: data.verified || false,
        loggedIn: data.logged_in || false,
        name: data.broker_name || null,
        userId: data.broker_user_id || null,
        margin: data.margin_equity ?? null,
        profileId: data.id || null,
      });
    } catch (err) {
      console.error("Broker check failed:", err);
      setBroker({ loading: false, hasProfile: false, verified: false, loggedIn: false, name: null });
    }
  };

  const refreshMargin = async () => {
    if (!user) return;
    setRefreshing(true);
    setError(null);

    try {
      const res = await authFetch("profiles/refresh-margin/");
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to fetch margin");
      alert.success("Margins updated from your broker");
      await fetchActiveProfile();
    } catch (err) {
      console.error("Margin refresh failed:", err);
      setError("Failed to refresh margin.");
      await fetchActiveProfile();
    } finally {
      setRefreshing(false);
    }
  };

  // Login flow for already-added broker
  const handleBrokerLogin = async () => {
    if (!password) {
      alert.error("Please enter password/mpin");
      return;
    }
    if (!broker.profileId || !broker.name) {
      alert.error("Profile information missing");
      return;
    }
    setLoggingIn(true);
    setError(null);

    try {
      const brokerEndpoints: Record<string, string> = {
        SHOONYA: "users/shoonya-login/",
        ZERODHA: "users/zerodha-login/",
        KOTAKNEO: "users/kotakneo-login/",
      };
      const endpoint = brokerEndpoints[broker.name];
      if (!endpoint) throw new Error(`Login not supported for ${broker.name}`);

      const payload: { profile_id: string; mpin?: string; pwd?: string } = {
        profile_id: String(broker.profileId),
      };
      if (broker.name === "KOTAKNEO") payload.mpin = password;
      else payload.pwd = password;

      const res = await authFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.status === "success") {
        alert.success(`${broker.name} login successful`);
        setShowLoginModal(false);
        setPassword("");
        await fetchActiveProfile();
        setTimeout(async () => {
          await refreshMargin();
        }, 500);
      } else {
        throw new Error(data.message || "Login failed");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
      alert.error(message);
    } finally {
      setLoggingIn(false);
    }
  };

  // Reset add broker modal state
  const resetAddBrokerModal = () => {
    setAddBrokerStep("credentials");
    setResultStatus(null);
    setResultError(null);
    setBrokerName("");
    setBrokerUserId("");
    setApiKey("");
    setSecretKey("");
    setBrokerTwofa("");
    setBrokerPassword("");
    setSavedProfileId(null);
    setSavedBrokerName(null);
  };

  // Step 1: Save credentials
  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brokerName) {
      alert.error("Select a broker");
      return;
    }
    if (!brokerUserId) {
      alert.error("Enter Broker User ID");
      return;
    }
    if (!apiKey) {
      alert.error("Enter API Key");
      return;
    }
    if (brokerName === "ZERODHA" && !secretKey) {
      alert.error("Enter Secret Key");
      return;
    }
    if (!brokerTwofa) {
      alert.error(brokerName === "KOTAKNEO" ? "Enter TOTP Secret" : "Enter TOTP Secret");
      return;
    }

    try {
      setSubmittingCredentials(true);

      // Guard: if a profile was already created in this session, skip POST
      if (savedProfileId) {
        setSavedBrokerName(brokerName || savedBrokerName);
        setAddBrokerStep("login");
        return;
      }

      // Guard: if a profile already exists on the server, reuse it instead of creating a duplicate
      const checkRes = await authFetch("profiles/check-profile/");
      if (checkRes.ok) {
        const existing = await checkRes.json();
        if (existing.id) {
          setSavedProfileId(existing.id);
          setSavedBrokerName(existing.broker_name || brokerName);
          setAddBrokerStep("login");
          return;
        }
      }

      const formData: {
        user_id: number;
        broker_name: string;
        broker_user_id: string;
        broker_api_key: string;
        broker_secret_key?: string;
        broker_twofa?: string;
      } = {
        user_id: user!.id,
        broker_name: brokerName,
        broker_user_id: brokerUserId,
        broker_api_key: apiKey,
      };
      if (brokerName === "ZERODHA") formData.broker_secret_key = secretKey;
      formData.broker_twofa = brokerTwofa;

      const res = await authFetch("profiles/", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        setSavedProfileId(data.id || null);
        setSavedBrokerName(brokerName);
        setAddBrokerStep("login");
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert.error(errorData.message || "Failed to add broker");
      }
    } catch (err: unknown) {
      alert.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmittingCredentials(false);
    }
  };

  // Step 2: Login to newly added broker, then fetch margin
  const handleLoginNewBroker = async () => {
    if (!brokerPassword) {
      alert.error("Please enter password/mpin");
      return;
    }
    if (!savedBrokerName) {
      alert.error("Broker information missing");
      return;
    }

    setLoggingInBroker(true);

    try {
      // If savedProfileId is null, refetch profile to get it
      let profileId = savedProfileId;
      if (!profileId) {
        const profileRes = await authFetch("profiles/check-profile/");
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          profileId = profileData.id || null;
          setSavedProfileId(profileId);
        }
      }

      if (!profileId) throw new Error("Could not find profile ID. Please try again.");

      const brokerEndpoints: Record<string, string> = {
        SHOONYA: "users/shoonya-login/",
        ZERODHA: "users/zerodha-login/",
        KOTAKNEO: "users/kotakneo-login/",
      };
      const endpoint = brokerEndpoints[savedBrokerName];
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
        // Fetch margin to verify the connection
        setAddBrokerStep("result");
        try {
          const marginRes = await authFetch("profiles/refresh-margin/");
          const marginData = await marginRes.json();
          if (!marginRes.ok) throw new Error(marginData.detail || "Failed to fetch margin");
          setResultStatus("success");
          await fetchActiveProfile();
        } catch (marginErr) {
          setResultStatus("error");
          setResultError(
            marginErr instanceof Error ? marginErr.message : "Failed to fetch margin"
          );
        }
      } else {
        throw new Error(data.message || "Login failed");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setAddBrokerStep("result");
      setResultStatus("error");
      setResultError(message);
    } finally {
      setLoggingInBroker(false);
    }
  };

  useEffect(() => {
    fetchActiveProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const stepLabels: Record<AddBrokerStep, string> = {
    credentials: "Credentials",
    login: "Login",
    result: "Verify",
  };
  const stepOrder: AddBrokerStep[] = ["credentials", "login", "result"];

  return (
    <>
      {/* ── Broker Status Bar ── */}
      <div className="p-4 md:px-8 border-b border-b-base-300">
        <div className="flex justify-between items-center">
          {broker.loading ? (
            <p className="text-sm opacity-70 animate-pulse">Checking broker status...</p>

          ) : !broker.hasProfile || !broker.verified ? (
            /* ── State 1 & 2: No profile OR profile not yet verified (setup incomplete) ── */
            <div className="flex items-center gap-3">
              <span className="text-sm text-base-content/60">
                {broker.hasProfile ? "Broker setup incomplete" : "No broker connected"}
              </span>
              <button
                onClick={() => {
                  resetAddBrokerModal();
                  // If a profile already exists, skip credentials and go straight to login
                  if (broker.hasProfile && broker.profileId) {
                    setSavedProfileId(broker.profileId);
                    setSavedBrokerName(broker.name);
                    setAddBrokerStep("login");
                  }
                  setShowAddBrokerModal(true);
                }}
                className="btn btn-primary btn-sm gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                {broker.hasProfile ? "Complete Setup" : "Add Broker"}
              </button>
            </div>

          ) : (
            /* ── State 3 & 4: Verified — show login / margin ── */
            <>
              <div className="flex items-center gap-2">
                <span>Broker:</span>
                {broker.loggedIn ? (
                  <span className="font-medium">{broker.name}</span>
                ) : (
                  <>
                    <span className="text-error font-medium">Not logged in</span>
                    {broker.name && (
                      <button
                        onClick={() => setShowLoginModal(true)}
                        disabled={loggingIn}
                        className="btn btn-primary btn-sm"
                      >
                        Login
                      </button>
                    )}
                  </>
                )}
              </div>

              {broker.margin != null && broker.loggedIn && (
                <p className="flex items-center gap-2">
                  <span className="font-medium">Margin:</span>{" "}
                  {formatMoneyIN(broker.margin, { decimals: 0 })}
                  <button
                    onClick={refreshMargin}
                    disabled={refreshing}
                    className={`btn btn-ghost btn-xs ${refreshing ? "animate-spin" : ""}`}
                  >
                    <RotateCw size={16} />
                  </button>
                </p>
              )}
            </>
          )}
        </div>
        {error && <p className="text-error text-sm mt-2">{error}</p>}
      </div>

      {/* ── Existing Login Modal (for already-connected broker) ── */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-base-100 p-6 rounded-xl shadow-xl max-w-md w-full">
            <h3 className="font-bold text-lg mb-4">Login to {broker.name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {broker.name === "KOTAKNEO" ? "MPIN" : "Password"}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input input-bordered w-full"
                  placeholder={`Enter ${broker.name === "KOTAKNEO" ? "MPIN" : "password"}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleBrokerLogin();
                  }}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowLoginModal(false);
                    setPassword("");
                    setError(null);
                  }}
                  className="btn btn-ghost"
                  disabled={loggingIn}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBrokerLogin}
                  disabled={loggingIn || !password}
                  className="btn btn-primary"
                >
                  {loggingIn ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" />Logging in...</>
                  ) : (
                    "Login"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Broker Multi-Step Modal ── */}
      {showAddBrokerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-base-100 rounded-xl shadow-xl w-full max-w-md">

            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-base-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg">Connect Broker</h3>
                {addBrokerStep !== "result" && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddBrokerModal(false);
                      resetAddBrokerModal();
                      fetchActiveProfile();
                    }}
                    className="btn btn-ghost btn-sm btn-circle text-base-content/60 hover:text-base-content"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Step indicator */}
              <div className="flex items-center gap-2">
                {stepOrder.map((step, idx) => {
                  const currentIdx = stepOrder.indexOf(addBrokerStep);
                  const isCompleted = idx < currentIdx;
                  const isCurrent = idx === currentIdx;
                  return (
                    <div key={step} className="flex items-center gap-2 flex-1 last:flex-none">
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
                          {stepLabels[step]}
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
            {addBrokerStep === "credentials" && (
              <div className="p-6">
                <form onSubmit={handleSaveCredentials} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-base-content/80 mb-1.5">
                      Broker
                    </label>
                    <select
                      value={brokerName}
                      onChange={(e) => setBrokerName(e.target.value)}
                      className="select select-bordered select-sm w-full h-9 text-sm bg-base-100"
                    >
                      <option value="">Select broker</option>
                      <option value="ZERODHA">Zerodha</option>
                      <option value="SHOONYA">Shoonya</option>
                      <option value="KOTAKNEO">Kotak Neo</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <label className="text-xs font-medium text-base-content/80">
                        Broker User ID
                      </label>
                      {brokerName && (
                        <button
                          type="button"
                          onClick={() => {
                            setHelpField("broker_user_id");
                            setHelpModalOpen(true);
                          }}
                          className="text-primary hover:opacity-80 p-0.5 cursor-pointer"
                        >
                          <HelpCircle className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={brokerUserId}
                      onChange={(e) => setBrokerUserId(e.target.value)}
                      className="input input-bordered input-sm w-full h-9 text-sm bg-base-100"
                      placeholder="Broker user ID"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <label className="text-xs font-medium text-base-content/80">API Key</label>
                      {brokerName && (
                        <button
                          type="button"
                          onClick={() => {
                            setHelpField("api_key");
                            setHelpModalOpen(true);
                          }}
                          className="text-primary hover:opacity-80 p-0.5 cursor-pointer"
                        >
                          <HelpCircle className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="input input-bordered input-sm w-full h-9 text-sm bg-base-100"
                      placeholder="API key"
                    />
                  </div>

                  {brokerName === "ZERODHA" && (
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <label className="text-xs font-medium text-base-content/80">Secret Key</label>
                        <button
                          type="button"
                          onClick={() => {
                            setHelpField("secret_key");
                            setHelpModalOpen(true);
                          }}
                          className="text-primary hover:opacity-80 p-0.5 cursor-pointer"
                        >
                          <HelpCircle className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={secretKey}
                        onChange={(e) => setSecretKey(e.target.value)}
                        className="input input-bordered input-sm w-full h-9 text-sm bg-base-100"
                        placeholder="Secret key"
                      />
                    </div>
                  )}

                  {brokerName && (
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <label className="text-xs font-medium text-base-content/80">
                          TOTP Secret
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setHelpField("broker_twofa");
                            setHelpModalOpen(true);
                          }}
                          className="text-primary hover:opacity-80 p-0.5 cursor-pointer"
                        >
                          <HelpCircle className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={brokerTwofa}
                        onChange={(e) => setBrokerTwofa(e.target.value)}
                        className="input input-bordered input-sm w-full h-9 text-sm bg-base-100"
                        placeholder="TOTP secret"
                      />
                    </div>
                  )}

                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={submittingCredentials}
                      className="btn btn-primary btn-sm w-full h-9 text-sm font-medium normal-case"
                    >
                      {submittingCredentials ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Save & Continue"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ── Step 2: Login to Broker ── */}
            {addBrokerStep === "login" && (
              <div className="p-6 space-y-4">
                <p className="text-sm text-base-content/70">
                  Credentials saved. Now log in to your{" "}
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
                    onChange={(e) => setBrokerPassword(e.target.value)}
                    className="input input-bordered input-sm w-full h-9 text-sm bg-base-100"
                    placeholder={`Enter ${savedBrokerName === "KOTAKNEO" ? "MPIN" : "password"}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleLoginNewBroker();
                    }}
                  />
                </div>

                <button
                  onClick={handleLoginNewBroker}
                  disabled={loggingInBroker || !brokerPassword}
                  className="btn btn-primary btn-sm w-full h-9 text-sm normal-case"
                >
                  {loggingInBroker ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" />Logging in...</>
                  ) : (
                    `Login to ${savedBrokerName}`
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setAddBrokerStep("credentials")}
                  className="btn btn-ghost btn-sm w-full text-sm normal-case text-base-content/60"
                >
                  ← Back to credentials
                </button>
              </div>
            )}

            {/* ── Step 3: Result ── */}
            {addBrokerStep === "result" && (
              <div className="p-6 text-center space-y-4">
                {resultStatus === "success" ? (
                  <>
                    <div className="flex justify-center">
                      <div className="rounded-full bg-success/10 p-4">
                        <CheckCircle className="w-10 h-10 text-success" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-base-content">
                        Profile Added Successfully!
                      </h4>
                      <p className="text-sm text-base-content/60 mt-1">
                        Your broker account is connected and margin has been fetched.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowAddBrokerModal(false);
                        resetAddBrokerModal();
                      }}
                      className="btn btn-primary btn-sm normal-case w-full"
                    >
                      Done
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
                      <h4 className="text-lg font-semibold text-base-content">
                        Something Went Wrong
                      </h4>
                      <p className="text-sm text-base-content/60 mt-1">
                        {resultError ||
                          "We couldn't complete the broker setup. Please try again or contact support."}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setResultStatus(null);
                          setResultError(null);
                          setAddBrokerStep("login");
                        }}
                        className="btn btn-outline btn-sm flex-1 normal-case"
                      >
                        Try Again
                      </button>
                      <a
                        href="mailto:support@hedgium.in"
                        className="btn btn-primary btn-sm flex-1 normal-case"
                      >
                        Contact Us
                      </a>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Help Modal ── */}
      <BrokerCredentialHelpModal
        open={helpModalOpen}
        onClose={() => {
          setHelpModalOpen(false);
          setHelpField(null);
        }}
        brokerKey={brokerName}
        field={helpField}
      />
    </>
  );
}
