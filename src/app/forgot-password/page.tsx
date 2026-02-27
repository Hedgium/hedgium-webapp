"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { myFetch } from "@/utils/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [message, setMessage] = useState<"idle" | "success" | "error">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setMessage("idle");

    if (!email) {
      setEmailError("Email is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await myFetch("users/password-reset/request/", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage("success");
      } else {
        setMessage("error");
      }
    } catch {
      setMessage("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen hero-pattern flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <h2 className="text-center text-3xl font-bold text-base-content">
          Forgot <span className="text-primary">password</span>?
        </h2>
        <p className="text-center text-base-content/70 text-sm">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>

        <div className="card bg-base-100 border border-base-300 card-hover">
          <div className="card-body space-y-4">
            {message === "success" ? (
              <div className="space-y-4">
                <p className="text-success font-medium text-center">
                  If an account exists for that email, we&apos;ve sent a reset link. Check your inbox and spam folder.
                </p>
                <Link href="/login" className="btn btn-primary w-full gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1">
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="z-10 h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      className={`input input-bordered w-full pl-10 ${
                        emailError ? "input-error" : ""
                      }`}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailError("");
                      }}
                      placeholder="Enter your email"
                      disabled={isSubmitting}
                      autoComplete="email"
                    />
                  </div>
                  {emailError && (
                    <p className="mt-2 text-sm text-error">{emailError}</p>
                  )}
                </div>

                {message === "error" && (
                  <p className="text-sm text-error text-center">
                    Something went wrong. Please try again.
                  </p>
                )}

                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending…" : "Send reset link"}
                </button>
              </form>
            )}

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
