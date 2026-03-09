"use client";

import React from "react";
import SignUpStepper from "@/components/SignUpStepper";
import VerifyEmail from "@/components/VerifyEmail";

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 px-4 py-8">
      <div className="w-full max-w-2xl mb-4">
        <SignUpStepper currentStepId="initiated" />
      </div>

      <div className="w-full max-w-[380px]">
        <div className="bg-base-100 rounded-xl border border-base-300 shadow-sm p-6">
          <VerifyEmail />
        </div>
      </div>
    </div>
  );
}
