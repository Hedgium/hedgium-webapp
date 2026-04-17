"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowLeft, Loader2 } from "lucide-react";
import { myFetch } from "@/utils/api";

export default function ResetPasswordPage() {
  const params = useParams();
  const uidb64 = params.uidb64 as string;
  const token = params.token as string;

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewPasswordError("");
    setConfirmError("");
    setSubmitError("");

    let valid = true;
    if (!newPassword) {
      setNewPasswordError("Password is required");
      valid = false;
    } else if (newPassword.length < 8) {
      setNewPasswordError("At least 8 characters");
      valid = false;
    }
    if (newPassword !== confirmPassword) {
      setConfirmError("Passwords do not match");
      valid = false;
    }
    if (!valid) return;

    setIsSubmitting(true);
    try {
      const res = await myFetch("users/password-reset/confirm/", {
        method: "POST",
        body: JSON.stringify({
          uidb64,
          token,
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
      } else {
        setSubmitError(data.message || "Invalid or expired link. Request a new reset.");
      }
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200 px-4 py-8">
        <div className="w-full max-w-[380px]">
          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold text-base-content tracking-tight">
              Password <span className="text-primary">reset</span>
            </h1>
          </div>
          <div className="bg-base-100 rounded-xl border border-base-300 shadow-sm p-6">
            <p className="text-sm text-success text-center mb-4">
              Your password has been reset. You can now log in with your new password.
            </p>
            <Link
              href="/"
              className="btn btn-primary btn-sm w-full h-9 text-sm font-medium normal-case gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 px-4 py-8">
      <div className="w-full max-w-[380px]">
        <div className="text-center mb-6">
          <h1 className="text-xl font-semibold text-base-content tracking-tight">
            Set new <span className="text-primary">password</span>
          </h1>
          <p className="text-sm text-base-content/60 mt-1">
            Enter your new password below
          </p>
        </div>

        <div className="bg-base-100 rounded-xl border border-base-300 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-xs font-medium text-base-content/80 mb-1.5">
                New password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/60 pointer-events-none z-10" />
                <input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  className={`input input-bordered input-sm w-full h-9 pl-9 text-sm bg-base-100 ${
                    newPasswordError ? "input-error" : ""
                  }`}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setNewPasswordError("");
                  }}
                  placeholder="••••••••"
                  disabled={isSubmitting}
                />
              </div>
              {newPasswordError && <p className="mt-1 text-xs text-error">{newPasswordError}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-medium text-base-content/80 mb-1.5">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/60 pointer-events-none z-10" />
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  className={`input input-bordered input-sm w-full h-9 pl-9 text-sm bg-base-100 ${
                    confirmError ? "input-error" : ""
                  }`}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setConfirmError("");
                  }}
                  placeholder="••••••••"
                  disabled={isSubmitting}
                />
              </div>
              {confirmError && <p className="mt-1 text-xs text-error">{confirmError}</p>}
            </div>

            {submitError && <p className="text-xs text-error text-center">{submitError}</p>}

            <button
              type="submit"
              className="btn btn-primary btn-sm w-full h-9 text-sm font-medium normal-case"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reset password"}
            </button>
          </form>

          <p className="text-center mt-4">
            <Link
              href="/"
              className="text-xs text-base-content/50 hover:text-primary inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
