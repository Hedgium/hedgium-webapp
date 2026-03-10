"use client";

import React, { useState } from "react";
import { useRouter } from "nextjs-toploader/app";
import { authFetch } from "@/utils/api";
import { useAuthStore } from "@/store/authStore";
import useAlert from "@/hooks/useAlert";
import SignUpStepper from "@/components/SignUpStepper";
import { Loader2 } from "lucide-react";

const CompleteProfile: React.FC = () => {
  const router = useRouter();
  const alert = useAlert();
  const { user, updateUser } = useAuthStore();

  const [mobile, setMobile] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [aadharNumber, setAadharNumber] = useState("");
  const [panDocument, setPanDocument] = useState<File | null>(null);
  const [aadharDocument, setAadharDocument] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveProfile({ skip: false });
  };

  const handleSkip = async () => {
    await saveProfile({ skip: true });
  };

  const saveProfile = async ({ skip }: { skip: boolean }) => {
    try {
      setSubmitting(true);
      const userDetails = !skip
        ? { mobile, pan_number: panNumber, aadhar_number: aadharNumber, signup_step: "documents_uploaded" }
        : { kyc_skipped: true };
      updateUser({ kyc_skipped: skip });

      const detailsRes = await authFetch("users/me/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userDetails),
      });

      if (!detailsRes.ok) {
        const errorData = await detailsRes.json();
        throw new Error(errorData.message || detailsRes.statusText);
      }

      if (!skip) {
        updateUser({ kyc_skipped: skip, signup_step: "documents_uploaded" });
        alert.success("Profile updated", { duration: 3000 });
        setRedirecting(true);
        router.push("/onboarding/verification");
        return;
      }
      alert.success("Skipped KYC", { duration: 3000 });

      if (!skip && (panDocument || aadharDocument)) {
        const formData = new FormData();
        if (panDocument) formData.append("pan_document", panDocument);
        if (aadharDocument) formData.append("aadhar_document", aadharDocument);
        const documentsRes = await authFetch("users/me/uploads/", { method: "PUT", body: formData });
        if (!documentsRes.ok) {
          const errorData = await documentsRes.json();
          throw new Error(errorData.message || documentsRes.statusText);
        }
      }
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 px-4 py-8">
      <div className="w-full max-w-2xl mb-4">
        <SignUpStepper currentStepId="initiated" />
      </div>

      <div className="w-full max-w-[400px]">
        <div className="text-center mb-6">
          <h1 className="text-xl font-semibold text-base-content tracking-tight">
            Complete profile
          </h1>
          <p className="text-sm text-base-content/60 mt-1">
            Add your details to continue
          </p>
        </div>

        <div className="bg-base-100 rounded-xl border border-base-300 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-base-content/80 mb-1.5">Mobile</label>
              <input
                type="tel"
                className="input input-bordered input-sm w-full h-9 text-sm bg-base-100"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="Your mobile number"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-base-content/80 mb-1.5">PAN number</label>
              <input
                type="text"
                className="input input-bordered input-sm w-full h-9 text-sm bg-base-100"
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value)}
                placeholder="PAN number"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-base-content/80 mb-1.5">Aadhaar number</label>
              <input
                type="text"
                className="input input-bordered input-sm w-full h-9 text-sm bg-base-100"
                value={formatAadharNumber(aadharNumber)}
                onChange={(e) => setAadharNumber(e.target.value)}
                placeholder="Aadhaar number"
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
