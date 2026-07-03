"use client";

import React, { useState } from "react";
import { authFetch } from "@/utils/api";
import { useAuthStore } from "@/store/authStore";
import useAlert from "@/hooks/useAlert";
import { Loader2 } from "lucide-react";

type CompleteProfileStepProps = {
  onComplete: () => void;
};

export default function CompleteProfileStep({ onComplete }: CompleteProfileStepProps) {
  const alert = useAlert();
  const { updateUser } = useAuthStore();

  const [panNumber, setPanNumber] = useState("");
  const [aadharNumber, setAadharNumber] = useState("");
  const [panDocument, setPanDocument] = useState<File | null>(null);
  const [aadharDocument, setAadharDocument] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
        onComplete();
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
    <div className="mt-6 w-full max-w-[400px]">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold tracking-tight text-base-content">
          Complete profile
        </h1>
        <p className="mt-1 text-sm text-base-content/70">
          Add your details to continue
        </p>
      </div>

      <div className="rounded-xl border border-base-300 bg-base-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="panNumber" className="block text-xs font-medium text-base-content/80 mb-1.5">PAN number</label>
            <input
              id="panNumber"
              name="panNumber"
              type="text"
              required
              aria-required="true"
              className="input input-bordered input-sm w-full h-9 text-sm bg-base-100 uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100"
              value={panNumber}
              onChange={(e) => handlePanChange(e.target.value)}
              placeholder="10 characters (e.g. ABCDE1234F)"
              maxLength={10}
            />
          </div>
          <div>
            <label htmlFor="aadharNumber" className="block text-xs font-medium text-base-content/80 mb-1.5">Aadhaar number</label>
            <input
              id="aadharNumber"
              name="aadharNumber"
              type="text"
              inputMode="numeric"
              required
              aria-required="true"
              className="input input-bordered input-sm w-full h-9 text-sm bg-base-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100"
              value={formatAadharNumber(aadharNumber)}
              onChange={(e) => handleAadharChange(e.target.value)}
              placeholder="12 digits"
              maxLength={14}
            />
          </div>
          <div>
            <label htmlFor="panDocument" className="block text-xs font-medium text-base-content/80 mb-1.5">PAN document</label>
            <input
              id="panDocument"
              name="panDocument"
              type="file"
              accept="image/*,.pdf"
              className="file-input file-input-bordered file-input-sm w-full text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100"
              onChange={(e) => setPanDocument(e.target.files?.[0] ?? null)}
            />
          </div>
          <div>
            <label htmlFor="aadharDocument" className="block text-xs font-medium text-base-content/80 mb-1.5">Aadhaar document</label>
            <input
              id="aadharDocument"
              name="aadharDocument"
              type="file"
              accept="image/*,.pdf"
              className="file-input file-input-bordered file-input-sm w-full text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100"
              onChange={(e) => setAadharDocument(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={submitting}
              aria-busy={submitting}
              className="btn btn-primary btn-sm flex-1 h-9 text-sm font-medium normal-case focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100 disabled:cursor-not-allowed disabled:opacity-90 disabled:!bg-primary disabled:!text-primary-content"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Submitting…</span>
                </>
              ) : (
                "Submit"
              )}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleSkip}
              className="btn btn-outline btn-sm flex-1 h-9 text-sm normal-case focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100"
            >
              Skip for now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
