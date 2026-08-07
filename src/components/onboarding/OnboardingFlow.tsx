"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "nextjs-toploader/app";
import AuthFlowBrand from "@/components/AuthFlowBrand";
import SignUpStepper from "@/components/SignUpStepper";
import VerifyEmail from "@/components/VerifyEmail";
import SignupStep from "@/components/onboarding/SignupStep";
import TermsStep from "@/components/onboarding/TermsStep";
import FeesStep from "@/components/onboarding/FeesStep";
import MandateStep from "@/components/onboarding/MandateStep";
import CompleteProfileStep from "@/components/onboarding/CompleteProfileStep";
import VerificationStep from "@/components/onboarding/VerificationStep";
import { useAuthStore } from "@/store/authStore";
import {
  type OnboardingStep,
  type OnboardingViewOverride,
  isOnboardingComplete,
  resolveOnboardingStep,
} from "@/lib/onboardingSteps";

const STEPPER_STEP_IDS: Record<OnboardingStep, string | null> = {
  signup: null,
  "verify-email": "initiated",
  terms: "terms",
  fees: "agreements",
  mandate: "agreements",
  "complete-profile": "documents_uploaded",
  verification: "documents_uploaded",
};

const WIDE_STEPS: OnboardingStep[] = ["terms", "fees", "mandate"];

export default function OnboardingFlow() {
  const router = useRouter();
  const { accessToken, user } = useAuthStore();
  const [viewOverride, setViewOverride] = useState<OnboardingViewOverride>(null);

  const step = useMemo(
    () => resolveOnboardingStep(user, Boolean(accessToken), viewOverride),
    [user, accessToken, viewOverride]
  );

  useEffect(() => {
    setViewOverride(null);
  }, [user?.signup_step, user?.onboarding?.pending?.join(",")]);

  useEffect(() => {
    if (accessToken && isOnboardingComplete(user)) {
      router.push("/home");
    }
  }, [accessToken, user, router]);

  const stepperId = STEPPER_STEP_IDS[step];
  const showStepper = stepperId !== null;
  const contentWidth = WIDE_STEPS.includes(step) ? "max-w-2xl" : "max-w-[400px]";

  const clearOverride = () => setViewOverride(null);

  const renderStep = () => {
    switch (step) {
      case "signup":
        return (
          <SignupStep
            onComplete={() => {
              setViewOverride(null);
            }}
          />
        );
      case "verify-email":
        return (
          <div className={`mt-6 w-full ${contentWidth}`}>
            <button
              type="button"
              onClick={() => setViewOverride("signup")}
              className="inline-flex min-h-10 w-fit items-center gap-1 rounded-lg px-2 py-2 text-sm font-medium text-base-content transition-colors hover:bg-base-200 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 justify-self-start"
            >
              <ChevronLeft className="size-4 shrink-0" aria-hidden />
              Back
            </button>
            <div className="rounded-xl border border-base-300 bg-base-100 p-6 shadow-sm">
              <VerifyEmail
                autoSendOnMount
                successPath=""
                skipPath=""
                onVerified={clearOverride}
                onSkip={clearOverride}
              />
            </div>
          </div>
        );
      case "terms":
        return (
          <TermsStep
            onBack={() => setViewOverride("verify-email")}
            onComplete={clearOverride}
          />
        );
      case "fees":
        return (
          <FeesStep
            onBack={() => setViewOverride("terms")}
            onComplete={clearOverride}
          />
        );
      case "mandate":
        return (
          <MandateStep
            onBack={() => setViewOverride("fees")}
            onComplete={clearOverride}
          />
        );
      case "complete-profile":
        return <CompleteProfileStep onComplete={clearOverride} />;
      case "verification":
        return (
          <VerificationStep
            onUploadDocuments={() => setViewOverride("complete-profile")}
          />
        );
      default:
        return null;
    }
  };

  if (step === "signup") {
    return (
      <div className="flex w-full flex-col items-center">
        {renderStep()}
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center">
      {showStepper && (
        <div className="w-full max-w-2xl space-y-4 print:hidden">
          <div className="flex w-full justify-center">
            <AuthFlowBrand className="mb-0" />
          </div>
          <SignUpStepper currentStepId={stepperId!} />
        </div>
      )}
      {renderStep()}
    </div>
  );
}
