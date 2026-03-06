"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "nextjs-toploader/app";
import { Mail, RefreshCw } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { authFetch } from "@/utils/api";
import useAlert from "@/hooks/useAlert";
import SignUpStepper from "@/components/SignUpStepper";

const RESEND_COOLDOWN = 60;
const OTP_LENGTH = 6;

export default function VerifyEmail() {
  const { user, updateUser } = useAuthStore();
  const router = useRouter();
  const alert = useAlert();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");

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
    if (!user?.email || sending) return;
    setSending(true);
    setError("");
    try {
      const res = await authFetch("users/send-otp/", {
        method: "POST",
        body: JSON.stringify({ email: user.email }),
      });
      if (res.ok) {
        alert.success("Code sent! Check your inbox.", { duration: 3000 });
        startCooldown();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to send verification code.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }, [user?.email, sending, alert, startCooldown]);

  // Auto-send on mount. Delay + cleanup prevents double send in React Strict Mode (mount→unmount→remount).
  useEffect(() => {
    autoSendTimeoutRef.current = setTimeout(() => {
      sendOtp();
      autoSendTimeoutRef.current = null;
    }, 100);
    return () => {
      if (autoSendTimeoutRef.current) clearTimeout(autoSendTimeoutRef.current);
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value.slice(-1);
    setOtp(updated);
    setError("");
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
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
      setError("Please enter the complete 6-digit code.");
      return;
    }

    setVerifying(true);
    setError("");
    try {
      const res = await authFetch("users/verify-otp/", {
        method: "POST",
        body: JSON.stringify({ email: user?.email, otp: code }),
      });
      const data = await res.json();

      if (res.ok) {
        alert.success("Email verified! Continuing setup.", { duration: 3000 });
        // Refresh user so signup_step reflects email_verified in the store
        // await fetchUser();
        updateUser({ signup_step: "email_verified" });
        router.push("/register/complete-profile");
      } else {
        setError(data.error || "Invalid code. Please try again.");
        setOtp(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen hero-pattern flex flex-col items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl mb-4">
        <SignUpStepper currentStepId="initiated" />
      </div>

      <div className="max-w-md w-full">
        <div className="card bg-base-100 border border-base-300 card-hover">
          <div className="card-body items-center text-center space-y-6">

            {/* Icon */}
            <div className="rounded-full bg-primary/10 p-4">
              <Mail className="w-10 h-10 text-primary" />
            </div>

            {/* Heading */}
            <div>
              <h2 className="text-2xl font-bold text-base-content">
                Verify your email
              </h2>
              <p className="mt-2 text-sm text-base-content/60">
                We sent a 6-digit code to{" "}
                <span className="font-semibold text-base-content">
                  {user?.email}
                </span>
              </p>
            </div>

            {/* OTP Boxes */}
            <div
              className="flex gap-2 justify-center"
              onPaste={handlePaste}
            >
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
                  className={`input input-bordered w-12 h-14 text-center text-xl font-bold transition-all
                    ${error ? "input-error" : digit ? "input-primary" : ""}
                  `}
                />
              ))}
            </div>

            {error && (
              <p className="text-error text-sm -mt-2">{error}</p>
            )}

            {/* Verify Button */}
            <button
              className="btn btn-primary w-full"
              onClick={handleVerify}
              disabled={verifying || otp.join("").length < OTP_LENGTH}
            >
              {verifying ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                "Verify Email"
              )}
            </button>

            {/* Resend */}
            <div className="text-sm text-base-content/60">
              Didn&apos;t receive the code?{" "}
              {cooldown > 0 ? (
                <span className="text-base-content/40">
                  Resend in {cooldown}s
                </span>
              ) : (
                <button
                  className="text-primary font-medium hover:underline inline-flex items-center gap-1 disabled:opacity-40"
                  onClick={sendOtp}
                  disabled={sending}
                >
                  <RefreshCw className={`w-3 h-3 ${sending ? "animate-spin" : ""}`} />
                  {sending ? "Sending..." : "Resend code"}
                </button>
              )}
            </div>

            {/* Skip */}
            <button
              className="btn btn-ghost btn-sm text-base-content/40 hover:text-base-content/60 w-full"
              onClick={() => router.push("/register/complete-profile")}
            >
              Skip for now
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}
