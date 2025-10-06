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
  
  const [accessToken, setAccessToken] = useState("");
  const [brokerTwofa, setBrokerTwofa] = useState("");

  const formData = new FormData();

  const handleSkip = async (e: React.FormEvent) => {
    try{
    setSubmitting(true);

    e.preventDefault();
    formData.append("kyc_skipped", "true"); // optional, if you added this field
    const res = await authFetch("users/" + (user?.id ?? "") + "/", {
      method: "PUT",
      body: formData,
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

    try {
        setSubmitting(true);
        const formData = {
            "user_id": user.id,
            "broker_name": brokerName,
            "broker_user_id": brokerUserId,
            "broker_api_key": apiKey,
            "broker_access_token": accessToken,
            "broker_twofa": brokerTwofa
        }
        const url = "profiles/"

        const res = await authFetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formData)
        })

        // console.log(data);
        updateUser({ signup_step: "broker_profile_added" })

        alert.success("Broker added successfully", {duration:3000})
        router.push("/register/verification/")
    } catch (e) {

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
  <div className="min-h-screen hero-pattern flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    
    {/* Stepper */}
    <div className="w-full max-w-2xl mb-10">
      <SignUpStepper currentStepId="documents_uploaded" />
    </div>

    {/* Card form */}
    <div className="max-w-md w-full">
      <h2 className="text-center text-2xl font-bold mb-6 text-base-content">
        Connect Your Broker
      </h2>

      <form
        onSubmit={handleSubmit}
        className="card bg-base-100 shadow-xl card-hover p-6 space-y-4"
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
            <option value="ANGELONE">Upstox</option>
            <option value="UPSTOX">AngelOne</option>
            <option value="SHOONYA">Shoonya</option>
            <option value="other">Other</option>
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
        <div>
          <label className="block text-sm font-medium">Access Token</label>
          <input
            type="text"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            className="input input-bordered w-full"
            placeholder="Enter Access Token"
          />
        </div>

        {/* Broker 2FA */}
        {/* <div>
          <label className="block text-sm font-medium">Broker 2FA</label>
          <input
            type="text"
            value={brokerTwofa}
            onChange={(e) => setBrokerTwofa(e.target.value)}
            className="input input-bordered w-full"
            placeholder="Enter 2FA Code / PIN"
          />
        </div> */}

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
    </div>
  </div>
</>


  );
};

export default BrokerSetup;
