"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "nextjs-toploader/app";
import { authFetch } from "@/utils/api";
import { useAuthStore } from "@/store/authStore";
import useAlert from "@/hooks/useAlert";
import SignUpStepper from "@/components/SignUpStepper";
import AuthFlowBrand from "@/components/AuthFlowBrand";
import { Loader2 } from "lucide-react";

const CompleteProfile: React.FC = () => {
  const router = useRouter();
  const alert = useAlert();
  const { updateUser, user } = useAuthStore();

  useEffect(() => {
    if (user?.signup_step === "email_verified") {
      router.replace("/onboarding/terms");
    }
  }, [user, router]);

  const [panNumber, setPanNumber] = useState("");
  const [aadharNumber, setAadharNumber] = useState("");
  const [panDocument, setPanDocument] = useState<File | null>(null);
  const [aadharDocument, setAadharDocument] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const panClean = panNumber.replace(/\s/g, "").toUpperCase();
    const aadharClean = aadharNumber.replace(/\D/g, "");
    if (panClean.length !== 10 || !/^[A-Z0-9]{10}$/.test(panClean)) {
      alert.error("PAN must be exactly 10 alphanumeric characters", { duration: 3000 });
      return;
    }
    if (aadharClean.length !== 12 || !/^\d{12}$/.test(aadharClean)) {
      alert.error("Aadhaar must be exactly 12 digits", { duration: 3000 });
      return;
    }
    await saveProfile({ skip: false });
  };

  const handleSkip = async () => {
    await saveProfile({ skip: true });
  };

  const saveProfile = async ({ skip }: { skip: boolean }) => {
    try {
      setSubmitting(true);
      const userDetails = !skip
        ? {
            pan_number: panNumber.replace(/\s/g, "").toUpperCase(),
            aadhar_number: aadharNumber.replace(/\D/g, ""),
            signup_step: "documents_uploaded",
          }
        : { kyc_skipped: true };
      updateUser({ kyc_skipped: skip });

      const detailsRes = await authFetch("users/me/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userDetails),
      });

      if (!detailsRes.ok) {
        const errorData = await detailsRes.json();
        throw new Error(errorData.detail || errorData.message || detailsRes.statusText);
      }

      if (!skip) {
        if (panDocument || aadharDocument) {
          const formData = new FormData();
          if (panDocument) formData.append("pan_document", panDocument);
          if (aadharDocument) formData.append("aadhar_document", aadharDocument);
          const documentsRes = await authFetch("users/me/uploads/", { method: "PUT", body: formData });
          if (!documentsRes.ok) {
            const errorData = await documentsRes.json();
            throw new Error(errorData.message || documentsRes.statusText);
          }
        }
        updateUser({ kyc_skipped: skip, signup_step: "documents_uploaded" });
        alert.success("Profile updated", { duration: 3000 });
        setRedirecting(true);
        router.push("/onboarding/verification");
        return;
      }
      alert.success("Skipped KYC", { duration: 3000 });
    } catch (e) {
      console.error("saveProfile:", e);
      alert.error(e instanceof Error ? e.message : "Something went wrong", { duration: 3000 });
    } finally {
      setSubmitting(false);
    }
  };

  const formatAadharNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 12);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  };

  const handlePanChange = (value: string) => {
    const clean = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 10);
    setPanNumber(clean);
  };

  const handleAadharChange = (value: string) => {
    setAadharNumber(value.replace(/\D/g, "").slice(0, 12));
  };

  return (
    <div className="flex w-full flex-col items-center">
      <div className="w-full max-w-2xl space-y-4">
        <div className="flex justify-center">
          <AuthFlowBrand className="mb-0" />
        </div>
        <SignUpStepper currentStepId="documents_uploaded" />
      </div>

      <div className="mt-6 w-full max-w-[400px]">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-base-content">
            Complete profile
          </h1>
          <p className="mt-1 text-sm text-base-content/60">
            Add your details to continue
          </p>
        </div>

        <div className="rounded-xl border border-base-300 bg-base-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-base-content/80 mb-1.5">PAN number</label>
              <input
                type="text"
                className="input input-bordered input-sm w-full h-9 text-sm bg-base-100 uppercase"
                value={panNumber}
                onChange={(e) => handlePanChange(e.target.value)}
                placeholder="10 characters (e.g. ABCDE1234F)"
                maxLength={10}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-base-content/80 mb-1.5">Aadhaar number</label>
              <input
                type="text"
                inputMode="numeric"
                className="input input-bordered input-sm w-full h-9 text-sm bg-base-100"
                value={formatAadharNumber(aadharNumber)}
                onChange={(e) => handleAadharChange(e.target.value)}
                placeholder="12 digits"
                maxLength={14}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-base-content/80 mb-1.5">PAN document</label>
              <input
                type="file"
                accept="image/*,.pdf"
                className="file-input file-input-bordered file-input-sm w-full text-sm"
                onChange={(e) => setPanDocument(e.target.files?.[0] ?? null)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-base-content/80 mb-1.5">Aadhaar document</label>
              <input
                type="file"
                accept="image/*,.pdf"
                className="file-input file-input-bordered file-input-sm w-full text-sm"
                onChange={(e) => setAadharDocument(e.target.files?.[0] ?? null)}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={submitting || redirecting}
                className="btn btn-primary btn-sm flex-1 h-9 text-sm font-medium normal-case"
              >
                {redirecting ? "Redirecting..." : submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit"}
              </button>
              <button
                type="button"
                disabled={submitting || redirecting}
                onClick={handleSkip}
                className="btn btn-outline btn-sm flex-1 h-9 text-sm normal-case"
              >
                Skip for now
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;
