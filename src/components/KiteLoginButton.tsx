"use client";
import { useState } from "react";
import { authFetch } from "@/utils/api";

const KiteLoginButton = () => {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      // Send current frontend origin to backend
      const res = await authFetch(`/users/kite-login/?domain=${encodeURIComponent(window.location.origin)}`);
      const data = await res.json();

      if (res.ok && data.login_url) {
        // Redirect user to Kite login
        window.location.href = data.login_url;
      } else {
        console.error("Failed to get login URL:", data);
      }
    } catch (err) {
      console.error("Error fetching Kite login URL:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogin}
      disabled={loading}
      className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? "Redirecting..." : "Login with Kite"}
    </button>
  );
};

export default KiteLoginButton;
