"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Loader2, Printer } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import useAlert from "@/hooks/useAlert";
import {
  acceptMandate,
  fetchMandateDocument,
} from "@/services/onboardingConsents";
import type { MandateDocument } from "@/types/onboardingDocuments";

type MandateStepProps = {
  onBack: () => void;
  onComplete: () => void;
};

export default function MandateStep({ onBack, onComplete }: MandateStepProps) {
  const { updateUser } = useAuthStore();
  const alert = useAlert();
  const [doc, setDoc] = useState<MandateDocument | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [typedFullName, setTypedFullName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingDoc(true);
      setLoadError(null);
      try {
        const data = await fetchMandateDocument();
        if (!cancelled) setDoc(data);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Could not load mandate.");
        }
      } finally {
        if (!cancelled) setLoadingDoc(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const canSubmit = useMemo(
    () => Boolean(doc) && agreed && Boolean(typedFullName.trim()),
    [doc, agreed, typedFullName]
  );

  const handleAccept = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const data = await acceptMandate({
        typed_full_name: typedFullName.trim(),
        accepted: true,
      });
      updateUser({
        signup_step: data.signup_step,
        mandate_version: data.mandate_version as string | null | undefined,
        verified: data.verified,
        onboarding: data.onboarding ?? undefined,
      });
      alert.success("Client Mandate accepted.", { duration: 2500 });
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
            {doc?.title ?? "Client Mandate and Consent"}
          </h1>
          <p className="mt-1 text-sm text-base-content/70 print:text-black">
            {doc
              ? `Version ${doc.version}. Please read carefully before accepting.`
              : "Please read carefully before accepting."}
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
          id="printable-mandate"
          tabIndex={0}
          role="region"
          aria-label="Client mandate, scrollable"
          className="terms-printable max-h-[min(420px,55vh)] overflow-y-auto border-b border-base-300 px-4 py-4 sm:px-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset print:max-h-none print:overflow-visible print:border-0 print:bg-white print:text-black"
        >
          {loadingDoc && (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-base-content/70">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Loading mandate…
            </div>
          )}
          {loadError && !loadingDoc && (
            <p className="py-8 text-center text-sm text-error">{loadError}</p>
          )}
          {doc && (
            <>
              <p className="whitespace-pre-wrap text-left text-xs leading-relaxed text-base-content/90 sm:text-sm print:text-sm print:text-black">
                {doc.intro}
              </p>
              <div className="mt-6 space-y-4 text-left text-xs leading-relaxed text-base-content/90 sm:text-sm print:text-sm print:text-black">
                {doc.sections.map((s) => (
                  <section key={s.id} id={s.id} className="scroll-mt-2 print:text-black">
                    <h3 className="font-medium text-base-content print:text-black">{s.title}</h3>
                    {s.paragraphs?.map((p, i) => (
                      <p key={i} className="mt-1.5 whitespace-pre-wrap print:text-black">
                        {p}
                      </p>
                    ))}
                  </section>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="space-y-4 px-4 py-4 sm:px-5 print:hidden">
          <h2 className="text-sm font-semibold text-base-content">Electronic acceptance by the Client</h2>
          <p className="text-xs leading-relaxed text-base-content/70">
            By typing my full name below and checking the box, I declare that I have read and
            understood this mandate, no assurance of return has been made to me, I am authorised to
            grant this mandate, and I grant the approvals in Clauses 1 and 2 on the terms in Clauses
            3 to 10.
          </p>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-base-content" htmlFor="mandate-full-name">
              Full name (as per PAN)
            </label>
            <input
              id="mandate-full-name"
              type="text"
              className="input input-bordered input-sm w-full"
              placeholder="Type your full name exactly as in KYC records"
              value={typedFullName}
              onChange={(e) => setTypedFullName(e.target.value)}
              autoComplete="name"
              disabled={!doc}
            />
            <p className="text-xs text-base-content/70">
              This constitutes your electronic signature.
            </p>
          </div>

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
              I ACCEPT — I have read, understood and agree to be bound by this Client Mandate and
              Consent{doc ? ` (version ${doc.version})` : ""}.
            </span>
          </label>

          <button
            type="button"
            disabled={!canSubmit || submitting}
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
        </div>
      </div>

      <div className="flex justify-center pb-6 print:hidden">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-10 w-fit items-center gap-1 rounded-lg px-2 py-2 text-sm font-medium text-base-content transition-colors hover:bg-base-200 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <ChevronLeft className="size-4 shrink-0" aria-hidden="true" />
          Back to Fee Schedule
        </button>
      </div>
    </div>
  );
}
