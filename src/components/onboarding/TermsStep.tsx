"use client";

import React, { useEffect, useState } from "react";
import { ChevronLeft, Loader2, Printer } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import useAlert from "@/hooks/useAlert";
import {
  acceptResearchTerms,
  fetchResearchTermsDocument,
} from "@/services/onboardingConsents";
import type { ResearchTermsDocument } from "@/types/onboardingDocuments";

type TermsStepProps = {
  onBack: () => void;
  onComplete: () => void;
};

export default function TermsStep({ onBack, onComplete }: TermsStepProps) {
  const { updateUser } = useAuthStore();
  const alert = useAlert();
  const [doc, setDoc] = useState<ResearchTermsDocument | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingDoc(true);
      setLoadError(null);
      try {
        const data = await fetchResearchTermsDocument();
        if (!cancelled) setDoc(data);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Could not load terms.");
        }
      } finally {
        if (!cancelled) setLoadingDoc(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAccept = async () => {
    if (!agreed || submitting || !doc) return;
    setSubmitting(true);
    try {
      const data = await acceptResearchTerms();
      updateUser({
        signup_step: data.signup_step,
        terms_accepted_at: data.terms_accepted_at as string | null | undefined,
        terms_version: data.terms_version as string | null | undefined,
        verified: data.verified,
        onboarding: data.onboarding ?? undefined,
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
            {doc?.title ?? "Terms & Conditions"}
          </h1>
          <p className="mt-1 text-sm text-base-content/70 print:text-black">
            {doc
              ? `Version ${doc.version}. Please read carefully before continuing.`
              : "Please read carefully before continuing."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          disabled={!doc}
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
          {loadingDoc && (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-base-content/70">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Loading terms…
            </div>
          )}
          {loadError && !loadingDoc && (
            <p className="py-8 text-center text-sm text-error">{loadError}</p>
          )}
          {doc &&
            doc.groups.map((group) => (
              <div key={group.id} className={group.id === "most_important" ? "mt-8" : undefined}>
                <h2 className="text-sm font-semibold text-base-content print:text-black">
                  {group.title}
                </h2>
                <div className="mt-3 space-y-4 text-left text-xs leading-relaxed text-base-content/90 sm:text-sm print:text-sm print:text-black">
                  {group.sections.map((s) => (
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
              </div>
            ))}
        </div>

        <div className="space-y-3 px-4 py-4 sm:px-5 print:hidden">
          <label className="flex cursor-pointer items-start gap-3 text-left text-sm text-base-content">
            <input
              type="checkbox"
              required
              aria-required="true"
              disabled={!doc}
              className="checkbox checkbox-primary mt-0.5 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span>
              I have read and agree to the Research Services Terms &amp; Conditions
              {doc ? ` (version ${doc.version})` : ""}, including the mandatory clauses and the most
              important terms set out above.
            </span>
          </label>

          <button
            type="button"
            disabled={!doc || !agreed || submitting}
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
