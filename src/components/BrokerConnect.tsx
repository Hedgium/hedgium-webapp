"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "nextjs-toploader/app";
import { authFetch } from "@/utils/api";
import { formatMoneyIN } from "@/utils/formatNumber";
import { useAuthStore } from "@/store/authStore";
import { RotateCw, Plus, AlertCircle, Loader2 } from "lucide-react";
import useAlert from "@/hooks/useAlert";

interface BrokerState {
  loading: boolean;
  hasProfile: boolean;
  verified: boolean;
  loggedIn: boolean;
  name: string | null;
  margin?: number | null;
  profileId?: number | null;
}

export default function BrokerLoginStatus() {
  const router = useRouter();
  const alert = useAlert();
  const { user, brokerNeedsRefresh, setBrokerNeedsRefresh } = useAuthStore();

  const [broker, setBroker] = useState<BrokerState>({
    loading: true,
    hasProfile: false,
    verified: false,
    loggedIn: false,
    name: null,
    margin: null,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Login modal state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const autoMarginFetchedForProfileRef = useRef<number | null>(null);

  const fetchActiveProfile = async () => {
    if (!user) return;
    setBroker((b) => ({ ...b, loading: true }));
    setStatusError(null);

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
        margin: data.margin_equity ?? null,
        profileId: data.id || null,
      });
    } catch (err) {
      console.error("Broker check failed:", err);
      setBroker({ loading: false, hasProfile: false, verified: false, loggedIn: false, name: null });
    }
  };

  const refreshMargin = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!user) return;
    setRefreshing(true);
    setStatusError(null);

    try {
      const res = await authFetch("profiles/refresh-margin/");
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to fetch margin");
      if (!silent) {
        alert.success("Margins updated");
      }
      await fetchActiveProfile();
    } catch (err) {
      setStatusError("Failed to refresh margin.");
      await fetchActiveProfile();
    } finally {
      setRefreshing(false);
    }
  };

  // Watch for broker setup completion (set by the add-broker page)
  useEffect(() => {
    if (brokerNeedsRefresh) {
      setBrokerNeedsRefresh(false);
      fetchActiveProfile();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brokerNeedsRefresh]);

  useEffect(() => {
    fetchActiveProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Auto-refresh margin once when a broker session is logged in (including after login).
  useEffect(() => {
    if (!broker.loggedIn || !broker.profileId) {
      autoMarginFetchedForProfileRef.current = null;
      return;
    }

    if (autoMarginFetchedForProfileRef.current === broker.profileId) return;
    autoMarginFetchedForProfileRef.current = broker.profileId;
    refreshMargin({ silent: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [broker.loggedIn, broker.profileId, user]);

  // ── Login handler (for already-verified broker) ──
  const handleBrokerLogin = async () => {
    setLoginError(null);
    if (!password) { setLoginError("Please enter your password / MPIN"); return; }
    if (!broker.profileId || !broker.name) { setLoginError("Profile information missing"); return; }

    setLoggingIn(true);
    try {
      const endpoints: Record<string, string> = {
        SHOONYA: "users/shoonya-login/",
        ZERODHA: "users/zerodha-login/",
        KOTAKNEO: "users/kotakneo-login/",
      };
      const endpoint = endpoints[broker.name];
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
        setLoginError(null);
        await fetchActiveProfile();
      } else {
        // Surface the exact message from the broker
        setLoginError(data.message || "Login failed. Please check your credentials.");
      }
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <>
      {/* ── Broker Status Bar ── */}
      <div className="p-4 md:px-8 border-b border-b-base-300">
        <div className="flex justify-between items-center">
          {broker.loading ? (
            <p className="text-sm opacity-70 animate-pulse">Checking broker status...</p>

          ) : !broker.hasProfile || !broker.verified ? (
            /* No profile OR setup not completed */
            <div className="flex items-center gap-3">
              <span className="text-sm text-base-content/60">
                {broker.hasProfile ? "Broker setup incomplete" : "No broker connected"}
              </span>
              <button
                onClick={() => {
                  if (broker.hasProfile && broker.profileId && broker.name) {
                    // Skip credentials — pass existing profile to the login step
                    router.push(
                      `/add-broker?profileId=${broker.profileId}&broker=${broker.name}`
                    );
                  } else {
                    router.push("/add-broker");
                  }
                }}
                className="btn btn-primary btn-sm gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                {broker.hasProfile ? "Complete Setup" : "Add Broker"}
              </button>
            </div>

          ) : (
            /* Verified profile */
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
                        onClick={() => { setShowLoginModal(true); setLoginError(null); }}
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
                    onClick={() => refreshMargin()}
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
        {statusError && <p className="text-error text-sm mt-2">{statusError}</p>}
      </div>

      {/* ── Login Modal ── */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-base-100 p-6 rounded-xl shadow-xl max-w-md w-full">
            <h3 className="font-bold text-lg mb-2">Login to {broker.name}</h3>
            <p className="text-sm text-base-content/70 mb-4">
              Your {broker.name === "KOTAKNEO" ? "MPIN" : "password"} is only used to
              sign in with your broker for this session. We do not store it.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {broker.name === "KOTAKNEO" ? "MPIN" : "Password"}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setLoginError(null); }}
                  className={`input input-bordered w-full ${loginError ? "input-error" : ""}`}
                  placeholder={`Enter ${broker.name === "KOTAKNEO" ? "MPIN" : "password"}`}
                  onKeyDown={(e) => { if (e.key === "Enter") handleBrokerLogin(); }}
                  autoFocus
                />
                {loginError && (
                  <div className="flex items-center gap-1.5 text-error text-sm mt-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button
                  onClick={() => { setShowLoginModal(false); setPassword(""); setLoginError(null); }}
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
                  {loggingIn
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Logging in...</>
                    : "Login"
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
