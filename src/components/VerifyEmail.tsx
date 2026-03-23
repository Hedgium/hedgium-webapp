"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Mail, RefreshCw, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { authFetch } from "@/utils/api";
import useAlert from "@/hooks/useAlert";

const RESEND_COOLDOWN = 60;
const OTP_LENGTH = 6;
// Don't auto-send again after first time in this session (reload/return = user must click)
const OTP_AUTOSEND_STORAGE_KEY = "hedgium_otp_autosend";

export interface VerifyEmailProps {
  /** Email to verify. Default: current user email from auth store */
  email?: string | null;
  /** Path to navigate after successful verification. Default: /onboarding/complete-profile */
  successPath?: string;
  /** Path to navigate when user skips. Default: /onboarding/complete-profile */
  skipPath?: string;
  /** Send OTP automatically on mount. Default: true */
  autoSendOnMount?: boolean;
  /** Show "Skip for now" button. Default: true */
  showSkip?: boolean;
  /** Optional wrapper class name */
  className?: string;
  /** Optional callback when verification succeeds (before navigation) */
  onVerified?: () => void;
  /** Optional callback when user skips (before navigation) */
  onSkip?: () => void;
}

/**
 * Reusable email verification UI: OTP input, verify button, resend, and optional skip.
 * Uses auth store for user email and updateUser; navigates on success or skip.
 * Can be used on the standalone verify-email page or embedded in onboarding.
 */
export default function VerifyEmail({
  email: emailProp,
  successPath = "/onboarding/complete-profile",
  skipPath = "/onboarding/complete-profile",
  autoSendOnMount = true,
  showSkip = true,
  className,
  onVerified,
  onSkip,
}: VerifyEmailProps) {
  const { user, updateUser } = useAuthStore();
  const router = useRouter();
  const alert = useAlert();
  const email = emailProp ?? user?.email;

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");
  const [hasSent, setHasSent] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSendTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startCooldown = useCallback(() => {
    setCooldown(RESEND_COOLDOWN);
    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    cooldownTimerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownTimerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const sendOtp = useCallback(async () => {
    if (!email || sending) return;
    setSending(true);
    setError("");
    try {
      const res = await authFetch("users/send-otp/", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setHasSent(true);
        try {
          sessionStorage.setItem(
            `${OTP_AUTOSEND_STORAGE_KEY}:${email}`,
            Date.now().toString()
          );
        } catch {
          // ignore
        }
        alert.success("Code sent. Check your inbox.", { duration: 3000 });
        startCooldown();
      } else {
        const data = await res.json().catch(() => ({}));
        const msg =
          res.status === 429
            ? "Too many attempts. Please wait a minute before requesting another code."
            : data.error || "Failed to send code.";
        setError(msg);
        if (res.status === 429) startCooldown(); // show resend cooldown
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }, [email, sending, alert, startCooldown]);

  // Clean up cooldown interval only on unmount (so "Resend in Xs" countdown is not killed when sendOtp ref changes)
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!autoSendOnMount || !email) return;
    try {
      if (sessionStorage.getItem(`${OTP_AUTOSEND_STORAGE_KEY}:${email}`)) return;
    } catch {
      // ignore
    }
    autoSendTimeoutRef.current = setTimeout(() => {
      sendOtp();
      autoSendTimeoutRef.current = null;
    }, 100);
    return () => {
      if (autoSendTimeoutRef.current) clearTimeout(autoSendTimeoutRef.current);
    };
  }, [autoSendOnMount, email, sendOtp]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value.slice(-1);
    setOtp(updated);
    setError("");
    if (value && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (digits.length === OTP_LENGTH) {
      setOtp(digits.split(""));
      setError("");
      inputRefs.current[OTP_LENGTH - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== OTP_LENGTH) {
      setError("Enter the complete 6-digit code.");
      return;
    }
    setVerifying(true);
    setError("");
    try {
      const res = await authFetch("users/verify-otp/", {
        method: "POST",
        body: JSON.stringify({ email, otp: code }),
      });
      const data = await res.json();
      if (res.ok) {
        const updateRes = await authFetch("users/me/", {
          method: "PUT",
          body: JSON.stringify({
            signup_step: "email_verified",
            email_verified: true,
          }),
        });
        if (!updateRes.ok) {
          const updateErr = await updateRes.json().catch(() => ({}));
          setError(updateErr?.detail || "Email verified, but failed to update profile state.");
          return;
        }
        alert.success("Email verified.", { duration: 3000 });
        updateUser({ signup_step: "email_verified", email_verified: true });
        onVerified?.();
        if (successPath) {
          setRedirecting(true);
          router.push(successPath);
          return;
        }
      } else {
        setError(data.error || "Invalid code. Try again.");
        setOtp(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleSkip = () => {
    updateUser({ signup_step: "email_verified", email_verified: true });
    onSkip?.();
    if (skipPath) router.push(skipPath);
  };

  return (
    <div className={className}>
      <div className="flex justify-center mb-4">
        <div className="rounded-full bg-primary/10 p-3">
          <Mail className="w-8 h-8 text-primary" />
        </div>
      </div>
      <h2 className="text-xl font-semibold text-base-content text-center tracking-tight">
        Verify your email
      </h2>
      <p className="text-sm text-base-content/60 text-center mt-1">
        {hasSent
          ? <>We sent a 6-digit code to <span className="font-medium text-base-content">{email}</span></>
          : <>We&apos;ll send a 6-digit code to <span className="font-medium text-base-content">{email}</span></>}
      </p>

      <div className="flex gap-2 justify-center mt-4" onPaste={handlePaste}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={`input input-bordered input-sm w-10 h-10 text-center text-lg font-semibold ${
              error ? "input-error" : digit ? "input-primary" : ""
            }`}
          />
        ))}
      </div>

      {error && <p className="text-xs text-error text-center mt-2">{error}</p>}

      <button
        type="button"
        className="btn btn-primary btn-sm w-full h-9 text-sm font-medium normal-case mt-4"
        onClick={handleVerify}
        disabled={verifying || redirecting || otp.join("").length < OTP_LENGTH}
      >
        {redirecting ? "Redirecting..." : verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify email"}
      </button>

      <div className="text-xs text-base-content/60 text-center mt-4">
        {hasSent ? (
          <>
            Didn&apos;t get the code?{" "}
            {cooldown > 0 ? (
              <span className="text-base-content/40">Resend in {cooldown}s</span>
            ) : (
              <button
                type="button"
                className="text-primary font-medium hover:underline inline-flex items-center gap-1 disabled:opacity-40"
                onClick={sendOtp}
                disabled={sending}
              >
                <RefreshCw className={`w-3 h-3 ${sending ? "animate-spin" : ""}`} />
                {sending ? "Sending…" : "Resend code"}
              </button>
            )}
          </>
        ) : (
          <button
            type="button"
            className="text-primary font-medium hover:underline inline-flex items-center gap-1 disabled:opacity-40"
            onClick={sendOtp}
            disabled={sending}
          >
            <RefreshCw className={`w-3 h-3 ${sending ? "animate-spin" : ""}`} />
            {sending ? "Sending…" : "Send code"}
          </button>
        )}
      </div>

      {showSkip && (
        <button
          type="button"
          className="btn btn-ghost btn-sm w-full text-base-content/50 hover:text-base-content/70 text-xs mt-2"
          onClick={handleSkip}
        >
          Skip for now
        </button>
      )}
    </div>
  );
}
