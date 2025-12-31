"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { CheckCircle2, Loader2, AlertCircle, X } from "lucide-react";

type InitState = "checking-login" | "login-status" | "redirecting" | "error";

interface AuthInitializingProviderProps {
  children: ReactNode;
  requireAuth?: boolean;
}

export default function AuthInitializingProvider({ 
  children, 
  requireAuth = true 
}: AuthInitializingProviderProps) {
  const { accessToken, isInitializing, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [initState, setInitState] = useState<InitState>("checking-login");
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [showChildren, setShowChildren] = useState(false);

  useEffect(() => {
    // Reset timeout flag when initialization starts
    if (isInitializing) {
      setHasTimedOut(false);
      setInitState("checking-login");
    }
  }, [isInitializing]);

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
      // No token after initialization - show error and redirect
      setInitState("error");
      setShowChildren(false);
      // Redirect to login after showing error briefly, preserving the intended destination
      if (requireAuth) {
        setTimeout(() => {
          router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        }, 1500);
      }
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
    const timeout = setTimeout(() => {
      if (isInitializing) {
        setHasTimedOut(true);
        // Redirect to login after a short delay to show error state, preserving the intended destination
        if (requireAuth) {
          setTimeout(() => {
            router.replace(`/login?next=${encodeURIComponent(pathname)}`);
          }, 1500);
        }
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [isInitializing, router, pathname, requireAuth]);

  // Handle redirect when not logged in (for protected routes)
  useEffect(() => {
    if (requireAuth && !isInitializing && !accessToken) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
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

  // If not requiring auth and no token, just render children
  if (!requireAuth && !isInitializing && !accessToken) {
    return <>{children}</>;
  }

  // Show loading UI if initializing, showing login status, or redirecting (but not ready to show children)
  const showLoading = isInitializing || initState === "login-status" || (initState === "redirecting" && !showChildren);

  if (hasTimedOut || initState === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <div className="text-center space-y-4 max-w-md mx-auto px-4">
          <div className="flex justify-center">
            <AlertCircle className="w-16 h-16 text-error" />
          </div>
          <h2 className="text-2xl font-semibold text-base-content">
            Authentication Timeout
          </h2>
          <p className="text-base-content/70">
            Taking too long to authenticate. Redirecting to login...
          </p>
          <div className="flex justify-center">
            <span className="loading loading-spinner loading-md text-error"></span>
          </div>
        </div>
      </div>
    );
  }

  // Show loading UI
  if (showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <div className="w-full max-w-md mx-auto px-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold text-base-content">
                Initializing
              </h2>
              <p className="text-sm text-base-content/70">
                Please wait while we set things up
              </p>
            </div>

            {/* State Steps */}
            <div className="space-y-4">
              {states.map((state, index) => {
                const Icon = state.icon;
                const isActive = state.key === initState;
                const isCompleted = state.completed && index < currentStateIndex;
                const showLoader = isActive && (state.key === "checking-login" || state.key === "redirecting");
                const showError = isActive && state.isError;
                const showSuccess = (isActive && !state.isError && state.key === "login-status") || isCompleted;

                return (
                  <div
                    key={state.key}
                    className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                      isActive
                        ? showError
                          ? "bg-error/10 border-2 border-error"
                          : "bg-primary/10 border-2 border-primary"
                        : isCompleted
                        ? "bg-success/10 border-2 border-success"
                        : "bg-base-200 border-2 border-transparent"
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {showSuccess ? (
                        <CheckCircle2 className="w-6 h-6 text-success" />
                      ) : showError ? (
                        <X className="w-6 h-6 text-error" />
                      ) : showLoader ? (
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-base-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p
                        className={`font-medium ${
                          isActive
                            ? showError
                              ? "text-error"
                              : "text-primary"
                            : isCompleted
                            ? "text-success"
                            : "text-base-content/50"
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
            <div className="pt-4">
              <div className="w-full bg-base-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      ((currentStateIndex + 1) / states.length) * 100
                    }%`,
                  }}
                ></div>
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

