"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
import { Mail, Lock, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import AuthFlowBrand from "@/components/AuthFlowBrand";

export function getSafeNext(next: string | null): string | null {
  if (!next || typeof next !== "string") return null;
  const path = next.startsWith("/") ? next : `/${next}`;
  if (path.includes("//")) return null;
  return path;
}

function LoginPageContent() {
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
      router.push(nextPath || "/home");
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
    <div className="w-full max-w-[400px]">
      <AuthFlowBrand />
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold tracking-tight text-base-content">
          Log in to <span className="text-primary">Hedgium</span>
        </h1>
        <p className="mt-1 text-sm text-base-content/60">
          Enter your credentials to continue
        </p>
      </div>

      <div className="rounded-xl border border-base-300 bg-base-100 p-6">
        
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-base-content/80">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-base-content/60" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={`input input-bordered input-sm h-9 w-full bg-base-100 pl-9 text-sm ${emailError ? "input-error" : ""}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              {emailError && <p className="mt-1 text-xs text-error">{emailError}</p>}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-medium text-base-content/80">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-base-content/60" />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className={`input input-bordered input-sm h-9 w-full bg-base-100 pl-9 text-sm ${passwordError ? "input-error" : ""}`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin(e)}
                  placeholder="••••••••"
                />
              </div>
              {passwordError && <p className="mt-1 text-xs text-error">{passwordError}</p>}
            </div>

            {loginError && <p className="py-1 text-center text-xs text-error">{loginError}</p>}

            <button
              type="submit"
              className="btn btn-primary btn-sm h-9 w-full text-sm font-medium normal-case"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log in"}
            </button>
          </form>
      </div>

      <p className="mt-5 text-center text-xs text-base-content/50">
        Don&apos;t have an account?{" "}
        <Link href="/onboarding" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default function LoginPageClient() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[200px] items-center justify-center text-sm text-base-content/60">Loading…</div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
