"use client";

import { useEffect } from "react";
import {  usePathname } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
import { useAuthStore } from "@/store/authStore";
import { isOnboardingIncomplete, onboardingPathForUser } from "@/lib/onboardingSteps";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { accessToken, isInitializing, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isInitializing && !accessToken) {
      router.replace(`/?next=${encodeURIComponent(pathname)}`);
    }
  }, [isInitializing, accessToken, router, pathname]);

  if (!accessToken) return null;

  const incomplete = isOnboardingIncomplete(user);
  const legalOnly = user?.onboarding?.pending?.some((p) =>
    ["terms", "fees", "mandate"].includes(p)
  );

  return (
    <>
      {incomplete && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 flex justify-between items-center">
          <p className="text-sm font-medium">
            {legalOnly
              ? "Action required: please review and accept the updated agreements to continue."
              : "Your profile verification is pending. Please complete your KYC to unlock full access."}
          </p>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => router.push(onboardingPathForUser())}
          >
            {legalOnly ? "Review agreements" : "Complete KYC"}
          </button>
        </div>
      )}

      {children}
    </>
  );
}
