import type { Metadata } from 'next';
import AuthFlowShell from '@/components/AuthFlowShell';

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Set a new password for your Hedgium account.',
};

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthFlowShell>{children}</AuthFlowShell>;
}
