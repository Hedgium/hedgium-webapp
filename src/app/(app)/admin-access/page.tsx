"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, RefreshCw, ShieldAlert } from "lucide-react";
import useAlert from "@/hooks/useAlert";
import { useAuthStore } from "@/store/authStore";
import { authFetch } from "@/utils/api";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function AdminAccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const alert = useAlert();
  const user = useAuthStore((s) => s.user);

  const checkedIp = (searchParams.get("checked_ip") || "").trim();
  const [ip, setIp] = useState(checkedIp);
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [hasSent, setHasSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = useCallback(() => {
    setCooldown(RESEND_COOLDOWN);
    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    cooldownTimerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, []);

  const sendOtp = useCallback(async () => {
    if (sending) return;
    if (!user?.is_staff) {
      setError("Only staff accounts can enroll an admin IP.");
      return;
    }
    setSending(true);
    setError("");
    try {
      const res = await authFetch("users/auth/admin-ip/request-otp/", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (data as { detail?: string }).detail || "Failed to send code."
        );
      }
      const payload = data as {
        ip?: string;
        already_allowed?: boolean;
        otp?: string;
        message?: string;
      };
      if (payload.ip) setIp(payload.ip);
      if (payload.already_allowed) {
        alert.success("This IP is already allowlisted.");
        router.replace("/admin");
        return;
      }
      setHasSent(true);
      if (payload.otp) {
        // Local/dev convenience — same pattern as login 2FA.
        const digits = payload.otp.replace(/\D/g, "").slice(0, OTP_LENGTH).split("");
        setOtp([
          ...digits,
          ...Array(Math.max(0, OTP_LENGTH - digits.length)).fill(""),
        ]);
      }
      alert.success("Code sent. Check your email.", { duration: 3000 });
      startCooldown();
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send code.");
    } finally {
      setSending(false);
    }
  }, [alert, router, sending, startCooldown, user?.is_staff]);

  const verifyOtp = useCallback(async () => {
    const code = otp.join("");
    if (code.length !== OTP_LENGTH || confirming) return;
    setConfirming(true);
    setError("");
    try {
      const res = await authFetch("users/auth/admin-ip/verify-otp/", {
        method: "POST",
        body: JSON.stringify({ otp: code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { detail?: string }).detail || "Invalid OTP");
      }
      alert.success("IP allowlisted for 24 hours.");
      router.replace("/admin");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed.");
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setConfirming(false);
    }
  }, [alert, confirming, otp, router]);

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setOtp(next);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter" && otp.join("").length === OTP_LENGTH) {
      void verifyOtp();
    }
  };

  if (user && !user.is_staff) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="card bg-base-100 border border-base-300 max-w-md w-full shadow-xl">
          <div className="card-body items-center text-center">
            <ShieldAlert className="size-10 text-error" />
            <h1 className="card-title">Admin only</h1>
            <p className="text-base-content/70 text-sm">
              IP enrollment is available to staff accounts only.
            </p>
            <button
              type="button"
              className="btn btn-primary mt-2"
              onClick={() => router.push("/home")}
            >
              Go home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="card bg-base-100 border border-base-300 max-w-lg w-full shadow-xl">
        <div className="card-body gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-warning/10 p-3">
              <ShieldAlert className="size-7 text-warning" aria-hidden />
            </div>
            <div>
              <h1 className="text-xl font-bold">Admin IP not allowlisted</h1>
              <p className="text-sm text-base-content/70 mt-1">
                Your current IP is blocked from webapp admin. Verify an email OTP
                to allow this IP for 24 hours. Permanent entries are managed on
                the Security page.
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-base-200 px-3 py-2">
            <p className="text-xs text-base-content/60">Detected IP</p>
            <p className="font-mono text-sm font-semibold">
              {ip || "Resolving after you send a code…"}
            </p>
            {user?.email ? (
              <p className="text-xs text-base-content/60 mt-1">
                Code will be sent to {user.email}
              </p>
            ) : null}
          </div>

          {error ? (
            <p className="text-sm text-error" role="alert">
              {error}
            </p>
          ) : null}

          {!hasSent ? (
            <button
              type="button"
              className="btn btn-primary gap-2"
              disabled={sending}
              onClick={() => void sendOtp()}
            >
              {sending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Send email OTP
            </button>
          ) : (
            <>
              <div className="flex justify-center gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    className="input input-bordered w-11 h-12 text-center text-lg font-semibold"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    aria-label={`Digit ${index + 1}`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-2 justify-between items-center">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm gap-2"
                  disabled={sending || cooldown > 0}
                  onClick={() => void sendOtp()}
                >
                  {sending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="size-4" />
                  )}
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={confirming || otp.join("").length !== OTP_LENGTH}
                  onClick={() => void verifyOtp()}
                >
                  {confirming ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  Allow IP for 24h
                </button>
              </div>
            </>
          )}

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => router.push("/home")}
          >
            Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
