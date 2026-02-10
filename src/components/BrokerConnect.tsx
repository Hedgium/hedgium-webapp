"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/utils/api";
import { useAuthStore } from "@/store/authStore";
import { RotateCw } from "lucide-react";
import useAlert from "@/hooks/useAlert";

interface BrokerState {
  loading: boolean;
  loggedIn: boolean;
  name: string | null;
  userId?: string | null;
  margin?: number | null;
  profileId?: number | null;
}

export default function BrokerLoginStatus() {
  const alert = useAlert();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [broker, setBroker] = useState<BrokerState>({
    loading: true,
    loggedIn: false,
    name: null,
    userId: null,
    margin: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  /** 🔍 Fetch active profile + margin info */
  const fetchActiveProfile = async () => {
    if (!user) return;

    setBroker((b) => ({ ...b, loading: true }));
    setError(null);

    try {
      const res = await authFetch("profiles/check-profile/");
      const data = await res.json();
      console.log(data);

      setBroker({
        loading: false,
        loggedIn: data.logged_in || false,
        name: data.broker_name || "Unknown Broker",
        userId: data.broker_user_id || "N/A",
        margin: data.margin_equity ?? null,
        profileId: data.id || null,
      });
    } catch (err) {
      console.error("Broker check failed:", err);
      setBroker({ 
        loading: false, 
        loggedIn: false, 
        name: null,
      });
    }
  };

  /** ♻️ Refresh only margin */
  const refreshMargin = async () => {
    if (!user) return;
    // Allow refresh even if not logged in (might have just logged in)
    setRefreshing(true);
    setError(null);

    try {
      const res = await authFetch("profiles/refresh-margin/");
      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || "Failed to fetch margin");
      alert.success("Margins updated from your broker");
      // Refresh profile to get latest margin and logged_in status
      await fetchActiveProfile();
    } catch (err) {
      console.error("Margin refresh failed:", err);
      setError("Failed to refresh margin.");
      // Still refresh profile to get updated status
      await fetchActiveProfile();
    } finally {
      setRefreshing(false);
    }
  };

  /** 🪄 Handle Broker Login */
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
      // Determine API endpoint and payload based on broker name
      const brokerEndpoints: Record<string, string> = {
        SHOONYA: "users/shoonya-login/",
        ZERODHA: "users/zerodha-login/",
        KOTAKNEO: "users/kotakneo-login/",
      };

      const endpoint = brokerEndpoints[broker.name];
      if (!endpoint) {
        throw new Error(`Login not supported for ${broker.name}`);
      }

      const payload: any = {
        profile_id: String(broker.profileId),
      };

      // KOTAKNEO uses "mpin", others use "pwd"
      if (broker.name === "KOTAKNEO") {
        payload.mpin = password;
      } else {
        payload.pwd = password;
      }

      const res = await authFetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.status === "success") {
        alert.success(`${broker.name} login successful`);
        setShowLoginModal(false);
        setPassword("");
        // Refresh profile to get updated logged_in status
        await fetchActiveProfile();
        // Wait a bit for profile to update, then refresh margin
        setTimeout(async () => {
          await refreshMargin();
        }, 500);
      } else {
        throw new Error(data.message || "Login failed");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
      alert.error(err?.message || "Login failed");
    } finally {
      setLoggingIn(false);
    }
  };

  /** 🪄 Handle Zerodha Login (redirect flow) */
  const handleZerodhaLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await authFetch(
        `/users/kite-login/?domain=${encodeURIComponent(window.location.origin)}`
      );
      const data = await res.json();

      if (!res.ok || !data.login_url) throw new Error("Failed to get login URL.");
      window.location.href = data.login_url;
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveProfile();
  }, [user]);

  return (
    <>
      <div className="p-4 md:px-8 border-b border-b-base-300">
        <div className="flex justify-between items-center">
          {broker.loading ? (
            <p className="text-sm opacity-70 animate-pulse">
              Checking broker status...
            </p>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span>Broker:</span>
                {broker?.loggedIn ? (
                  <span className="font-medium">{broker?.name}</span>
                ) : (
                  <>
                    <span className="text-error font-medium">Not logged in</span>
                    {broker?.name && (
                      <button
                        onClick={() => {
                          if (broker.name === "ZERODHA") {
                            handleZerodhaLogin();
                          } else {
                            setShowLoginModal(true);
                          }
                        }}
                        disabled={loading || loggingIn}
                        className="btn btn-primary btn-sm"
                      >
                        {loading ? "Redirecting..." : "Login"}
                      </button>
                    )}
                  </>
                )}
              </div>

              {broker.margin != null && broker.loggedIn && (
                <p className="flex items-center gap-2">
                  <span className="font-medium">Margin:</span>₹{" "}
                  {broker.margin.toLocaleString()}
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

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-base-100 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="font-bold text-lg mb-4">
              Login to {broker.name}
            </h3>
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
                    if (e.key === "Enter") {
                      handleBrokerLogin();
                    }
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
                  {loggingIn ? "Logging in..." : "Login"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}