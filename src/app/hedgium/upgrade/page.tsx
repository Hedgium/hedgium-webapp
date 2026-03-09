"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Check, Upload, Receipt } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { authFetch } from "@/utils/api";
import { formatMoneyIN } from "@/utils/formatNumber";

interface Plan {
  id: number;
  name: string;
  duration: string;
  duration_days: number;
  price: number;
  aum: string;
  features: string;
  description: string | null;
}

interface PaymentRequestItem {
  id: number;
  plan_id: number;
  plan: Plan | null;
  transaction_id: string;
  screenshot: string | null;
  status: string;
  created_at: string;
}

const DURATION_LABEL: Record<string, string> = {
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  YEARLY: "Yearly",
};

function formatApiError(err: { detail?: unknown; message?: string }): string {
  if (typeof err.detail === "string") return err.detail;
  if (Array.isArray(err.detail)) {
    return err.detail
      .map((e: { msg?: string; loc?: unknown }) => (typeof e?.msg === "string" ? e.msg : JSON.stringify(e)))
      .join(". ") || "Validation failed.";
  }
  if (typeof err.message === "string") return err.message;
  return "Failed to submit.";
}

export default function UpgradePage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [myRequests, setMyRequests] = useState<PaymentRequestItem[]>([]);
  const [showMyRequests, setShowMyRequests] = useState(false);
  const { user } = useAuthStore();

  const step = submitSuccess ? "success" : selectedPlan ? "payment" : "select";

  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
    if (user) loadMyRequests();
  }, [user]);

  async function loadPlans() {
    try {
      const res = await authFetch("subscriptions/?page=1&page_size=50");
      const data = await res.json();
      const list = data.results || [];
      setPlans(list);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadMyRequests() {
    try {
      const res = await authFetch("subscriptions/payment-requests/?page=1&page_size=20");
      const data = await res.json();
      setMyRequests(data.results || []);
    } catch (e) {
      console.error(e);
    }
  }

  const handlePlanSelect = (plan: Plan) => {
    setSelectedPlan(plan);
    setSubmitSuccess(false);
    setSubmitError("");
  };

  const handleSubmitPaymentRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !transactionId.trim()) return;
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const formData = new FormData();
      formData.append("plan_id", String(selectedPlan.id));
      formData.append("transaction_id", transactionId.trim());
      if (screenshotFile) formData.append("screenshot", screenshotFile);
      const res = await authFetch("subscriptions/payment-requests/", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = formatApiError(err);
        setSubmitError(msg);
        setIsSubmitting(false);
        return;
      }
      setSubmitSuccess(true);
      setTransactionId("");
      setScreenshotFile(null);
      loadMyRequests();
    } catch (e) {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const featuresList = (plan: Plan) =>
    plan.features ? plan.features.split(",").map((f) => f.trim()).filter(Boolean) : [];

  if (step === "success") {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div className="card w-full max-w-md bg-base-100 shadow-xl">
          <div className="card-body text-center">
            <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h2 className="card-title justify-center text-2xl mb-2">Request submitted</h2>
            <p className="text-base-content/80 mb-6">
              We&apos;ll verify your payment and activate your plan shortly. You can track status below.
            </p>
            <div className="card-actions justify-center gap-2">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setSubmitSuccess(false);
                  setSelectedPlan(null);
                }}
              >
                Subscribe again
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setSubmitSuccess(false);
                  setSelectedPlan(null);
                  setShowMyRequests(true);
                }}
              >
                My payment requests
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === "payment" && selectedPlan) {
    return (
      <div className="min-h-screen bg-base-200 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <button
            type="button"
            className="btn btn-ghost mb-4"
            onClick={() => setSelectedPlan(null)}
          >
            ← Back to plans
          </button>
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-2">Pay manually</h2>
              <div className="bg-base-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold mb-2">Order summary</h3>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{selectedPlan.name} ({DURATION_LABEL[selectedPlan.duration] || selectedPlan.duration})</p>
                    <p className="text-sm text-base-content/70">{selectedPlan.aum || ""}</p>
                  </div>
                  <p className="text-lg font-bold">{formatMoneyIN(selectedPlan.price)}</p>
                </div>
              </div>
              <p className="text-sm text-base-content/70 mb-4">
                Pay the amount via UPI / bank transfer to our account. After payment, enter the <strong>Transaction ID</strong> from your bank/UPI app and optionally upload a <strong>payment screenshot</strong>. Our team will verify and activate your plan.
              </p>
              <form onSubmit={handleSubmitPaymentRequest} className="space-y-4">
                <div>
                  <label className="label">
                    <span className="label-text">Transaction ID *</span>
                  </label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="e.g. 123456789012"
                    className="input input-bordered w-full"
                    required
                  />
                </div>
                <div>
                  <label className="label">
                    <span className="label-text">Payment screenshot (optional)</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="file-input file-input-bordered w-full"
                    onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)}
                  />
                  {screenshotFile && (
                    <p className="text-sm text-base-content/60 mt-1">{screenshotFile.name}</p>
                  )}
                </div>
                {submitError && (
                  <p className="text-sm text-error">{submitError}</p>
                )}
                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting…" : "Submit payment request"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Choose your plan</h1>
            <p className="text-base-content/70">
              Monthly, quarterly, and yearly options with discounts on longer plans.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-outline gap-2"
            onClick={() => setShowMyRequests(!showMyRequests)}
          >
            <Receipt className="h-4 w-4" />
            {showMyRequests ? "Hide" : "My payment requests"}
          </button>
        </div>

        {showMyRequests && (
          <div className="card bg-base-100 shadow-xl mb-8">
            <div className="card-body">
              <h3 className="card-title">My payment requests</h3>
              {myRequests.length === 0 ? (
                <p className="text-base-content/60">No payment requests yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-zebra">
                    <thead>
                      <tr>
                        <th>Plan</th>
                        <th>Transaction ID</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myRequests.map((pr) => (
                        <tr key={pr.id}>
                          <td>
                            {pr.plan
                              ? `${pr.plan.name} (${DURATION_LABEL[pr.plan.duration] || pr.plan.duration})`
                              : `Plan #${pr.plan_id}`}
                          </td>
                          <td className="font-mono text-sm">{pr.transaction_id}</td>
                          <td>
                            <span
                              className={`badge ${
                                pr.status === "VERIFIED"
                                  ? "badge-success"
                                  : pr.status === "REJECTED"
                                  ? "badge-error"
                                  : "badge-warning"
                              }`}
                            >
                              {pr.status}
                            </span>
                          </td>
                          <td className="text-sm text-base-content/70">
                            {new Date(pr.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={`${plan.id}-${plan.duration}`}
              className="card bg-base-100 border border-base-300 shadow-xl hover:shadow-2xl transition-shadow"
            >
              <div className="card-body">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-semibold text-primary">{plan.name}</h3>
                  <span className="badge badge-outline">
                    {DURATION_LABEL[plan.duration] || plan.duration}
                  </span>
                </div>
                <div className="text-2xl font-bold mb-1">{formatMoneyIN(plan.price)}</div>
                <p className="text-sm text-base-content/60 mb-4">
                  {plan.duration_days === 30 && "per month"}
                  {plan.duration_days === 90 && "for 3 months"}
                  {plan.duration_days === 365 && "for 12 months"}
                  {plan.aum && ` · ${plan.aum}`}
                </p>
                {plan.description && (
                  <p className="text-sm text-base-content/70 mb-4">{plan.description}</p>
                )}
                <ul className="space-y-2 mb-6 flex-1">
                  {featuresList(plan).map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="btn btn-primary w-full"
                  onClick={() => handlePlanSelect(plan)}
                >
                  {plan.price === 0 ? "Get started" : "Subscribe"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
