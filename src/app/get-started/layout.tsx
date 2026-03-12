import { Suspense } from "react";

export default function GetStartedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-base-200 flex items-center justify-center">
          <div className="loading loading-spinner loading-lg text-primary" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
