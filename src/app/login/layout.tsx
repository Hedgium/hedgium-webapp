import type { Metadata } from "next";
import AuthFlowShell from "@/components/AuthFlowShell";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to your Hedgium account.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthFlowShell>{children}</AuthFlowShell>;
}
