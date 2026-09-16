"use client";

import React from "react";
import { isSaasClient, type OnboardingUserLike } from "@/lib/onboardingSteps";

type Step = {
  id: string;
  name: string;
};

const researchSteps: Step[] = [
  { id: "initiated", name: "Initiated" },
  { id: "terms", name: "Terms" },
  { id: "agreements", name: "Fees & Mandate" },
  { id: "documents_uploaded", name: "Upload Documents" },
  { id: "verified", name: "Verified" },
];

const saasSteps: Step[] = [
  { id: "initiated", name: "Initiated" },
  { id: "fees", name: "Fee Schedule" },
  { id: "terms", name: "Software Terms" },
  { id: "documents_uploaded", name: "Upload Documents" },
  { id: "verified", name: "Verified" },
];

interface StepperProps {
  currentStepId: string;
  user?: OnboardingUserLike | null;
}

const SignUpStepper: React.FC<StepperProps> = ({ currentStepId, user }) => {
  const steps = isSaasClient(user) ? saasSteps : researchSteps;
  const currentIndex = steps.findIndex((step) => step.id === currentStepId);

  return (
    <div className="w-full flex flex-col items-center gap-8 p-6">
      <ul className="steps w-full">
        {steps.map((step, idx) => (
          <li
            key={step.id}
            className={`step text-xs ${
              idx < currentIndex
                ? "step-secondary"
                : idx === currentIndex
                ? "step-secondary"
                : ""
            }`}
          >
            {step.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SignUpStepper;
