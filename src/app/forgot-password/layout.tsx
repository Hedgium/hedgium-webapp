import type { Metadata } from "next";
import AuthFlowShell from "@/components/AuthFlowShell";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your Hedgium account password.",
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthFlowShell>{children}</AuthFlowShell>;
}
