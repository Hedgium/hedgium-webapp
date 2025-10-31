
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function Page() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const login_url = decodeURIComponent(searchParams.get("login_url") || "");
  const token = searchParams.get("token") || "";

  const { accessToken, loginWithToken } = useAuthStore();

  useEffect(() => {
    const handleLoginAndRedirect = async () => {
      if (accessToken) {
        console.log(accessToken)
        // ✅ Already logged in — go directly to the login_url
        // window.location.href = login_url;
      } else if (token) {
        try {
          // ✅ Perform async login
          await loginWithToken(token);
          // ✅ After successful login, redirect to login_url
          window.location.href = login_url;
        } catch (err) {
          console.error("Login failed:", err);
          // Redirect to your login page or show an error
          router.push("/login");
        }
      }
    };

    handleLoginAndRedirect();
  }, [accessToken, token, login_url, loginWithToken, router]);

  return (
    <div className="p-6 text-center">
        {login_url}
        <p>{token}</p>
       <p className="text-red-400">{accessToken}</p> 

      <h1 className="text-xl font-semibold mb-2">Redirecting...</h1>
      <p>Please wait while we log you in and continue to Zerodha.</p>
    </div>
  );
}

