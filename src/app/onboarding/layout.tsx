import type { Metadata } from "next";
import { Suspense } from "react";
import AuthFlowShell from "@/components/AuthFlowShell";
import NativeAppReturnCapture from "@/components/NativeAppReturnCapture";

export const metadata: Metadata = {
  title: "Onboarding",
  description: "Complete your Hedgium account setup.",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <NativeAppReturnCapture />
      </Suspense>
      <AuthFlowShell>{children}</AuthFlowShell>
    </>
  );
}
