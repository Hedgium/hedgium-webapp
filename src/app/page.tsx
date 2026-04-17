import type { Metadata } from "next";
import AuthFlowShell from "@/components/AuthFlowShell";
import LoginPageClient from "@/components/LoginPageClient";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to your Hedgium account.",
};

export default function RootLoginPage() {
  return (
    <AuthFlowShell>
      <LoginPageClient />
    </AuthFlowShell>
  );
}
