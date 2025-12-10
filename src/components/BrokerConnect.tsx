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

  /** 🔍 Fetch active profile + margin info */
  const fetchActiveProfile = async () => {
    if (!user) return;

    setBroker((b) => ({ ...b, loading: true }));
    setError(null);

    try {
      const res = await authFetch("profiles/check-profile/");
      const data = await res.json();

      setBroker({
        loading: false,
        loggedIn: data.logged_in || false,
        name: data.broker_name || "Unknown Broker",
        userId: data.broker_user_id || "N/A",
        margin: data.margin_equity ?? null,
      });
    } catch (err) {
      console.error("Broker check failed:", err);
      setBroker({ loading: false, loggedIn: false, name: null });
    }
  };

  /** ♻️ Refresh only margin */
  const refreshMargin = async () => {
    if (!user || !broker.loggedIn) return;
    setRefreshing(true);
    setError(null);

    try {
      const res = await authFetch("profiles/refresh-margin/");
      const data = await res.json();

      console.log(data);

      if (!res.ok) throw new Error(data.detail || "Failed to fetch margin");
      alert.success("Margins updated from your broker")
      setBroker((b) => ({ ...b, margin: data.margin_equity ?? null }));
    } catch (err) {
      console.error("Margin refresh failed:", err);
      setError("Failed to refresh margin.");
    } finally {
      setRefreshing(false);
    }
  };

  /** 🪄 Handle Zerodha Login */
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
    } catch (err) {
      setError(err?.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveProfile();
  }, [user]);

  return (
    <div className="p-4 md:px-8 border-b border-b-base-300">
      <div className="flex justify-between items-center">
        {broker.loading ? (
          <p className="text-sm opacity-70 animate-pulse">
            Checking broker status...
          </p>
        ) : (
          <>
            <div>
              Broker:{" "}
              {broker?.loggedIn ? (
                <span>{broker?.name}</span>
              ) : (
                <>
                  {broker?.name === "ZERODHA" && (
                    <button
                      onClick={handleZerodhaLogin}
                      disabled={loading}
                      className="btn btn-primary btn-sm w-fit"
                    >
                      {loading ? "Redirecting..." : "Login with Kite"}
                    </button>
                  )}
                </>
              )}
            </div>

            <div>
              {broker.margin != null && (
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
            </div>
          </>
        )}

        {error && <p className="text-error text-sm mt-1">{error}</p>}
      </div>
    </div>
  );
}