"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Loader2, Printer } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import useAlert from "@/hooks/useAlert";
import {
  acceptFeeSchedule,
  fetchFeeScheduleDocument,
} from "@/services/onboardingConsents";
import type {
  ClientCategory,
  FamilyDeclaration,
  FeeScheduleDocument,
} from "@/types/onboardingDocuments";

type FeesStepProps = {
  onBack: () => void;
  onComplete: () => void;
};

export default function FeesStep({ onBack, onComplete }: FeesStepProps) {
  const { updateUser } = useAuthStore();
  const alert = useAlert();
  const [doc, setDoc] = useState<FeeScheduleDocument | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [clientCategory, setClientCategory] = useState<ClientCategory | "">("");
  const [familyDeclaration, setFamilyDeclaration] = useState<FamilyDeclaration | "">("");
  const [familyMemberNames, setFamilyMemberNames] = useState("");
  const [gstin, setGstin] = useState("");
  const [typedFullName, setTypedFullName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingDoc(true);
      setLoadError(null);
      try {
        const data = await fetchFeeScheduleDocument();
        if (!cancelled) setDoc(data);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Could not load Fee Schedule.");
        }
      } finally {
        if (!cancelled) setLoadingDoc(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const showFamily = clientCategory === "individual_huf";

  const canSubmit = useMemo(() => {
    if (!doc || !agreed || !clientCategory || !typedFullName.trim()) return false;
    if (gstin.trim() && gstin.trim().length !== 15) return false;
    if (showFamily) {
      if (!familyDeclaration) return false;
      if (familyDeclaration === "has_member" && !familyMemberNames.trim()) return false;
    }
    return true;
  }, [
    doc,
    agreed,
    clientCategory,
    typedFullName,
    gstin,
    showFamily,
    familyDeclaration,
    familyMemberNames,
  ]);

  const handleAccept = async () => {
    if (!canSubmit || submitting || !clientCategory) return;
    setSubmitting(true);
    try {
      const data = await acceptFeeSchedule({
        client_category: clientCategory,
        family_declaration: showFamily ? (familyDeclaration as FamilyDeclaration) : null,
        family_member_names:
          showFamily && familyDeclaration === "has_member"
            ? familyMemberNames.trim()
            : null,
        gstin: gstin.trim().toUpperCase(),
        typed_full_name: typedFullName.trim(),
        accepted: true,
      });
      updateUser({
        signup_step: data.signup_step,
        client_category: data.client_category ?? clientCategory,
        gstin: data.gstin ?? gstin.trim().toUpperCase(),
        fees_version: data.fees_version as string | null | undefined,
        verified: data.verified,
        onboarding: data.onboarding ?? undefined,
      });
      alert.success("Fee Schedule accepted.", { duration: 2500 });
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
            {doc?.title ?? "Fee Schedule"}
          </h1>
          <p className="mt-1 text-sm text-base-content/70 print:text-black">
            {doc
              ? `Version ${doc.version}. ${doc.subtitle} — please read carefully.`
              : "Research Services — please read carefully."}
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
          id="printable-fees"
          tabIndex={0}
          role="region"
          aria-label="Fee schedule, scrollable"
          className="terms-printable max-h-[min(420px,55vh)] overflow-y-auto border-b border-base-300 px-4 py-4 sm:px-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset print:max-h-none print:overflow-visible print:border-0 print:bg-white print:text-black"
        >
          {loadingDoc && (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-base-content/70">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Loading Fee Schedule…
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
              <p className="mt-4 whitespace-pre-wrap text-left text-xs font-medium leading-relaxed text-base-content sm:text-sm print:text-sm print:text-black">
                {doc.headline}
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
          <h2 className="text-sm font-semibold text-base-content">
            Electronic acceptance of the Fee Schedule
          </h2>
          <p className="text-xs text-base-content/70">Please confirm the following before accepting.</p>

          <fieldset className="space-y-2" disabled={!doc}>
            <legend className="text-sm font-medium text-base-content">1. Client category</legend>
            {(
              [
                ["individual_huf", "Individual or HUF"],
                ["non_individual", "Non-individual client (company, LLP, partnership, trust, body corporate)"],
                ["accredited_investor", "Accredited investor — valid accreditation certificate to be uploaded"],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="flex cursor-pointer items-start gap-3 text-sm text-base-content">
                <input
                  type="radio"
                  name="client_category"
                  className="radio radio-primary radio-sm mt-0.5"
                  checked={clientCategory === value}
                  onChange={() => {
                    setClientCategory(value);
                    if (value !== "individual_huf") {
                      setFamilyDeclaration("");
                      setFamilyMemberNames("");
                    }
                  }}
                />
                <span>{label}</span>
              </label>
            ))}
          </fieldset>

          {showFamily && (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-base-content">2. Family declaration</legend>
              <p className="text-xs text-base-content/70">
                The SEBI cap applies to the family in aggregate.
              </p>
              <label className="flex cursor-pointer items-start gap-3 text-sm text-base-content">
                <input
                  type="radio"
                  name="family_declaration"
                  className="radio radio-primary radio-sm mt-0.5"
                  checked={familyDeclaration === "none"}
                  onChange={() => {
                    setFamilyDeclaration("none");
                    setFamilyMemberNames("");
                  }}
                />
                <span>No member of my family is presently a client of Hedgium.</span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 text-sm text-base-content">
                <input
                  type="radio"
                  name="family_declaration"
                  className="radio radio-primary radio-sm mt-0.5"
                  checked={familyDeclaration === "has_member"}
                  onChange={() => setFamilyDeclaration("has_member")}
                />
                <span>A member of my family is a client of Hedgium — name(s):</span>
              </label>
              {familyDeclaration === "has_member" && (
                <input
                  type="text"
                  className="input input-bordered input-sm w-full"
                  placeholder="Name(s) of family member(s)"
                  value={familyMemberNames}
                  onChange={(e) => setFamilyMemberNames(e.target.value)}
                  aria-label="Family member names"
                />
              )}
            </fieldset>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-base-content" htmlFor="fee-gstin">
              {showFamily ? "3" : "2"}. GSTIN (optional)
            </label>
            <input
              id="fee-gstin"
              type="text"
              maxLength={15}
              className="input input-bordered input-sm w-full uppercase"
              placeholder="15 characters, leave blank if not registered"
              value={gstin}
              onChange={(e) => setGstin(e.target.value.toUpperCase())}
              disabled={!doc}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-base-content" htmlFor="fee-full-name">
              {showFamily ? "4" : "3"}. Full name (as per PAN)
            </label>
            <input
              id="fee-full-name"
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
              I ACCEPT — I have read and understood this Fee Schedule
              {doc ? ` (version ${doc.version})` : ""}, I understand what I will be charged and when,
              no assured or guaranteed return has been represented to me, and I agree to be bound by
              these terms.
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
          Back to Terms
        </button>
      </div>
    </div>
  );
}
