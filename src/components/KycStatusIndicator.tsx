"use client";

import { Info, BadgeCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { authFetch } from "@/utils/api";

const PENDING_TIP =
  "Your profile verification is pending. Complete KYC to unlock full access. Tap to continue.";
const VERIFIED_TIP = "Your profile is verified.";

type Props = {
  className?: string;
  /** Mobile top bar: pill + tooltip opens to the left */
  variant?: "default" | "nav";
};

export default function KycStatusIndicator({ className = "", variant = "default" }: Props) {
  const { user, updateUser } = useAuthStore();
  const router = useRouter();

  if (!user) return null;

  const verified = Boolean(user.verified);
  const isNav = variant === "nav";
  const tipClass = isNav
    ? "tooltip tooltip-left before:max-w-[14rem] before:text-left before:whitespace-normal before:px-3 before:py-2"
    : "tooltip tooltip-bottom lg:tooltip-right before:max-w-[16rem] before:text-left before:whitespace-normal";

  const goKyc = async () => {
    try {
      await authFetch("users/me/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kyc_skipped: false }),
      });
      updateUser({ kyc_skipped: false });
    } catch {
      /* still navigate */
    }
    switch (user.signup_step) {
      case "initiated":
        router.push("/onboarding/complete-profile");
        break;
      case "documents_uploaded":
      case "broker_profile_added":
        router.push("/onboarding/verification");
        break;
      default:
        router.push("/hedgium/dashboard/");
    }
  };

  if (verified) {
    if (isNav) {
      return (
        <div
          className={`${tipClass} ${className}`}
          data-tip={VERIFIED_TIP}
        >
          <span
            className="inline-flex items-center gap-1 rounded-full border border-success/25 bg-success/10 px-2 py-1 text-success shadow-sm"
            aria-label={VERIFIED_TIP}
          >
            <BadgeCheck className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
            <span className="text-[11px] font-semibold leading-none tracking-tight">Verified</span>
          </span>
        </div>
      );
    }
    return (
      <div className={`${tipClass} ${className}`} data-tip={VERIFIED_TIP}>
        <span className="inline-flex text-success" aria-label={VERIFIED_TIP}>
          <BadgeCheck className="h-5 w-5 shrink-0" strokeWidth={2} />
        </span>
      </div>
    );
  }

  if (isNav) {
    return (
      <button
        type="button"
        onClick={goKyc}
        className={`${tipClass} ${className} inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-amber-700 dark:text-amber-400 shadow-sm active:scale-[0.98] transition-transform`}
        data-tip={PENDING_TIP}
        aria-label={PENDING_TIP}
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
          <Info className="h-3 w-3" strokeWidth={2.5} />
        </span>
        <span className="text-[11px] font-semibold leading-none pr-0.5">KYC</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={goKyc}
      className={`${tipClass} btn btn-ghost btn-sm btn-circle text-warning p-0 min-h-0 h-8 w-8 before:max-w-[18rem] ${className}`}
      data-tip={PENDING_TIP}
      aria-label={PENDING_TIP}
    >
      <Info className="h-5 w-5 shrink-0" strokeWidth={2} />
    </button>
  );
}
