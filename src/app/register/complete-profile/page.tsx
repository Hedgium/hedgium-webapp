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

  
  const saveProfile = async ({ skip }) => {
  try {
    setSubmitting(true);

    // Step 1: Update user details (JSON payload)
    let userDetails: { kyc_skipped?: boolean; mobile?: string; pan_number?: string; aadhar_number?: string; signup_step?: string; };
    if (!skip) {
      userDetails = {
        "mobile": mobile,
        "pan_number":panNumber,
        "aadhar_number": aadharNumber,
        "signup_step": "documents_uploaded"
      }
    }
    else {
      userDetails = {
        "kyc_skipped": true,
      }
      updateUser({ kyc_skipped: skip });

    }

    console.log("Sending user details:", userDetails); // Debug log
    const detailsRes = await authFetch(`users/${user?.id ?? ""}/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userDetails),
    });

    if (!detailsRes.ok) {
      const errorData = await detailsRes.json();
      throw new Error(`Details update failed: ${errorData.message || detailsRes.statusText}`);
    }

    if (!skip){
      updateUser({ kyc_skipped: skip, signup_step: "documents_uploaded" });
      router.push("/register/add-broker");
    }
    alert.success(skip ? "Skipped KYC" : "Profile updated successfully", {
      duration: 3000,
    });
    
    // Step 2: Update documents (FormData) if not skipped and files exist
    if (!skip && (panDocument || aadharDocument)) {
      const formData = new FormData();
      if (panDocument) formData.append("pan_document", panDocument);
      if (aadharDocument) formData.append("aadhar_document", aadharDocument);

      // Debug log for FormData
      for (const [key, value] of formData.entries()) {
        console.log(`FormData ${key}: ${value}`);
      }

      const documentsRes = await authFetch(`users/${user?.id ?? ""}/uploads/`, {
        method: "PUT",
        body: formData,
      });

      if (!documentsRes.ok) {
        const errorData = await documentsRes.json();
        throw new Error(`Documents upload failed: ${errorData.message || documentsRes.statusText}`);
      }
    }

    
    


  } catch (e) {
    console.error("Error in saveProfile:", e);
    alert.error(`Something went wrong: ${e.message || "Please try again"}`, { duration: 3000 });
  } finally {
    setSubmitting(false);
  }
};

const formatAadharNumber = (value: string) => {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');

  // Limit to 12 digits (Aadhaar length)
  const limited = digits.slice(0, 12);

  // Group into 4-digit chunks
  const formatted = limited.replace(/(\d{4})(?=\d)/g, '$1 ');

  return formatted.trim();
};

  return (
    <>
      {/* Hero background wrapper */}
      <div className="min-h-screen hero-pattern bg-base-200 flex flex-col items-center justify-center py-4 px-4 md:px-8">
        {/* Stepper */}
        <div className="w-full max-w-2xl mb-4">
          <SignUpStepper currentStepId="initiated" />
        </div>

        {/* Card form */}
        <div className="max-w-md w-full">
          <h2 className="text-center text-2xl font-bold mb-6 text-base-content">
            Complete Your Profile on <span className="text-primary">Hedgium</span>
          </h2>

          <form
            onSubmit={handleSubmit}
            className="card bg-base-100 border border-base-300 card-hover p-6 space-y-4"
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
                value={formatAadharNumber(aadharNumber)}
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
        <br />
        <br />
      </div>
    </>
  );
};

export default CompleteProfile;
