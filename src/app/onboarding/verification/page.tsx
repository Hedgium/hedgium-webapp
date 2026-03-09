"use client";

import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import SignUpStepper from "@/components/SignUpStepper";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "nextjs-toploader/app";
import { authFetch } from "@/utils/api";
import useAlert from "@/hooks/useAlert";

const VerificationPending: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const router = useRouter();
  const alert = useAlert();
  const [submitting, setSubmitting] = useState(false);

  const handleSkip = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await authFetch("users/me/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kyc_skipped: true }),
      });
      updateUser({ kyc_skipped: true });
      alert.success("Verification skipped", { duration: 3000 });
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (user?.signup_step === "verified") {
      alert.success("Verified. Redirecting to dashboard.");
      router.push("/hedgium/dashboard");
    }
  }, [user, alert, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 px-4 py-8">
      <div className="w-full max-w-2xl mb-4">
        <SignUpStepper currentStepId="broker_profile_added" />
      </div>

      <div className="w-full max-w-[380px]">
        <div className="bg-base-100 rounded-xl border border-base-300 shadow-sm p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-warning/10 p-3">
              <Clock className="w-8 h-8 text-warning" />
            </div>
          </div>
          <h1 className="text-xl font-semibold text-base-content tracking-tight">
            Verification pending
          </h1>
          <p className="text-sm text-base-content/60 mt-2">
            Your profile is under review. We&apos;ll notify you once verification is complete.
          </p>
          <button
            type="button"
            disabled={submitting}
            onClick={handleSkip}
            className="btn btn-outline btn-sm h-9 text-sm normal-case mt-4"
          >
            Skip verification
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationPending;
