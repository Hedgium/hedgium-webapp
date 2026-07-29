"use client";

import React, { useState, useEffect } from "react";
import { User, Mail, Lock, Loader2, Phone, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import AuthFlowBrand from "@/components/AuthFlowBrand";
import { myFetch, authFetch } from "@/utils/api";
import { useAuthStore } from "@/store/authStore";
import useAlert from "@/hooks/useAlert";

type SignupStepProps = {
  onComplete: () => void;
};

export default function SignupStep({ onComplete }: SignupStepProps) {
  const alert = useAlert();
  const { login, updateUser, accessToken, user, fetchUser } = useAuthStore();

  const isEditingExisting =
    Boolean(accessToken && user && user.signup_step === "initiated");

  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [first_nameError, setFirstNameError] = useState("");
  const [last_nameError, setLastNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [error, setError] = useState("");

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  useEffect(() => {
    if (!isEditingExisting || !user) return;
    setFirstName(user.first_name ?? "");
    setLastName(user.last_name ?? "");
    setEmail(user.email ?? "");
    setMobile((user.mobile ?? "").replace(/\D/g, "").slice(0, 10));
  }, [isEditingExisting, user]);

  async function handleRegister(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError("");
    setFirstNameError("");
    setLastNameError("");
    setEmailError("");
    setMobileError("");
    setPasswordError("");
    setConfirmPasswordError("");
    let valid = true;

    if (!first_name) {
      setFirstNameError("First name is required");
      valid = false;
    }
    if (!last_name) {
      setLastNameError("Last name is required");
      valid = false;
    }
    if (!email) {
      setEmailError("Email is required");
      valid = false;
    } else if (!validateEmail(email)) {
      setEmailError("Enter a valid email address");
      valid = false;
    }
    if (!mobile) {
      setMobileError("Mobile number is required");
      valid = false;
    } else if (!/^\d{10}$/.test(mobile.trim())) {
      setMobileError("Enter a valid 10-digit mobile number");
      valid = false;
    }
    if (!isEditingExisting) {
      if (!password) {
        setPasswordError("Password is required");
        valid = false;
      } else if (password.length < 6) {
        setPasswordError("At least 6 characters");
        valid = false;
      }
      if (!confirmPassword) {
        setConfirmPasswordError("Confirm your password");
        valid = false;
      } else if (confirmPassword !== password) {
        setConfirmPasswordError("Passwords do not match");
        valid = false;
      }
    }
    if (!valid) return;

    if (isEditingExisting) {
      setRegistering(true);
      try {
        const res = await authFetch("users/me/", {
          method: "PUT",
          body: JSON.stringify({
            first_name,
            last_name,
            email,
            mobile: mobile.trim(),
            username: email,
          }),
        });
        if (res.ok) {
          const updated = await res.json();
          updateUser({
            first_name: updated.first_name,
            last_name: updated.last_name,
            email: updated.email,
            mobile: updated.mobile,
            username: updated.username,
          });
          await fetchUser();
          alert.success("Details updated. Continue to verify your email.", {
            duration: 3000,
          });
          onComplete();
          return;
        }
        const errorRes = await res.json().catch(() => ({}));
        setError(
          errorRes?.detail ||
            (typeof errorRes === "object" && errorRes !== null
              ? JSON.stringify(errorRes)
              : "Update failed")
        );
      } catch (err) {
        console.error(err);
        alert.error("Something went wrong", { duration: 5000 });
      } finally {
        setRegistering(false);
      }
      return;
    }

    setRegistering(true);
    try {
      const res = await myFetch("users", {
        method: "POST",
        body: JSON.stringify({
          first_name,
          last_name,
          email,
          mobile: mobile.trim(),
          username: email,
          password,
        }),
      });
      if (res.ok) {
        alert.success("Account created. Please verify your email.", { duration: 3000 });
        await login(email, password);
        updateUser({ signup_step: "initiated" });
        onComplete();
        return;
      }
      const errorRes = await res.json();
      setError(errorRes?.detail || "Something went wrong");
    } catch (err) {
      console.error(err);
      alert.error("Something went wrong", { duration: 5000 });
    } finally {
      setRegistering(false);
    }
  }

  return (
    <div className="w-full max-w-[400px]">
      <AuthFlowBrand />
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold tracking-tight text-base-content">
          {isEditingExisting ? (
            <>
              Update your <span className="text-primary">details</span>
            </>
          ) : (
            <>
              Sign up for <span className="text-primary">Hedgium</span>
            </>
          )}
        </h1>
        <p className="mt-1 text-sm text-base-content/70">
          {isEditingExisting
            ? "Change your details if needed, then continue to email verification."
            : "Create your account to get started"}
        </p>
      </div>

      <div className="rounded-xl border border-base-300 bg-base-100 p-6">
        <form onSubmit={handleRegister} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-xs font-medium text-base-content/80 mb-1.5">First name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/60 pointer-events-none z-10" aria-hidden="true" />
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  autoComplete="given-name"
                  required
                  aria-required="true"
                  aria-invalid={!!first_nameError}
                  aria-describedby={first_nameError ? "first_name-error" : undefined}
                  className={`input input-bordered input-sm w-full h-9 pl-9 text-sm bg-base-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100 ${first_nameError ? "input-error" : ""}`}
                  value={first_name}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First"
                />
              </div>
              {first_nameError && <p id="first_name-error" role="alert" className="mt-1 text-xs text-error">{first_nameError}</p>}
            </div>
            <div>
              <label htmlFor="last_name" className="block text-xs font-medium text-base-content/80 mb-1.5">Last name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/60 pointer-events-none z-10" aria-hidden="true" />
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  autoComplete="family-name"
                  required
                  aria-required="true"
                  aria-invalid={!!last_nameError}
                  aria-describedby={last_nameError ? "last_name-error" : undefined}
                  className={`input input-bordered input-sm w-full h-9 pl-9 text-sm bg-base-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100 ${last_nameError ? "input-error" : ""}`}
                  value={last_name}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last"
                />
              </div>
              {last_nameError && <p id="last_name-error" role="alert" className="mt-1 text-xs text-error">{last_nameError}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-medium text-base-content/80 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/60 pointer-events-none z-10" aria-hidden="true" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                aria-required="true"
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "email-error" : undefined}
                className={`input input-bordered input-sm w-full h-9 pl-9 text-sm bg-base-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100 ${emailError ? "input-error" : ""}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            {emailError && <p id="email-error" role="alert" className="mt-1 text-xs text-error">{emailError}</p>}
          </div>

          <div>
            <label htmlFor="mobile" className="block text-xs font-medium text-base-content/80 mb-1.5">Mobile</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/60 pointer-events-none z-10" aria-hidden="true" />
              <input
                id="mobile"
                name="mobile"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                required
                aria-required="true"
                aria-invalid={!!mobileError}
                aria-describedby={mobileError ? "mobile-error" : undefined}
                className={`input input-bordered input-sm w-full h-9 pl-9 text-sm bg-base-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100 ${mobileError ? "input-error" : ""}`}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10-digit mobile number"
              />
            </div>
            {mobileError && <p id="mobile-error" role="alert" className="mt-1 text-xs text-error">{mobileError}</p>}
          </div>

          {!isEditingExisting && (
            <>
              <div>
                <label htmlFor="password" className="block text-xs font-medium text-base-content/80 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/60 pointer-events-none z-10" aria-hidden="true" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    aria-required="true"
                    aria-invalid={!!passwordError}
                    aria-describedby={passwordError ? "password-error" : undefined}
                    className={`input input-bordered input-sm w-full h-9 pl-9 pr-9 text-sm bg-base-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100 ${passwordError ? "input-error" : ""}`}
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
                {passwordError && <p id="password-error" role="alert" className="mt-1 text-xs text-error">{passwordError}</p>}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-medium text-base-content/80 mb-1.5">Confirm password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/60 pointer-events-none z-10" aria-hidden="true" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    aria-required="true"
                    aria-invalid={!!confirmPasswordError}
                    aria-describedby={confirmPasswordError ? "confirmPassword-error" : undefined}
                    className={`input input-bordered input-sm w-full h-9 pl-9 pr-9 text-sm bg-base-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100 ${confirmPasswordError ? "input-error" : ""}`}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 z-10 flex items-center pr-3 text-base-content/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {confirmPasswordError && <p id="confirmPassword-error" role="alert" className="mt-1 text-xs text-error">{confirmPasswordError}</p>}
              </div>
            </>
          )}

          {error && <p role="alert" className="text-xs text-error text-center py-1">{error}</p>}

          <button
            type="submit"
            className="btn btn-primary btn-sm w-full h-9 text-sm font-medium normal-case focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100 disabled:cursor-not-allowed disabled:opacity-90 disabled:!bg-primary disabled:!text-primary-content"
            disabled={registering}
            aria-busy={registering}
          >
            {registering ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                <span>{isEditingExisting ? "Saving…" : "Creating account…"}</span>
              </>
            ) : isEditingExisting ? (
              "Save & continue to verification"
            ) : (
              "Create account"
            )}
          </button>
        </form>
      </div>

      {!isEditingExisting && (
        <p className="mt-5 text-center text-xs text-base-content/70">
          Already have an account?{" "}
          <Link href="/" className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">
            Log in
          </Link>
        </p>
      )}
    </div>
  );
}
