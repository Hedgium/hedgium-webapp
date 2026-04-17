"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { CheckCircle2, Loader2, AlertCircle, X } from "lucide-react";

type InitState = "checking-login" | "login-status" | "redirecting" | "error";

interface AuthInitializingProviderProps {
  children: ReactNode;
  requireAuth?: boolean;
  /** On `/` login: show session check until init finishes so the form does not flash first. */
  deferLoginFormUntilAuthReady?: boolean;
}

export default function AuthInitializingProvider({ 
  children, 
  requireAuth = true,
  deferLoginFormUntilAuthReady = false,
}: AuthInitializingProviderProps) {
  const { accessToken, isInitializing, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [initState, setInitState] = useState<InitState>("checking-login");
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [showChildren, setShowChildren] = useState(false);
  const [loginDeferTimedOut, setLoginDeferTimedOut] = useState(false);

  useEffect(() => {
    // Reset timeout flag when initialization starts
    if (isInitializing) {
      setHasTimedOut(false);
      setInitState("checking-login");
    }
  }, [isInitializing]);

  // Entering a protected route: clear any stale gate state from a prior public route
  useEffect(() => {
    if (!requireAuth) return;
    setHasTimedOut(false);
    setInitState("checking-login");
    setShowChildren(false);
  }, [requireAuth]);

  useEffect(() => {
    setLoginDeferTimedOut(false);
  }, [pathname, deferLoginFormUntilAuthReady]);

  // If session init hangs, still allow the login form (degraded UX beats infinite spinner)
  useEffect(() => {
    if (!deferLoginFormUntilAuthReady || !isInitializing) return;
    const t = setTimeout(() => setLoginDeferTimedOut(true), 12000);
    return () => clearTimeout(t);
  }, [deferLoginFormUntilAuthReady, isInitializing]);

  useEffect(() => {
    // Determine current state based on auth store values
    if (isInitializing) {
      setInitState("checking-login");
      setShowChildren(false);
    } else if (!isInitializing && accessToken) {
      // Login check complete, token exists
      if (initState === "checking-login") {
        // Transition from checking to login-status
        setInitState("login-status");
      }
    } else if (!isInitializing && !accessToken && initState !== "error") {
      if (!requireAuth) {
        return;
      }
      // No token after initialization - show error and redirect
      // setInitState("error");
      setShowChildren(false);
      setTimeout(() => {
        router.replace(`/?next=${encodeURIComponent(pathname)}`);
      }, 1500);
    }
  }, [isInitializing, accessToken, router, pathname, requireAuth, initState]);

  // Handle transition from login-status to redirecting
  useEffect(() => {
    if (initState === "login-status" && accessToken && !isInitializing) {
      // After showing login status (1s), move to redirecting
      const redirectTimer = setTimeout(() => {
        setInitState("redirecting");
      }, 1000);
      return () => clearTimeout(redirectTimer);
    }
  }, [initState, accessToken, isInitializing]);

  // Handle transition from redirecting to showing children
  useEffect(() => {
    if (initState === "redirecting" && accessToken && !isInitializing) {
      // After showing redirecting (0.8s), render children
      const childrenTimer = setTimeout(() => {
        setShowChildren(true);
      }, 800);
      return () => clearTimeout(childrenTimer);
    }
  }, [initState, accessToken, isInitializing]);

  // Timeout handling - if initialization takes too long, redirect to login
  useEffect(() => {
    if (!requireAuth) return;

    const timeout = setTimeout(() => {
      if (isInitializing) {
        setHasTimedOut(true);
        setTimeout(() => {
          router.replace(`/?next=${encodeURIComponent(pathname)}`);
        }, 1500);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [isInitializing, router, pathname, requireAuth]);

  // Handle redirect when not logged in (for protected routes)
  useEffect(() => {
    if (requireAuth && !isInitializing && !accessToken) {
      router.replace(`/?next=${encodeURIComponent(pathname)}`);
    }
  }, [requireAuth, isInitializing, accessToken, router, pathname]);

  const states = [
    {
      key: "checking-login",
      label: "Login Check Start",
      icon: Loader2,
      completed: !isInitializing,
    },
    {
      key: "login-status",
      label: accessToken ? "Already Logged" : "Not Logged In",
      icon: accessToken ? CheckCircle2 : X,
      completed: !isInitializing,
      isError: !accessToken,
    },
    {
      key: "redirecting",
      label: "Redirecting",
      icon: Loader2,
      completed: false,
    },
  ];

  const currentStateIndex = states.findIndex((s) => s.key === initState);
  const currentState = states[currentStateIndex] || states[0];

  // Only block on actual session bootstrap — not on `accessToken` alone, or we never leave
  // this screen when RootLayoutClient does not redirect (and logged-in users would spin forever).
  const showLoginSessionCheck =
    deferLoginFormUntilAuthReady &&
    !loginDeferTimedOut &&
    isInitializing;

  // Public routes (except `/` login): never block on the auth gate
  if (!requireAuth && !deferLoginFormUntilAuthReady) {
    return <>{children}</>;
  }

  // Login at `/`: session check first, then form (same loading UI as protected routes below)
  if (!requireAuth && deferLoginFormUntilAuthReady && !showLoginSessionCheck) {
    return <>{children}</>;
  }

  const protectedLoading =
    isInitializing ||
    initState === "login-status" ||
    (initState === "redirecting" && !showChildren);
  const showLoading =
    (requireAuth && protectedLoading) ||
    (!requireAuth && deferLoginFormUntilAuthReady && showLoginSessionCheck);

  const loadingTitle =
    !requireAuth && deferLoginFormUntilAuthReady ? "Checking session" : "Initializing";
  const loadingSubtitle =
    !requireAuth && deferLoginFormUntilAuthReady
      ? "One moment while we verify your account…"
      : "Please wait while we set things up";

  if (requireAuth && (hasTimedOut || initState === "error")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200 px-4 py-8">
        <div className="w-full max-w-[400px]">
          <div className="bg-base-100 rounded-xl border border-base-300 p-6 text-center space-y-4">
            <div className="flex justify-center">
              <AlertCircle className="w-12 h-12 text-error" />
            </div>
            <h2 className="text-xl font-semibold text-base-content tracking-tight">
              Authentication timeout
            </h2>
            <p className="text-sm text-base-content/60">
              Taking too long to authenticate. Redirecting to login...
            </p>
            <div className="flex justify-center">
              <Loader2 className="w-6 h-6 text-error animate-spin" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200 px-4 py-8">
        <div className="w-full max-w-[400px]">
          <div className="bg-base-100 rounded-xl border border-base-300 p-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-base-content tracking-tight">
                {loadingTitle}
              </h2>
              <p className="text-sm text-base-content/60 mt-1">{loadingSubtitle}</p>
            </div>

            {/* State Steps */}
            <div className="space-y-3">
              {states.map((state, index) => {
                const isActive = state.key === initState;
                const isCompleted = state.completed && index < currentStateIndex;
                const showLoader = isActive && (state.key === "checking-login" || state.key === "redirecting");
                const showError = isActive && state.isError;
                const showSuccess = (isActive && !state.isError && state.key === "login-status") || isCompleted;

                return (
                  <div
                    key={state.key}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      isActive
                        ? showError
                          ? "bg-error/5 border-error"
                          : "bg-primary/5 border-primary"
                        : isCompleted
                        ? "bg-success/5 border-success"
                        : "bg-base-200/50 border-base-300"
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {showSuccess ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : showError ? (
                        <X className="w-5 h-5 text-error" />
                      ) : showLoader ? (
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-base-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          isActive
                            ? showError
                              ? "text-error"
                              : "text-primary"
                            : isCompleted
                            ? "text-success"
                            : "text-base-content/60"
                        }`}
                      >
                        {state.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Progress indicator */}
            <div className="mt-4 pt-4 border-t border-base-300">
              <div className="w-full bg-base-200 rounded-full h-1.5">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${((currentStateIndex + 1) / states.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Ready - render children
  if (showChildren && accessToken) {
    return <>{children}</>;
  }

  // Still showing loading UI
  return null;
}

