"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/utils/api";
import { useAuthStore } from "@/store/authStore";

export default function BrokerLoginStatus() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [broker, setBroker] = useState<{ loading: boolean; loggedIn: boolean; name: string | null }>({
    loading: true,
    loggedIn: false,
    name: null,
  });
  const [error, setError] = useState<string | null>(null);

  const fetchActiveProfile = async () => {
    if (user?.broker_logged_in) return setBroker({ loading: false, loggedIn: true, name: "ZERODHA" });
    setBroker((b) => ({ ...b, loading: true }));
    try {
      const res = await authFetch("profiles/check-profile/");
      if (!res.ok) throw new Error("No active broker profile found.");
      const data = await res.json();
      setBroker({ loading: false, loggedIn: true, name: data.broker_name || "Unknown Broker" });
    } catch (err) {
      setBroker({ loading: false, loggedIn: false, name: null });
    }
  };

  const handleZerodhaLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`/users/kite-login/?domain=${encodeURIComponent(window.location.origin)}`);
      const data = await res.json();
      if (!res.ok || !data.login_url) throw new Error("Failed to get login URL.");
      window.location.href = data.login_url;
    } catch (err) {
      setError(err?.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  useEffect(() => { fetchActiveProfile(); }, [user]);

  return (
    <div className="p-4 rounded-lg bg-base-200 flex flex-col gap-3">
      <h3 className="font-semibold text-lg">Broker Connection</h3>
      {broker.loading ? (
        <p className="text-sm opacity-70">Checking broker status...</p>
      ) : broker.loggedIn ? (
        <p className="text-sm">
          <span className="font-medium text-success">Connected to:</span> {broker.name}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-sm opacity-80">No broker connected. Please login with Zerodha.</p>
          <button onClick={handleZerodhaLogin} disabled={loading} className="btn btn-primary">
            {loading ? "Redirecting..." : "Login with Kite"}
          </button>
        </div>
      )}
      {error && <p className="text-error text-sm mt-2">{error}</p>}
    </div>
  );
}
