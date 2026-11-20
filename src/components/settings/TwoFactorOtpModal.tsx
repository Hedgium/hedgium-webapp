"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import useAlert from "@/hooks/useAlert";
import { useAuthStore } from "@/store/authStore";
import { sendTwoFactorSettingsOtp } from "@/services/twoFactor";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

type TwoFactorOtpModalProps = {
  open: boolean;
  nextEnabled: boolean;
  onConfirm: (otp: string) => Promise<void>;
  onClose: () => void;
};

export default function TwoFactorOtpModal({
  open,
  nextEnabled,
  onConfirm,
  onClose,
}: TwoFactorOtpModalProps) {
  const user = useAuthStore((state) => state.user);
  const alert = useAlert();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [hasSent, setHasSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");

  const email = user?.email;
  const mobile = user?.mobile?.replace(/\D/g, "").slice(-10) || null;

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

  const sendOtp = useCallback(async () => {
    if (sending) return;
    setSending(true);
    setError("");
    try {
      await sendTwoFactorSettingsOtp();
      setHasSent(true);
      alert.success(
        mobile
          ? "Code sent. Check your email and WhatsApp."
          : "Code sent. Check your inbox.",
        { duration: 3000 }
      );
      startCooldown();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send code.";
      setError(msg);
    } finally {
      setSending(false);
    }
  }, [alert, mobile, sending, startCooldown]);

  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  useEffect(() => {
    if (!open) {
      setOtp(Array(OTP_LENGTH).fill(""));
      setError("");
      setHasSent(false);
      setCooldown(0);
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
      return;
    }
    void sendOtp();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- send once when opened
  }, [open]);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value.slice(-1);
    setOtp(updated);
    setError("");
    if (value && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (digits.length === OTP_LENGTH) {
      e.preventDefault();
      setOtp(digits.split(""));
      setError("");
      inputRefs.current[OTP_LENGTH - 1]?.focus();
    }
  };

  const handleConfirm = async () => {
    const code = otp.join("");
    if (code.length !== OTP_LENGTH) {
      setError("Enter the 6-digit code");
      return;
    }
    setConfirming(true);
    setError("");
    try {
      await onConfirm(code);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-label="Confirm two-factor change"
      onClose={onClose}
      onCancel={onClose}
    >
      <div className="modal-box max-w-md">
        <h3 className="font-semibold text-lg">
          {nextEnabled ? "Enable two-factor authentication" : "Disable two-factor authentication"}
        </h3>
        <p className="text-sm text-base-content/70 mt-1">
          Enter the verification code sent to {email || "your email"}
          {mobile ? " and WhatsApp" : ""} to confirm.
        </p>
        <div
          className="flex justify-center gap-2 mt-4"
          onPaste={handlePaste}
          role="group"
          aria-label="6-digit verification code"
        >
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              maxLength={1}
              className={`input input-bordered input-sm h-11 w-10 text-center text-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                error ? "input-error" : digit ? "input-primary" : ""
              }`}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={!hasSent || confirming}
              aria-label={`Verification code digit ${i + 1} of ${OTP_LENGTH}`}
            />
          ))}
        </div>
        {error ? (
          <p role="alert" className="text-xs text-error mt-2 text-center">
            {error}
          </p>
        ) : null}
        <div className="modal-action flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-ghost btn-sm normal-case"
            onClick={onClose}
            disabled={confirming}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm normal-case"
            onClick={() => void sendOtp()}
            disabled={sending || cooldown > 0 || confirming}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {cooldown > 0 ? `Resend (${cooldown}s)` : "Resend"}
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm normal-case"
            onClick={() => void handleConfirm()}
            disabled={confirming || !hasSent}
          >
            {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Confirm
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button aria-label="Close">close</button>
      </form>
    </dialog>
  );
}
