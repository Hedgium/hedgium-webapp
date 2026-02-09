"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/store/authStore";
import { authFetch } from "@/utils/api";
import useAlert from "@/hooks/useAlert";
import SignUpStepper from "@/components/SignUpStepper";

const BrokerSetup: React.FC = () => {
  const router = useRouter();

  const [brokerName, setBrokerName] = useState("");
  const [brokerUserId, setBrokerUserId] = useState("");
  const alert = useAlert();
  const [apiKey, setApiKey] = useState("");
  const { user, updateUser } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);
  
  const [secretKey, setSecretKey] = useState("");
  const [brokerTwofa, setBrokerTwofa] = useState("");


  const handleSkip = async (e: React.FormEvent) => {
    try{
    setSubmitting(true);

    e.preventDefault();
    const formData = {"kyc_skipped":true}; // optional, if you added this field
    const res = await authFetch("users/" + (user?.id ?? "") + "/", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

  updateUser({  kyc_skipped: true });

  alert.success("Broker profile skipped", {
    duration: 3000,
  }); 
  } catch(e){
    alert.error("Something went wrong!!", {duration:4000})
  }
  
  finally{
        setSubmitting(false);

  }


  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!brokerName) {
      alert.error("Please select a broker", { duration: 3000 });
      return;
    }

    if (!brokerUserId) {
      alert.error("Please enter Broker User ID", { duration: 3000 });
      return;
    }

    if (!apiKey) {
      alert.error("Please enter API Key", { duration: 3000 });
      return;
    }

    if (brokerName === "ZERODHA" && !secretKey) {
      alert.error("Please enter Secret Key", { duration: 3000 });
      return;
    }

    if ((brokerName === "SHOONYA" || brokerName === "KOTAKNEO") && !brokerTwofa) {
      alert.error(`Please enter ${brokerName === "KOTAKNEO" ? "TOTP Secret" : "2FA Code"}`, { duration: 3000 });
      return;
    }

    try {
        setSubmitting(true);
        const formData: any = {
            "user_id": user.id,
            "broker_name": brokerName,
            "broker_user_id": brokerUserId,
            "broker_api_key": apiKey,
        }

        // Only include fields that are relevant for the selected broker
        if (brokerName === "ZERODHA") {
          formData["broker_secret_key"] = secretKey;
        }

        if (brokerName === "SHOONYA" || brokerName === "KOTAKNEO") {
          formData["broker_twofa"] = brokerTwofa;
        }

        const url = "profiles/"

        const res = await authFetch(url, {
            method: "POST",
            body: JSON.stringify(formData)
        })

        if (res.ok){
          updateUser({ signup_step: "broker_profile_added" })
          alert.success("Broker added successfully", {duration:3000})
          router.push("/register/verification/")
        } else {
          const errorData = await res.json().catch(() => ({}));
          alert.error(errorData.message || "Failed to add broker", {duration:4000})
        }
    } catch (e: any) {
      alert.error(e.message || "Something went wrong", {duration:4000})
    } finally {
        setSubmitting(false)
    }

    // 🚀 Save broker info to backend
    // Redirect to dashboard or trading page
    // router.push("/dashboard");
  };

  return (
   
    <>
  {/* Hero background wrapper */}
  <div className="min-h-screen hero-pattern bg-base-200 flex flex-col items-center justify-center py-4 px-4 sm:px-6 lg:px-8">
    
    {/* Stepper */}
    <div className="w-full max-w-2xl mb-4">
      <SignUpStepper currentStepId="documents_uploaded" />
    </div>

    {/* Card form */}
    <div className="max-w-md w-full">
      <h2 className="text-center text-2xl font-bold mb-6 text-base-content">
        Connect Your Broker
      </h2>

      <form
        onSubmit={handleSubmit}
        className="card bg-base-100 border border-base-300 card-hover p-6 space-y-4"
      >
        {/* Broker Name */}
        <div>
          <label className="block text-sm font-medium">Broker Name</label>
          <select
            value={brokerName}
            onChange={(e) => setBrokerName(e.target.value)}
            className="select select-bordered w-full"
          >
            <option value="">Select Broker</option>
            <option value="ZERODHA">Zerodha</option>
            {/* <option value="ANGELONE">Upstox</option> */}
            {/* <option value="UPSTOX">AngelOne</option> */}
            <option value="SHOONYA">Shoonya</option>
            <option value="KOTAKNEO">Kotak Neo</option>
          </select>
        </div>


        <div>
          <label className="block text-sm font-medium">Broker User Id</label>
          <input
            type="text"
            value={brokerUserId}
            onChange={(e) => setBrokerUserId(e.target.value)}
            className="input input-bordered w-full"
            placeholder="Enter Broker user id"
          />
        </div>



        {/* API Key */}
        <div>
          <label className="block text-sm font-medium">API Key</label>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="input input-bordered w-full"
            placeholder="Enter API Key"
          />
        </div>

        {/* Access Token */}
        {brokerName === "ZERODHA" && <div>
          <label className="block text-sm font-medium">Secret Key</label>
          <input
            type="text"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            className="input input-bordered w-full"
            placeholder="Enter Secret Key"
          />
        </div>}

        {/* Broker 2FA / TOTP */}
        {(brokerName === "SHOONYA" || brokerName === "KOTAKNEO") && <div>
          <label className="block text-sm font-medium">
            {brokerName === "KOTAKNEO" ? "TOTP Secret" : "Broker 2FA"}
          </label>
          <input
            type="text"
            value={brokerTwofa}
            onChange={(e) => setBrokerTwofa(e.target.value)}
            className="input input-bordered w-full"
            placeholder={brokerName === "KOTAKNEO" ? "Enter TOTP Secret" : "Enter 2FA Code"}
          />
        </div> }

        {/* Submit */}
        <div className="flex justify-between gap-2">

        <button
          disabled={submitting}
          type="submit"
          className="btn btn-primary flex-1"
        >
          {submitting ? "Saving" : "Save Broker"}
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

      <br />
      <br />
    </div>
  </div>
</>


  );
};

export default BrokerSetup;
