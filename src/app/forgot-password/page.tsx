"use client";

import React, { useState } from "react";
import Link from "next/link";
import AuthFlowBrand from "@/components/AuthFlowBrand";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import { myFetch } from "@/utils/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [message, setMessage] = useState<"idle" | "success" | "error">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setMessage("idle");

    if (!email) {
      setEmailError("Email is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Enter a valid email address");
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
    <div className="w-full max-w-[400px]">
      <AuthFlowBrand />
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold tracking-tight text-base-content">
          Forgot <span className="text-primary">password</span>?
        </h1>
        <p className="mt-1 text-sm text-base-content/60">
          Enter your email and we&apos;ll send a reset link
        </p>
      </div>

      <div className="rounded-xl border border-base-300 bg-base-100 p-6 shadow-sm">
          {message === "success" ? (
            <div className="space-y-4">
              <p className="text-sm text-success text-center">
                If an account exists for that email, we&apos;ve sent a reset link. Check your inbox and spam folder.
              </p>
              <Link
                href="/login"
                className="btn btn-primary btn-sm w-full h-9 text-sm font-medium normal-case gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-base-content/80 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/60 pointer-events-none z-10" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className={`input input-bordered input-sm w-full h-9 pl-9 text-sm bg-base-100 ${
                      emailError ? "input-error" : ""
                    }`}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError("");
                    }}
                    placeholder="you@example.com"
                    disabled={isSubmitting}
                  />
                </div>
                {emailError && <p className="mt-1 text-xs text-error">{emailError}</p>}
              </div>

              {message === "error" && (
                <p className="text-xs text-error text-center">Something went wrong. Please try again.</p>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-sm w-full h-9 text-sm font-medium normal-case"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
              </button>
            </form>
          )}

        <p className="mt-4 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-xs text-base-content/50 hover:text-primary"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
