"use client";

import React, { useState, useEffect } from "react";
import { authFetch } from "@/utils/api";
import useAlert from "@/hooks/useAlert";
import { Profile, UserSubscription } from "@/types/profile";

interface SubscriptionPlanOption {
  id: number;
  name: string;
  duration: string;
  duration_days: number;
  description?: string | null;
  price: number;
  max_strategies: number;
}

type Mode = "add" | "modify";

interface SubscriptionPlanModalProps {
  profile: Profile;
  subscription?: UserSubscription | null;
  mode: Mode;
  onSuccess: () => void;
  onCancel: () => void;
}

function formatDateForInput(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toISOString().slice(0, 16);
}

export default function SubscriptionPlanModal({
  profile,
  subscription,
  mode,
  onSuccess,
  onCancel,
}: SubscriptionPlanModalProps) {
  const [plans, setPlans] = useState<SubscriptionPlanOption[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(mode === "add" || mode === "modify");
  const [submitting, setSubmitting] = useState(false);
  const [planId, setPlanId] = useState<number | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const alert = useAlert();

  useEffect(() => {
    if (mode !== "add" && mode !== "modify") return;
    const fetchPlans = async () => {
      setLoadingPlans(true);
      try {
        const res = await authFetch("subscriptions/", {}, { page_size: 50 });
        const data = await res.json();
        setPlans(data.results || []);
        if (mode === "add" && data.results?.length && planId === "") {
          setPlanId(data.results[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch plans:", err);
        alert.error("Failed to load subscription plans");
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchPlans();
  }, [mode]);

  useEffect(() => {
    if (mode === "modify" && subscription) {
      setStartDate(formatDateForInput(subscription.start_date));
      setEndDate(formatDateForInput(subscription.end_date));
      setPlanId(subscription.plan.id);
    }
  }, [mode, subscription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "add") {
        if (!planId || typeof planId !== "number") {
          alert.error("Please select a plan");
          return;
        }
        const payload: Record<string, unknown> = {
          user_id: profile.user_id,
          plan_id: planId,
        };
        if (startDate) payload.start_date = new Date(startDate).toISOString();
        if (endDate) payload.end_date = new Date(endDate).toISOString();

        const res = await authFetch("subscriptions/user-subscriptions/", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          alert.success("Subscription added successfully");
          onSuccess();
        } else {
          const err = await res.json();
          alert.error(err.detail || "Failed to add subscription");
        }
      } else {
        if (!subscription) return;
        if (planId === "" || typeof planId !== "number") {
          alert.error("Please select a plan");
          return;
        }
        const payload: Record<string, string | number> = {};
        if (startDate) payload.start_date = new Date(startDate).toISOString();
        if (endDate) payload.end_date = new Date(endDate).toISOString();
        if (planId !== subscription.plan.id) {
          payload.plan_id = planId;
        }
        if (Object.keys(payload).length === 0) {
          alert.error("No changes to save");
          return;
        }

        const res = await authFetch(
          `subscriptions/user-subscriptions/${subscription.id}/`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          }
        );
        if (res.ok) {
          alert.success("Subscription updated");
          onSuccess();
        } else {
          const err = await res.json();
          alert.error(err.detail || "Failed to update subscription");
        }
      }
    } catch (err) {
      console.error("Subscription error:", err);
      alert.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const title = mode === "add" ? "Add Subscription Plan" : "Modify Subscription";

  return (
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-lg rounded-xl">
        <h3 className="font-semibold text-xl mb-4">{title}</h3>
        <p className="text-sm text-base-content/70 mb-4">
          Profile: {profile.user.email}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {(mode === "add" || mode === "modify") && (
            <div className="form-control">
              <label className="label">
                <span className="label-text">Subscription plan</span>
              </label>
              {loadingPlans ? (
                <div className="h-10 bg-base-300 rounded-lg animate-pulse" />
              ) : (
                <select
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value ? Number(e.target.value) : "")}
                  className="select select-bordered w-full"
                  required
                >
                  <option value="">Select plan</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.duration}) - ₹{p.price}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="form-control">
            <label className="label">
              <span className="label-text">Start Date</span>
            </label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input input-bordered w-full"
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">End Date</span>
            </label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input input-bordered w-full"
              required={mode === "add"}
            />
          </div>

          <div className="modal-action">
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-ghost"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || ((mode === "add" || mode === "modify") && loadingPlans)}
            >
              {submitting ? (
                <span className="loading loading-spinner loading-sm" />
              ) : mode === "add" ? (
                "Add Plan"
              ) : (
                "Save changes"
              )}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onCancel} />
    </div>
  );
}
