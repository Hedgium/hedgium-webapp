"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import useAlert from "@/hooks/useAlert";
import { useAuthStore } from "@/store/authStore";
import {
  sendProfileActionOtp,
  type ProfileActionOtpPurpose,
} from "@/services/profileActions";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

type ActionOtpModalProps = {
  open: boolean;
  purpose: ProfileActionOtpPurpose;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: (otp: string) => Promise<void>;
  onClose: () => void;
};

export default function ActionOtpModal({
  open,
  purpose,
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
}: ActionOtpModalProps) {
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
      await sendProfileActionOtp(purpose);
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
  }, [alert, mobile, purpose, sending, startCooldown]);

  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setOtp(Array(OTP_LENGTH).fill(""));
    setError("");
    setHasSent(false);
    setConfirming(false);
    const t = setTimeout(() => {
      void sendOtp();
    }, 50);
    return () => clearTimeout(t);
    // Intentionally send once when the modal opens for this purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, purpose]);

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
      setOtp(digits.split(""));
      setError("");
      inputRefs.current[OTP_LENGTH - 1]?.focus();
    }
  };

  const handleConfirm = async () => {
    const code = otp.join("");
    if (code.length !== OTP_LENGTH) {
      setError("Enter the complete 6-digit code.");
      return;
    }
    setConfirming(true);
    setError("");
    try {
      await onConfirm(code);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed.";
      setError(msg);
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setConfirming(false);
    }
  };

  const errorId = "action-otp-error";

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-label={title}
      onClose={onClose}
      onCancel={onClose}
    >
      <div className="modal-box max-h-[85vh] overflow-y-auto w-11/12 max-w-md">
        <h2 className="text-lg font-semibold text-base-content tracking-tight">{title}</h2>
        <p className="text-sm text-base-content/70 mt-1">{description}</p>
        <p className="text-sm text-base-content/70 mt-3">
          {hasSent ? (
            mobile ? (
              <>
                We sent a 6-digit code to{" "}
                <span className="font-medium text-base-content">{email}</span> and{" "}
                <span className="font-medium text-base-content">+91 {mobile}</span> on WhatsApp.
              </>
            ) : (
              <>
                We sent a 6-digit code to{" "}
                <span className="font-medium text-base-content">{email}</span>.
              </>
            )
          ) : (
            "Sending a verification code…"
          )}
        </p>

        <fieldset className="mt-4">
          <legend className="sr-only">6-digit verification code</legend>
          <div
            className="flex gap-2 justify-center"
            onPaste={handlePaste}
            role="group"
            aria-describedby={error ? errorId : undefined}
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
                aria-label={`Verification code digit ${i + 1} of ${OTP_LENGTH}`}
                aria-invalid={!!error}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`input input-bordered input-sm w-10 h-10 text-center text-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100 ${
                  error ? "input-error" : digit ? "input-primary" : ""
                }`}
              />
            ))}
          </div>
        </fieldset>

        {error ? (
          <p id={errorId} role="alert" className="text-xs text-error text-center mt-2">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          className="btn btn-primary btn-sm w-full h-9 text-sm font-medium normal-case mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          onClick={() => void handleConfirm()}
          disabled={confirming || otp.join("").length < OTP_LENGTH}
          aria-busy={confirming}
        >
          {confirming ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Verifying…</span>
            </>
          ) : (
            confirmLabel
          )}
        </button>

        <div className="text-xs text-base-content/70 text-center mt-4">
          {cooldown > 0 ? (
            <span>Resend in {cooldown}s</span>
          ) : (
            <button
              type="button"
              className="text-primary cursor-pointer font-medium hover:underline inline-flex items-center gap-1 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
              onClick={() => void sendOtp()}
              disabled={sending}
            >
              <RefreshCw className={`w-3 h-3 ${sending ? "animate-spin" : ""}`} aria-hidden="true" />
              {sending ? "Sending…" : hasSent ? "Resend code" : "Send code"}
            </button>
          )}
        </div>

        <div className="modal-action pt-2">
          <button
            type="button"
            className="btn btn-ghost btn-sm normal-case focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button aria-label="Close">close</button>
      </form>
    </dialog>
  );
}
