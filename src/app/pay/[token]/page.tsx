"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { fetchPublicInvoice, submitPaymentProof } from "@/services/billing";
import type { PublicInvoice } from "@/types/billing";
import { formatMoneyIN } from "@/utils/formatNumber";

const CLIENT_TYPE_LABEL: Record<string, string> = {
  ra_client: "Research services",
  saas: "Software licence",
};

function BankRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-base-content/60 shrink-0">{label}</dt>
      <dd className="text-right font-medium break-all">{value}</dd>
    </div>
  );
}

export default function PublicPayPage() {
  const params = useParams();
  const token = typeof params.token === "string" ? params.token : "";

  const [invoice, setInvoice] = useState<PublicInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [last4, setLast4] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPublicInvoice(token);
      setInvoice(data);
      if (data.status === "PENDING_VERIFICATION" || data.status === "PAID") {
        setSubmitted(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invoice not found");
      setInvoice(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitError(null);
    const trimmed = last4.trim();
    if (!trimmed && !file) {
      setSubmitError("Enter the last 4 digits of your UTR or upload a screenshot.");
      return;
    }
    if (trimmed && !/^\d{4}$/.test(trimmed)) {
      setSubmitError("Last 4 digits must be exactly 4 numbers.");
      return;
    }
    setSubmitting(true);
    try {
      await submitPaymentProof(token, {
        transaction_last4: trimmed || undefined,
        screenshot: file,
      });
      setSubmitted(true);
      await load();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
        <div className="card bg-base-100 border border-base-300 max-w-md w-full">
          <div className="card-body items-center text-center">
            <h1 className="card-title">Invoice unavailable</h1>
            <p className="text-base-content/70">{error || "Not found"}</p>
          </div>
        </div>
      </div>
    );
  }

  const isPaid = invoice.status === "PAID";
  const canPay =
    invoice.status === "ISSUED" || invoice.status === "PENDING_VERIFICATION";

  return (
    <div className="min-h-screen bg-base-200 py-8 px-4">
      <div className="max-w-lg mx-auto space-y-4">
        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold text-primary">Hedgium</h1>
          <p className="text-sm text-base-content/60">Invoice payment</p>
        </div>

        <div className="card bg-base-100/80 border border-base-300 backdrop-blur">
          <div className="card-body gap-3">
            <div className="flex justify-between items-start gap-2">
              <div>
                <p className="font-mono text-sm">{invoice.invoice_no}</p>
                <p className="text-base-content/70 text-sm">
                  {invoice.fy} {invoice.quarter} ·{" "}
                  {CLIENT_TYPE_LABEL[invoice.client_type] || invoice.client_type}
                </p>
                <p className="text-xs text-base-content/50">
                  {invoice.period_start} – {invoice.period_end}
                </p>
              </div>
              <span
                className={`badge ${
                  isPaid
                    ? "badge-success"
                    : invoice.status === "PENDING_VERIFICATION"
                      ? "badge-warning"
                      : "badge-ghost"
                }`}
              >
                {invoice.status.replaceAll("_", " ")}
              </span>
            </div>

            <div className="divider my-1" />

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Fee</span>
                <span>₹{formatMoneyIN(invoice.fee_amount)}</span>
              </div>
              {invoice.gst_amount > 0 && (
                <div className="flex justify-between">
                  <span>GST</span>
                  <span>₹{formatMoneyIN(invoice.gst_amount)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-lg">
                <span>Total due</span>
                <span>₹{formatMoneyIN(invoice.total_amount)}</span>
              </div>
            </div>

            {(invoice.hedgium_gstin || invoice.client_gstin) && (
              <div className="text-xs text-base-content/50 space-y-0.5">
                {invoice.hedgium_gstin && <p>Hedgium GSTIN: {invoice.hedgium_gstin}</p>}
                {invoice.client_gstin && <p>Your GSTIN: {invoice.client_gstin}</p>}
              </div>
            )}
          </div>
        </div>

        {canPay && !isPaid && (
          <div className="card bg-base-100/80 border border-base-300 backdrop-blur">
            <div className="card-body items-center gap-3">
              <h2 className="font-semibold">Pay with UPI</h2>
              <p className="text-sm text-base-content/70 text-center">
                Scan with any UPI app (GPay, PhonePe, BHIM, etc.). On phone you can
                also tap the button below.
              </p>
              {invoice.upi_payload ? (
                <>
                  <div className="bg-white p-3 rounded-lg">
                    <QRCodeSVG value={invoice.upi_payload} size={200} level="M" />
                  </div>
                  <p className="text-xs text-base-content/50">{invoice.payee_name}</p>
                  {invoice.bank.upi_id ? (
                    <p className="font-mono text-sm">{invoice.bank.upi_id}</p>
                  ) : null}
                  <a href={invoice.upi_payload} className="btn btn-primary btn-sm">
                    Open UPI app
                  </a>
                </>
              ) : (
                <p className="text-error text-sm">UPI details unavailable.</p>
              )}
            </div>
          </div>
        )}

        {canPay && !isPaid && invoice.bank && (
          <div className="card bg-base-100/80 border border-base-300 backdrop-blur">
            <div className="card-body gap-2">
              <h2 className="font-semibold">Bank transfer</h2>
              <p className="text-sm text-base-content/70">
                You can also pay by NEFT / IMPS / RTGS using these details.
              </p>
              <dl className="text-sm space-y-1.5">
                <BankRow label="Beneficiary" value={invoice.bank.beneficiary} />
                <BankRow label="Bank" value={invoice.bank.bank_name} />
                <BankRow label="Account number" value={invoice.bank.account_number} />
                <BankRow label="Account type" value={invoice.bank.account_type} />
                <BankRow label="IFSC" value={invoice.bank.ifsc} />
                <BankRow label="Branch" value={invoice.bank.branch} />
                {invoice.bank.upi_id ? (
                  <BankRow label="UPI ID" value={invoice.bank.upi_id} />
                ) : null}
              </dl>
            </div>
          </div>
        )}

        {isPaid ? (
          <div className="card bg-base-100 border border-success/30">
            <div className="card-body items-center text-center gap-2">
              <CheckCircle2 className="h-10 w-10 text-success" />
              <p className="font-semibold">Payment verified</p>
              <p className="text-sm text-base-content/70">Thank you. This invoice is paid.</p>
            </div>
          </div>
        ) : submitted || invoice.status === "PENDING_VERIFICATION" ? (
          <div className="card bg-base-100 border border-warning/30">
            <div className="card-body items-center text-center gap-2">
              <CheckCircle2 className="h-10 w-10 text-warning" />
              <p className="font-semibold">Proof received</p>
              <p className="text-sm text-base-content/70">
                Hedgium will verify and update this invoice. You can resubmit if needed.
              </p>
            </div>
          </div>
        ) : null}

        {canPay && !isPaid && (
          <div className="card bg-base-100/80 border border-base-300 backdrop-blur">
            <div className="card-body">
              <h2 className="font-semibold mb-1">Confirm payment</h2>
              <p className="text-sm text-base-content/70 mb-3">
                After paying, share the last 4 digits of the UTR / transaction ID and/or a
                screenshot.
              </p>
              <form onSubmit={handleSubmit} className="space-y-3">
                <label className="form-control w-full">
                  <span className="label-text">Last 4 digits of UTR</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    className="input input-bordered w-full font-mono"
                    value={last4}
                    onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="1234"
                  />
                </label>
                <label className="form-control w-full">
                  <span className="label-text">Screenshot (optional if last 4 given)</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="file-input file-input-bordered w-full"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                {submitError && <p className="text-error text-sm">{submitError}</p>}
                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Submit for verification"
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-base-content/50 pb-6">
          Hedgium Services LLP · Questions: clients@hedgium.ai
        </p>
      </div>
    </div>
  );
}
