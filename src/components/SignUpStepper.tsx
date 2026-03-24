"use client";

import React from "react";

type Step = {
  id: string;
  name: string;
};

const steps: Step[] = [
  { id: "initiated", name: "Initiated" },
  { id: "documents_uploaded", name: "Upload Documents" },
  { id: "verified", name: "Verified" },
];

interface StepperProps {
  currentStepId: string;
}

const SignUpStepper: React.FC<StepperProps> = ({ currentStepId }) => {
  const currentIndex = steps.findIndex((step) => step.id === currentStepId);

  return (
    <div className="w-full flex flex-col items-center gap-8 p-6">
      <ul className="steps w-full">
        {steps.map((step, idx) => (
          <li
            key={step.id}
            className={`step text-xs ${
              idx < currentIndex
                ? "step-secondary" // ✅ completed
                : idx === currentIndex
                ? "step-secondary" // ⏳ current
                : "" // 🔲 yet to be completed
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
