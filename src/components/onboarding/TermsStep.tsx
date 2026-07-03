"use client";

import React, { useState } from "react";
import { ChevronLeft, Loader2, Printer } from "lucide-react";
import { authFetch } from "@/utils/api";
import { useAuthStore } from "@/store/authStore";
import useAlert from "@/hooks/useAlert";
import {
  TERMS_VERSION,
  mandatoryTermsSections,
  mostImportantTermsSections,
} from "@/content/researchServiceTerms";

type TermsStepProps = {
  onBack: () => void;
  onComplete: () => void;
};

export default function TermsStep({ onBack, onComplete }: TermsStepProps) {
  const { updateUser } = useAuthStore();
  const alert = useAlert();
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleAccept = async () => {
    if (!agreed || submitting) return;
    setSubmitting(true);
    try {
      const res = await authFetch("users/me/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signup_step: "terms_accepted" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Could not save acceptance.");
      }
      const data = await res.json();
      updateUser({
        signup_step: "terms_accepted",
        terms_accepted_at: data.terms_accepted_at,
        terms_version: data.terms_version,
      });
      alert.success("Terms accepted.", { duration: 2500 });
      onComplete();
    } catch (e) {
      alert.error(e instanceof Error ? e.message : "Something went wrong", { duration: 4000 });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 w-full max-w-2xl space-y-4 px-1 print:bg-white print:text-black">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between print:text-black">
        <div className="text-center sm:text-left">
          <h1 className="text-xl font-semibold tracking-tight text-base-content print:text-black">
            Terms &amp; Conditions
          </h1>
          <p className="mt-1 text-sm text-base-content/70 print:text-black">
            Version {TERMS_VERSION}. Please read carefully before continuing.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="btn btn-ghost btn-sm shrink-0 self-center gap-1.5 normal-case sm:self-start print:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Printer className="size-4" aria-hidden="true" />
          Print
        </button>
      </div>

      <div className="rounded-xl border border-base-300 bg-base-100 shadow-sm print:border-0 print:bg-white print:shadow-none">
        <div
          id="printable"
          tabIndex={0}
          role="region"
          aria-label="Terms and conditions, scrollable"
          className="terms-printable max-h-[min(420px,55vh)] overflow-y-auto border-b border-base-300 px-4 py-4 sm:px-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset print:max-h-none print:overflow-visible print:border-0 print:bg-white print:text-black"
        >
          <h2 className="text-sm font-semibold text-base-content print:text-black">
            Mandatory terms and conditions to clients
          </h2>
          <div className="mt-3 space-y-4 text-left text-xs leading-relaxed text-base-content/90 sm:text-sm print:text-sm print:text-black">
            {mandatoryTermsSections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-2 print:text-black">
                <h3 className="font-medium text-base-content print:text-black">{s.title}</h3>
                {s.bullets?.length ? (
                  <ul className="mt-1.5 list-disc space-y-2 pl-5 text-left marker:text-base-content/80 print:marker:text-black">
                    {s.bullets.map((item, i) => (
                      <li key={i} className="whitespace-pre-wrap pl-0.5 print:text-black">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : s.body ? (
                  <p className="mt-1.5 whitespace-pre-wrap print:text-black">{s.body}</p>
                ) : null}
              </section>
            ))}
          </div>

          <h2 className="mt-8 text-sm font-semibold text-base-content print:text-black">
            Most Important Terms &amp; Conditions
          </h2>
          <div className="mt-3 space-y-4 text-left text-xs leading-relaxed text-base-content/90 sm:text-sm print:text-sm print:text-black">
            {mostImportantTermsSections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-2 print:text-black">
                <h3 className="font-medium text-base-content print:text-black">{s.title}</h3>
                <p className="mt-1.5 whitespace-pre-wrap print:text-black">{s.body}</p>
              </section>
            ))}
          </div>
        </div>

        <div className="space-y-3 px-4 py-4 sm:px-5 print:hidden">
          <label className="flex cursor-pointer items-start gap-3 text-left text-sm text-base-content">
            <input
              type="checkbox"
              required
              aria-required="true"
              className="checkbox checkbox-primary mt-0.5 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span>
              I have read and agree to the Research Services Terms &amp; Conditions (version {TERMS_VERSION}),
              including the mandatory clauses and the most important terms set out above.
            </span>
          </label>

          <button
            type="button"
            disabled={!agreed || submitting}
            onClick={handleAccept}
            aria-busy={submitting}
            className="btn btn-primary btn-sm h-10 w-full text-sm font-medium normal-case focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100 disabled:cursor-not-allowed disabled:opacity-90 disabled:!bg-primary disabled:!text-primary-content"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Submitting…</span>
              </>
            ) : (
              "Continue"
            )}
          </button>

          <p className="text-center text-[11px] text-base-content/70">
            You must accept these terms to proceed with profile completion and research services.
          </p>
        </div>
      </div>

      <div className="flex justify-center pb-6 print:hidden">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-10 w-fit items-center gap-1 rounded-lg px-2 py-2 text-sm font-medium text-base-content transition-colors hover:bg-base-200 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <ChevronLeft className="size-4 shrink-0" aria-hidden="true" />
          Back to email verification
        </button>
      </div>
    </div>
  );
}
