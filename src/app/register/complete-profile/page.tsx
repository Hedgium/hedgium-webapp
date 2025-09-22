"use client";

import React, { useState } from "react";
import { useRouter } from "nextjs-toploader/app";
import { authFetch } from "@/utils/api";
import { useAuthStore } from "@/store/authStore";
import useAlert from "@/hooks/useAlert";
import SignUpStepper from "@/components/SignUpStepper";

const CompleteProfile: React.FC = () => {
  const router = useRouter();
  const alert = useAlert();

  const [mobile, setMobile] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [aadharNumber, setAadharNumber] = useState("");
  const { user, updateUser } = useAuthStore();
  const [panDocument, setPanDocument] = useState<File | null>(null);
  const [aadharDocument, setAadharDocument] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      const formData = new FormData();
      if (!skip) {
        formData.append("mobile", mobile);
        formData.append("pan_number", panNumber);
        formData.append("aadhar_number", aadharNumber);
        if (panDocument) formData.append("pan_document", panDocument);
        if (aadharDocument) formData.append("aadhar_document", aadharDocument);
        formData.append("signup_step", "documents_uploaded");
      }
      // Mark step as completed even if skipped
      if (skip) {
        formData.append("kyc_skipped", "true"); // optional, if you added this field
      }

      const res = await authFetch("users/" + (user?.id ?? "") + "/", {
        method: "PUT",
        body: formData,
      });
      const data = await res.json();

      // Update local store
      updateUser({  kyc_skipped: skip, signup_step:"documents_uploaded" });

      alert.success(skip ? "Skipped KYC" : "Profile updated successfully", {
        duration: 3000,
      });

      // Redirect to next step
      router.push("/register/add-broker");
    } catch (e) {
      alert.error("Something went wrong. Please try again.", { duration: 3000 });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Hero background wrapper */}
      <div className="min-h-screen hero-pattern flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        {/* Stepper */}
        <div className="w-full max-w-2xl mb-10">
          <SignUpStepper currentStepId="initiated" />
        </div>

        {/* Card form */}
        <div className="max-w-md w-full">
          <h2 className="text-center text-2xl font-bold mb-6 text-base-content">
            Complete Your Profile
          </h2>

          <form
            onSubmit={handleSubmit}
            className="card bg-base-100 shadow-xl card-hover p-6 space-y-4"
          >
            {/* Mobile */}
            <div>
              <label className="block text-sm font-medium">Mobile</label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="input input-bordered w-full"
                placeholder="Enter your mobile number"
              />
            </div>

            {/* PAN */}
            <div>
              <label className="block text-sm font-medium">PAN Number</label>
              <input
                type="text"
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value)}
                className="input input-bordered w-full"
                placeholder="Enter your PAN number"
              />
            </div>

            {/* Aadhar */}
            <div>
              <label className="block text-sm font-medium">Aadhar Number</label>
              <input
                type="text"
                value={aadharNumber}
                onChange={(e) => setAadharNumber(e.target.value)}
                className="input input-bordered w-full"
                placeholder="Enter your Aadhar number"
              />
            </div>

            {/* Upload PAN */}
            <div>
              <label className="block text-sm font-medium">Upload PAN Document</label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) =>
                  setPanDocument(e.target.files ? e.target.files[0] : null)
                }
                className="file-input file-input-bordered w-full"
              />
            </div>

            {/* Upload Aadhar */}
            <div>
              <label className="block text-sm font-medium">Upload Aadhar Document</label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) =>
                  setAadharDocument(e.target.files ? e.target.files[0] : null)
                }
                className="file-input file-input-bordered w-full"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-between gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary flex-1"
              >
                {submitting ? "Submitting" : "Submit"}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSkip}
                className="btn btn-outline flex-1"
              >
                Skip for now
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CompleteProfile;
