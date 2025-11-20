"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function WebLoginClient({ loginUrl, token }) {
  const router = useRouter();
  const { accessToken, loginWithToken } = useAuthStore();

  useEffect(() => {
    const handleLoginAndRedirect = async () => {
      if (!loginUrl) return;

      // If already logged in → redirect
      if (accessToken) {
        window.location.href = loginUrl;
        return;
      }

      // If login token is present → attempt login
      if (token) {
        try {
          await loginWithToken(token);
          window.location.href = loginUrl;
        } catch (err) {
          console.error("Login failed:", err);
          router.push("/login");
        }
      }
    };

    handleLoginAndRedirect();
  }, [accessToken, token, loginUrl, loginWithToken, router]);

  return (
    <div className="p-6 text-center">
      <h1 className="text-xl font-semibold mb-2">Redirecting...</h1>
      <p>Please wait while we authenticate and continue.</p>

      <div className="mt-6 opacity-60 text-sm">
        <p>loginUrl: {loginUrl}</p>
        <p>token: {token}</p>
        <p>accessToken: {accessToken}</p>
      </div>
    </div>
  );
}
