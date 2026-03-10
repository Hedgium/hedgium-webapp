"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { authFetch } from "@/utils/api";
import useAlert from "@/hooks/useAlert";
import SignUpStepper from "@/components/SignUpStepper";
import BrokerCredentialHelpModal from "@/components/BrokerCredentialHelpModal";
import { Loader2, HelpCircle } from "lucide-react";

const BrokerSetup: React.FC = () => {
  const router = useRouter();
  const alert = useAlert();
  const { user, updateUser } = useAuthStore();

  const [brokerName, setBrokerName] = useState("");
  const [brokerUserId, setBrokerUserId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [brokerTwofa, setBrokerTwofa] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [helpField, setHelpField] = useState<string | null>(null);

  const openHelp = (field: string) => {
    setHelpField(field);
    setHelpModalOpen(true);
  };
  const closeHelp = () => {
    setHelpModalOpen(false);
    setHelpField(null);
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
      alert.success("Broker profile skipped", { duration: 3000 });
    } catch {
      alert.error("Something went wrong", { duration: 4000 });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brokerName) {
      alert.error("Select a broker", { duration: 3000 });
      return;
    }
    if (!brokerUserId) {
      alert.error("Enter Broker User ID", { duration: 3000 });
      return;
    }
    if (!apiKey) {
      alert.error("Enter API Key", { duration: 3000 });
      return;
    }
    if (brokerName === "ZERODHA" && !secretKey) {
      alert.error("Enter Secret Key", { duration: 3000 });
      return;
    }
    if (!brokerTwofa) {
      alert.error("Enter TOTP Secret", { duration: 3000 });
      return;
    }

    try {
      setSubmitting(true);
      const formData: {
        user_id: number;
        broker_name: string;
        broker_user_id: string;
        broker_api_key: string;
        broker_secret_key?: string;
        broker_twofa?: string;
      } = {
        user_id: user.id,
        broker_name: brokerName,
        broker_user_id: brokerUserId,
        broker_api_key: apiKey,
      };
      if (brokerName === "ZERODHA") formData.broker_secret_key = secretKey;
      formData.broker_twofa = brokerTwofa;

      const res = await authFetch("profiles/", { method: "POST", body: JSON.stringify(formData) });
      if (res.ok) {
        alert.success("Broker added", { duration: 3000 });
        setRedirecting(true);
        router.push("/onboarding/verification/");
        return;
      }
      const errorData = await res.json().catch(() => ({}));
      alert.error(errorData.message || "Failed to add broker", { duration: 4000 });
    } catch (err: unknown) {
      alert.error(err instanceof Error ? err.message : "Something went wrong", { duration: 4000 });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 px-4 py-8">
      <div className="w-full max-w-2xl mb-4">
        <SignUpStepper currentStepId="documents_uploaded" />
      </div>

      <div className="w-full max-w-[400px]">
        <div className="text-center mb-6">
          <h1 className="text-xl font-semibold text-base-content tracking-tight">
            Connect your broker
          </h1>
          <p className="text-sm text-base-content/60 mt-1">
            Add credentials to link your trading account
          </p>
        </div>

        <div className="bg-base-100 rounded-xl border border-base-300 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-base-content/80 mb-1.5">Broker</label>
              <select
                value={brokerName}
                onChange={(e) => setBrokerName(e.target.value)}
                className="select select-bordered select-sm w-full h-9 text-sm bg-base-100"
              >
                <option value="">Select broker</option>
                <option value="ZERODHA">Zerodha</option>
                <option value="SHOONYA">Shoonya</option>
                <option value="KOTAKNEO">Kotak Neo</option>
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label className="text-xs font-medium text-base-content/80">Broker User ID</label>
                {brokerName && (
                  <button
                    type="button"
                    onClick={() => openHelp("broker_user_id")}
                    className="text-primary hover:opacity-80 p-0.5 cursor-pointer"
                    title="How to get credentials"
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <input
                type="text"
                value={brokerUserId}
                onChange={(e) => setBrokerUserId(e.target.value)}
                className="input input-bordered input-sm w-full h-9 text-sm bg-base-100"
                placeholder="Broker user ID"
              />
            </div>
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label className="text-xs font-medium text-base-content/80">API Key</label>
                {brokerName && (
                  <button
                    type="button"
                    onClick={() => openHelp("api_key")}
                    className="text-primary hover:opacity-80 p-0.5 cursor-pointer"
                    title="How to get credentials"
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="input input-bordered input-sm w-full h-9 text-sm bg-base-100"
                placeholder="API key"
              />
            </div>
            {brokerName === "ZERODHA" && (
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label className="text-xs font-medium text-base-content/80">Secret Key</label>
                  <button
                    type="button"
                    onClick={() => openHelp("secret_key")}
                    className="text-primary hover:opacity-80 p-0.5 cursor-pointer"
                    title="How to get credentials"
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  className="input input-bordered input-sm w-full h-9 text-sm bg-base-100"
                  placeholder="Secret key"
                />
              </div>
            )}
            {brokerName && (
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label className="text-xs font-medium text-base-content/80">
                    TOTP Secret
                  </label>
                  <button
                    type="button"
                    onClick={() => openHelp("broker_twofa")}
                    className="text-primary hover:opacity-80 p-0.5 cursor-pointer"
                    title="How to get credentials"
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  value={brokerTwofa}
                  onChange={(e) => setBrokerTwofa(e.target.value)}
                  className="input input-bordered input-sm w-full h-9 text-sm bg-base-100"
                  placeholder="TOTP secret"
                />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={submitting || redirecting}
                className="btn btn-primary btn-sm flex-1 h-9 text-sm font-medium normal-case"
              >
                {redirecting ? "Redirecting..." : submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save broker"}
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
      <BrokerCredentialHelpModal
        open={helpModalOpen}
        onClose={closeHelp}
        brokerKey={brokerName}
        field={helpField}
      />
    </div>
  );
};

export default BrokerSetup;
