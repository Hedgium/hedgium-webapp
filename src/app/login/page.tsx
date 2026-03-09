"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
import { Mail, Lock, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";

function getSafeNext(next: string | null): string | null {
  if (!next || typeof next !== "string") return null;
  const path = next.startsWith("/") ? next : `/${next}`;
  if (path.includes("//")) return null;
  return path;
}

const LoginContent: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loginError, setLoginError] = useState("");

  const { login, accessToken, isLoading, isInitializing } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = getSafeNext(searchParams.get("next"));

  useEffect(() => {
    fetch("/api/session", { method: "GET", credentials: "include" }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!isInitializing && accessToken) {
      router.push(nextPath || "/hedgium/dashboard");
    }
  }, [accessToken, isInitializing, router, nextPath]);

  const handleLogin = async (e?: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    setLoginError("");
    let valid = true;
    if (!email) {
      setEmailError("Email is required");
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Enter a valid email address");
      valid = false;
    } else setEmailError("");
    if (!password) {
      setPasswordError("Password is required");
      valid = false;
    } else setPasswordError("");
    if (valid) {
      try {
        await login(email, password);
      } catch (err: unknown) {
        setLoginError((err as { detail?: string })?.detail || "Something went wrong");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 px-4 py-8">
      <div className="w-full max-w-[380px]">
        <div className="text-center mb-6">
          <h1 className="text-xl font-semibold text-base-content tracking-tight">
            Log in to <span className="text-primary">Hedgium</span>
          </h1>
          <p className="text-sm text-base-content/60 mt-1">Enter your credentials to continue</p>
        </div>

        <div className="bg-base-100 rounded-xl border border-base-300 shadow-sm p-6">
          {accessToken ? (
            <div className="py-4 text-center">
              <p className="text-sm font-medium text-success">Login successful. Redirecting…</p>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-base-content/80 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/60 pointer-events-none z-10" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className={`input input-bordered input-sm w-full h-9 pl-9 text-sm bg-base-100 ${emailError ? "input-error" : ""}`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                {emailError && <p className="mt-1 text-xs text-error">{emailError}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-xs font-medium text-base-content/80">Password</label>
                  <Link href="/forgot-password" className="text-xs text-primary hover:underline">Forgot?</Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/60 pointer-events-none z-10" />
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    className={`input input-bordered input-sm w-full h-9 pl-9 text-sm bg-base-100 ${passwordError ? "input-error" : ""}`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin(e)}
                    placeholder="••••••••"
                  />
                </div>
                {passwordError && <p className="mt-1 text-xs text-error">{passwordError}</p>}
              </div>

              {loginError && <p className="text-xs text-error text-center py-1">{loginError}</p>}

              <button
                type="submit"
                className="btn btn-primary btn-sm w-full h-9 text-sm font-medium normal-case"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log in"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-base-content/50 mt-4">
          Don&apos;t have an account?{" "}
          <Link href="/onboarding" className="text-primary font-medium hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

const Login: React.FC = () => (
  <Suspense>
    <LoginContent />
  </Suspense>
);

export default Login;