import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Complaint Status',
  description:
    'Check the status of your grievance or complaint with Hedgium.',
};

export default function ComplaintStatusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
