"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Loader2 } from "lucide-react";
import AuthFlowBrand from "@/components/AuthFlowBrand";
import OnboardingNav from "@/components/OnboardingNav";
import SignUpStepper from "@/components/SignUpStepper";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "nextjs-toploader/app";
import { authFetch } from "@/utils/api";
import useAlert from "@/hooks/useAlert";
import {
  TERMS_VERSION,
  mandatoryTermsSections,
  mostImportantTermsSections,
} from "@/content/researchServiceTerms";

export default function OnboardingTermsPage() {
  const { user, updateUser } = useAuthStore();
  const router = useRouter();
  const alert = useAlert();
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (user.signup_step === "terms_accepted") {
      router.replace("/onboarding/complete-profile");
      return;
    }
    if (user.signup_step !== "email_verified") {
      if (user.signup_step === "initiated") {
        router.replace("/onboarding/verify-email");
        return;
      }
      if (user.signup_step === "documents_uploaded" || user.signup_step === "broker_profile_added") {
        router.replace("/onboarding/verification");
        return;
      }
      router.replace("/home");
    }
  }, [user, router]);

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
      router.push("/onboarding/complete-profile");
    } catch (e) {
      alert.error(e instanceof Error ? e.message : "Something went wrong", { duration: 4000 });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || user.signup_step !== "email_verified") {
    return (
      <div className="flex w-full flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        <p className="mt-3 text-sm text-base-content/60">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center">
      <div className="w-full max-w-2xl space-y-4">
        <div className="flex w-full justify-center">
          <AuthFlowBrand className="mb-0" />
        </div>
        <SignUpStepper currentStepId="terms" />
      </div>

      <div className="mt-4 w-full max-w-2xl space-y-4 px-1">
        <div className="text-center">
          <h1 className="text-xl font-semibold tracking-tight text-base-content">
            Terms &amp; Conditions
          </h1>
          <p className="mt-1 text-sm text-base-content/60">
            Version {TERMS_VERSION}. Please read carefully before continuing.
          </p>
        </div>

        <div className="rounded-xl border border-base-300 bg-base-100 shadow-sm">
          <div className="max-h-[min(420px,55vh)] overflow-y-auto border-b border-base-300 px-4 py-4 sm:px-5">
            <h2 className="text-sm font-semibold text-base-content">Mandatory terms and conditions to clients</h2>
            <div className="mt-3 space-y-4 text-left text-xs leading-relaxed text-base-content/90 sm:text-sm">
              {mandatoryTermsSections.map((s) => (
                <section key={s.id} id={s.id} className="scroll-mt-2">
                  <h3 className="font-medium text-base-content">{s.title}</h3>
                  {s.bullets?.length ? (
                    <ul className="mt-1.5 list-disc space-y-2 pl-5 text-left marker:text-base-content/80">
                      {s.bullets.map((item, i) => (
                        <li key={i} className="whitespace-pre-wrap pl-0.5">
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : s.body ? (
                    <p className="mt-1.5 whitespace-pre-wrap">{s.body}</p>
                  ) : null}
                </section>
              ))}
            </div>

            <h2 className="mt-8 text-sm font-semibold text-base-content">Most Important Terms &amp; Conditions</h2>
            <div className="mt-3 space-y-4 text-left text-xs leading-relaxed text-base-content/90 sm:text-sm">
              {mostImportantTermsSections.map((s) => (
                <section key={s.id} id={s.id} className="scroll-mt-2">
                  <h3 className="font-medium text-base-content">{s.title}</h3>
                  <p className="mt-1.5 whitespace-pre-wrap">{s.body}</p>
                </section>
              ))}
            </div>
          </div>

          <div className="space-y-3 px-4 py-4 sm:px-5">
            <label className="flex cursor-pointer items-start gap-3 text-left text-sm text-base-content">
              <input
                type="checkbox"
                className="checkbox checkbox-primary mt-0.5 shrink-0"
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
              className="btn btn-primary btn-sm h-10 w-full text-sm font-medium normal-case"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
            </button>

            <p className="text-center text-[11px] text-base-content/50">
              You must accept these terms to proceed with profile completion and research services.
            </p>
          </div>
        </div>

        <div className="flex justify-center pb-6">
          <Link
            href="/onboarding/verify-email"
            className="inline-flex min-h-10 w-fit items-center gap-1 rounded-lg px-2 py-2 text-sm font-medium text-base-content transition-colors hover:bg-base-200 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <ChevronLeft className="size-4 shrink-0" aria-hidden />
            Back to email verification
          </Link>
        </div>
      </div>
    </div>
  );
}
