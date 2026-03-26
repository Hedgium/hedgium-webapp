"use client";

import React, { useState, useEffect } from "react";
import { Clock, FileUp } from "lucide-react";
import SignUpStepper from "@/components/SignUpStepper";
import OnboardingNav from "@/components/OnboardingNav";
import AuthFlowBrand from "@/components/AuthFlowBrand";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "nextjs-toploader/app";
import { authFetch } from "@/utils/api";
import useAlert from "@/hooks/useAlert";

const VerificationPending: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const router = useRouter();
  const alert = useAlert();
  const [submitting, setSubmitting] = useState(false);
  const [uploadRedirecting, setUploadRedirecting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const handleUploadDocuments = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUploadRedirecting(true);
      const res = await authFetch("users/me/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signup_step: "email_verified" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to update");
      }
      updateUser({ signup_step: "email_verified" });
      router.push("/onboarding/complete-profile");
    } catch (e) {
      alert.error(e instanceof Error ? e.message : "Something went wrong", { duration: 3000 });
      setUploadRedirecting(false);
    }
  };

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
      router.push("/hedgium/home");
    }
  }, [user, alert, router]);

  return (
    <div className="flex w-full flex-col items-center">
      <div className="w-full max-w-2xl space-y-4">
        <div className="flex justify-center">
          <AuthFlowBrand className="mb-0" />
        </div>
        <SignUpStepper currentStepId="documents_uploaded" />
      </div>

      <div className="mt-6 w-full max-w-[400px]">
        <div className="rounded-xl border border-base-300 bg-base-100 p-6 text-center">
          {redirecting ? (
            <p className="text-sm font-medium text-base-content/80">Redirecting to home...</p>
          ) : (
            <>
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-warning/10 p-3">
                  <Clock className="w-8 h-8 text-warning" />
                </div>
              </div>
              <h1 className="text-xl font-semibold text-base-content tracking-tight">
                Verification pending
              </h1>
              <p className="text-sm text-base-content/60 mt-2">
                Your profile is under review. We&apos;ll notify you once verification is complete. Please make sure to upload your documents in case you have not done it yet. You can skip this step for now and continue to home.
              </p>
              <div className="flex flex-col mt-4 flex-wrap gap-2 justify-center">
                <button
                  type="button"
                  disabled={uploadRedirecting || submitting}
                  onClick={handleUploadDocuments}
                  className="btn btn-primary btn-sm text-sm normal-case"
                >
                  <FileUp className="w-4 h-4 shrink-0" />
                  {uploadRedirecting ? "..." : "Upload or update documents"}
                </button>
                <button
                  type="button"
                  disabled={submitting || uploadRedirecting}
                  onClick={handleSkip}
                  className="btn btn-outline btn-sm text-sm normal-case"
                >
                  Skip verification
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerificationPending;
