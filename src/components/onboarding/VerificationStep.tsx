"use client";

import React, { useState, useEffect } from "react";
import { Clock, FileUp } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "nextjs-toploader/app";
import { authFetch } from "@/utils/api";
import useAlert from "@/hooks/useAlert";

type VerificationStepProps = {
  onUploadDocuments: () => void;
};

export default function VerificationStep({ onUploadDocuments }: VerificationStepProps) {
  const { user, updateUser } = useAuthStore();
  const router = useRouter();
  const alert = useAlert();
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

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
      setRedirecting(true);
      alert.success("Verified. Redirecting to home.");
      router.push("/home");
    }
  }, [user, alert, router]);

  return (
    <div className="mt-6 w-full max-w-[400px]">
      <div className="rounded-xl border border-base-300 bg-base-100 p-6 text-center" role="status" aria-live="polite" aria-busy={redirecting}>
        {redirecting ? (
          <p className="text-sm font-medium text-base-content/80">Redirecting to home...</p>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-warning/10 p-3">
                <Clock className="w-8 h-8 text-warning" aria-hidden="true" />
              </div>
            </div>
            <h1 className="text-xl font-semibold text-base-content tracking-tight">
              Verification pending
            </h1>
            <p className="text-sm text-base-content/70 mt-2">
              Your profile is under review. We&apos;ll notify you once verification is complete. Please make sure to upload your documents in case you have not done it yet. You can skip this step for now and continue to home.
            </p>
            <div className="flex flex-col mt-4 flex-wrap gap-2 justify-center">
              <button
                type="button"
                disabled={submitting}
                onClick={onUploadDocuments}
                className="btn btn-primary btn-sm text-sm normal-case focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100 disabled:cursor-not-allowed disabled:opacity-90 disabled:!bg-primary disabled:!text-primary-content"
              >
                <FileUp className="w-4 h-4 shrink-0" aria-hidden="true" />
                Upload or update documents
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSkip}
                aria-busy={submitting}
                className="btn btn-outline btn-sm text-sm normal-case focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100"
              >
                {submitting ? "Skipping…" : "Skip verification"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
