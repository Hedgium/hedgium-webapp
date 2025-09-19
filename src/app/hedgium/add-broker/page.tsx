"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/store/authStore";
import { authFetch } from "@/utils/api";
import useAlert from "@/hooks/useAlert";

const BrokerSetup: React.FC = () => {
  const router = useRouter();

  const [brokerName, setBrokerName] = useState("");
  const alert = useAlert();
  const [apiKey, setApiKey] = useState("");
  const { user } = useAuthStore() as { user: { id: string } };
  const [submitting, setSubmitting] = useState(false);
  
  const [accessToken, setAccessToken] = useState("");
  const [brokerTwofa, setBrokerTwofa] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
        setSubmitting(true);
        const formData = {
            "user_id": user.id,
            "broker_name": brokerName,
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
        alert.success("Broker added successfully", {duration:3000})
        router.push("/hedgium/dashboard/")
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
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
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
                <option value="zerodha">Zerodha</option>
                <option value="upstox">Upstox</option>
                <option value="angelone">AngelOne</option>
                <option value="fyers">Fyers</option>
                <option value="other">Other</option>
              </select>
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
            <div>
              <label className="block text-sm font-medium">Broker 2FA</label>
              <input
                type="text"
                value={brokerTwofa}
                onChange={(e) => setBrokerTwofa(e.target.value)}
                className="input input-bordered w-full"
                placeholder="Enter 2FA Code / PIN"
              />
            </div>

            {/* Submit */}
            <button type="submit" className="btn btn-primary w-full">
              Save Broker
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default BrokerSetup;
