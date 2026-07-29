"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
import { Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
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
        <h1 id="login-heading" className="text-xl font-semibold tracking-tight text-base-content">
          Log in to <span className="text-primary">Hedgium</span>
        </h1>
        <p className="mt-1 text-sm text-base-content/70">
          Enter your credentials to continue
        </p>
      </div>

      <section
        aria-labelledby="login-heading"
        className="rounded-xl border border-base-300 bg-base-100 p-6"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
          className="space-y-4"
          noValidate
        >
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-base-content/80">
              Email
            </label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-base-content/70"
                aria-hidden
              />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                aria-required="true"
                aria-invalid={emailError ? true : undefined}
                aria-describedby={emailError ? "email-error" : undefined}
                className={`input input-bordered input-sm h-9 w-full bg-base-100 pl-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100 ${emailError ? "input-error" : "border-base-content/50"}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            {emailError ? (
              <p id="email-error" role="alert" className="mt-1 text-xs text-error">
                {emailError}
              </p>
            ) : null}
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label htmlFor="password" className="block text-xs font-medium text-base-content/80">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="rounded-sm text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-base-content/70"
                aria-hidden
              />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                aria-required="true"
                aria-invalid={passwordError ? true : undefined}
                aria-describedby={passwordError ? "password-error" : undefined}
                className={`input input-bordered input-sm h-9 w-full bg-base-100 pl-9 pr-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100 ${passwordError ? "input-error" : "border-base-content/50"}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 z-10 flex items-center pr-3 text-base-content/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
            {passwordError ? (
              <p id="password-error" role="alert" className="mt-1 text-xs text-error">
                {passwordError}
              </p>
            ) : null}
          </div>

          {loginError ? (
            <p id="login-error" role="alert" className="py-1 text-center text-xs text-error">
              {loginError}
            </p>
          ) : null}

          <button
            type="submit"
            className="btn btn-primary btn-sm h-11 min-h-11 w-full text-sm font-medium normal-case focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100 disabled:cursor-not-allowed disabled:opacity-90 disabled:!bg-primary disabled:!text-primary-content"
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                <span>Logging in…</span>
              </>
            ) : (
              "Log in"
            )}
          </button>
        </form>
      </section>

      <p className="mt-5 text-center text-xs text-base-content/70">
        Don&apos;t have an account?{" "}
        <Link
          href="/onboarding"
          className="rounded-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-200"
        >
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
        <div
          role="status"
          aria-live="polite"
          className="flex min-h-[200px] items-center justify-center text-sm text-base-content/70"
        >
          Loading…
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
