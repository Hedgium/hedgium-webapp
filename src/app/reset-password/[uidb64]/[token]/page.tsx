"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";
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
      setNewPasswordError("New password is required");
      valid = false;
    } else if (newPassword.length < 8) {
      setNewPasswordError("Password must be at least 8 characters");
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
        setSubmitError(data.message || "Invalid or expired link. Please request a new reset.");
      }
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen hero-pattern flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <h2 className="text-center text-3xl font-bold text-base-content">
            Password <span className="text-primary">reset</span>
          </h2>
          <div className="card bg-base-100 border border-base-300 card-hover">
            <div className="card-body space-y-4">
              <p className="text-success font-medium text-center">
                Your password has been reset successfully. You can now log in with your new password.
              </p>
              <Link href="/login" className="btn btn-primary w-full gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-pattern flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <h2 className="text-center text-3xl font-bold text-base-content">
          Set new <span className="text-primary">password</span>
        </h2>
        <p className="text-center text-base-content/70 text-sm">
          Enter your new password below.
        </p>

        <div className="card bg-base-100 border border-base-300 card-hover">
          <div className="card-body space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium mb-1">
                  New password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="newPassword"
                    type="password"
                    className={`input input-bordered w-full pl-10 ${
                      newPasswordError ? "input-error" : ""
                    }`}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setNewPasswordError("");
                    }}
                    placeholder="Enter new password"
                    disabled={isSubmitting}
                    autoComplete="new-password"
                    minLength={8}
                  />
                </div>
                {newPasswordError && (
                  <p className="mt-2 text-sm text-error">{newPasswordError}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                  Confirm password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    type="password"
                    className={`input input-bordered w-full pl-10 ${
                      confirmError ? "input-error" : ""
                    }`}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setConfirmError("");
                    }}
                    placeholder="Confirm new password"
                    disabled={isSubmitting}
                    autoComplete="new-password"
                    minLength={8}
                  />
                </div>
                {confirmError && (
                  <p className="mt-2 text-sm text-error">{confirmError}</p>
                )}
              </div>

              {submitError && (
                <p className="text-sm text-error text-center">{submitError}</p>
              )}

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Resetting…" : "Reset password"}
              </button>
            </form>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
