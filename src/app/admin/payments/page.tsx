"use client";

import { useState, useEffect } from "react";
import { authFetch } from "@/utils/api";
import { formatMoneyIN } from "@/utils/formatNumber";
import { CheckCircle, XCircle, ImageIcon, Loader2 } from "lucide-react";

interface Plan {
  id: number;
  name: string;
  duration: string;
  duration_days: number;
  price: number;
}

interface PaymentRequestItem {
  id: number;
  user_id: number;
  user_email: string | null;
  plan_id: number;
  plan: Plan | null;
  transaction_id: string;
  screenshot: string | null;
  status: string;
  created_at: string;
  notes: string | null;
}

const DURATION_LABEL: Record<string, string> = {
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  YEARLY: "Yearly",
};

export default function AdminPaymentsPage() {
  const [pending, setPending] = useState<PaymentRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [filter, setFilter] = useState<"PENDING" | "all">("PENDING");
  const [rejectNotes, setRejectNotes] = useState("");
  const [rejectModalId, setRejectModalId] = useState<number | null>(null);

  useEffect(() => {
    loadPending();
  }, [filter]);

  async function loadPending() {
    setLoading(true);
    try {
      const res = await authFetch("subscriptions/payment-requests/pending/", {}, {
        page: 1,
        page_size: 100,
        ...(filter === "all" ? { status: "ALL" } : {}),
      });
      const data = await res.json();
      setPending(data.results || []);
    } catch (e) {
      console.error(e);
      setPending([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(id: number) {
    setActioningId(id);
    try {
      const res = await authFetch(`subscriptions/payment-requests/${id}/verify/`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      if (res.ok) loadPending();
    } catch (e) {
      console.error(e);
    } finally {
      setActioningId(null);
    }
  }

  async function handleReject(id: number, notes?: string) {
    setActioningId(id);
    try {
      const res = await authFetch(`subscriptions/payment-requests/${id}/reject/`, {
        method: "POST",
        body: JSON.stringify({ notes: notes || "" }),
      });
      if (res.ok) {
        setRejectModalId(null);
        setRejectNotes("");
        loadPending();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActioningId(null);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Payment verification</h1>
      <div className="flex gap-2 mb-6">
        <button
          type="button"
          className={`btn btn-sm ${filter === "PENDING" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setFilter("PENDING")}
        >
          Pending
        </button>
        <button
          type="button"
          className={`btn btn-sm ${filter === "all" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setFilter("all")}
        >
          All
        </button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : pending.length === 0 ? (
        <div className="card bg-base-100 ">
          <div className="card-body items-center text-center py-12">
            <p className="text-base-content/70">No payment requests found.</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto card bg-base-100 shadow-xl">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Plan</th>
                <th>Amount</th>
                <th>Transaction ID</th>
                <th>Screenshot</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((pr) => (
                <tr key={pr.id}>
                  <td>
                    <span className="font-medium">{pr.user_email || `User #${pr.user_id}`}</span>
                  </td>
                  <td>
                    {pr.plan
                      ? `${pr.plan.name} (${DURATION_LABEL[pr.plan.duration] || pr.plan.duration})`
                      : `Plan #${pr.plan_id}`}
                  </td>
                  <td>
                    {pr.plan ? formatMoneyIN(pr.plan.price) : "—"}
                  </td>
                  <td className="font-mono text-sm">{pr.transaction_id}</td>
                  <td>
                    {pr.screenshot ? (
                      <a
                        href={pr.screenshot}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link link-primary flex items-center gap-1"
                      >
                        <ImageIcon className="h-4 w-4" />
                        View
                      </a>
                    ) : (
                      <span className="text-base-content/50">—</span>
                    )}
                  </td>
                  <td className="text-sm text-base-content/70">
                    {new Date(pr.created_at).toLocaleString()}
                  </td>
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
                  <td>
                    {pr.status === "PENDING" ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="btn btn-success btn-sm gap-1"
                          onClick={() => handleVerify(pr.id)}
                          disabled={actioningId === pr.id}
                        >
                          {actioningId === pr.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          Verify
                        </button>
                        <button
                          type="button"
                          className="btn btn-error btn-sm gap-1"
                          onClick={() => setRejectModalId(pr.id)}
                          disabled={actioningId === pr.id}
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-base-content/50">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rejectModalId !== null && (
        <dialog open className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Reject payment request</h3>
            <p className="py-2 text-base-content/70">Optional notes (e.g. reason for rejection):</p>
            <textarea
              className="textarea textarea-bordered w-full"
              rows={3}
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="Notes..."
            />
            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setRejectModalId(null);
                  setRejectNotes("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-error"
                onClick={() => handleReject(rejectModalId, rejectNotes)}
              >
                Reject
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button
              type="button"
              onClick={() => {
                setRejectModalId(null);
                setRejectNotes("");
              }}
            >
              close
            </button>
          </form>
        </dialog>
      )}
    </div>
  );
}
