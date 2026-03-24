import type { Metadata } from "next";
import AuthFlowShell from "@/components/AuthFlowShell";

export const metadata: Metadata = {
  title: "Onboarding",
  description: "Complete your Hedgium account setup.",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthFlowShell>{children}</AuthFlowShell>;
}
