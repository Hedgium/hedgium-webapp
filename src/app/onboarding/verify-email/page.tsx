"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import SignUpStepper from "@/components/SignUpStepper";
import VerifyEmail from "@/components/VerifyEmail";
import AuthFlowBrand from "@/components/AuthFlowBrand";

export default function VerifyEmailPage() {
  return (
    <div className="flex w-full flex-col items-center">
      <div className="w-full max-w-2xl space-y-4">
        <div className="flex w-full justify-center">
          <AuthFlowBrand className="mb-0" />
        </div>
        <SignUpStepper currentStepId="initiated" />
      </div>

      <div className="mt-6 w-full max-w-[400px]">

          <Link
            href="/onboarding"
            className="inline-flex min-h-10 w-fit items-center gap-1 rounded-lg px-2 py-2 text-sm font-medium text-base-content transition-colors hover:bg-base-200 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 justify-self-start"
          >
            <ChevronLeft className="size-4 shrink-0" aria-hidden />
            Back
          </Link>
        <div className="rounded-xl border border-base-300 bg-base-100 p-6 shadow-sm">
          <VerifyEmail autoSendOnMount />
        </div>
      </div>
    </div>
  );
}
