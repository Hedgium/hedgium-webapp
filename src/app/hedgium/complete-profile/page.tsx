"use client";

import React, { useState } from "react";
import { useRouter } from "nextjs-toploader/app";
import { authFetch } from "@/utils/api";
import { useAuthStore } from "@/store/authStore";
import useAlert from "@/hooks/useAlert";



const CompleteProfile: React.FC = () => {
  const router = useRouter();

  const alert = useAlert();

  const [mobile, setMobile] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [aadharNumber, setAadharNumber] = useState("");
  const { user } = useAuthStore() as { user: { id: string } };
  const [panDocument, setPanDocument] = useState<File | null>(null);
  const [aadharDocument, setAadharDocument] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try{
    setSubmitting(true);
    const formData = new FormData();
    formData.append("mobile", mobile);
    formData.append("pan_number", panNumber);
    formData.append("aadhar_number", aadharNumber);
    formData.append("pan_document", panDocument);
    formData.append("aadhar_document", aadharDocument);

    const res = await authFetch("users/" + (user?.id ?? "") + "/", {
      method: "PUT", 
      body: formData
    })
    const data = await res.json();
    alert.success("Profile is updated sucessfully", {duration:3000});
    // console.log(data);
    router.push("/hedgium/add-broker")
    } catch(e) {

    } finally {
      setSubmitting(false);
    }

  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <h2 className="text-center text-2xl font-bold mb-6 text-base-content">
            Complete Your Profile
          </h2>

          <form
            onSubmit={handleSubmit}
            className="card bg-base-100 shadow-xl card-hover p-6 space-y-4"
          >
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

            <button type="submit" disabled={submitting} className="btn btn-primary w-full">
              {submitting ? "Submitting":"Submit"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default CompleteProfile;
