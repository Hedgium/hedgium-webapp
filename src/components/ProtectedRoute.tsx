"use client";

import { useEffect } from "react";
import {  usePathname } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
import { useAuthStore } from "@/store/authStore";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { accessToken, isInitializing, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isInitializing && !accessToken) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isInitializing, accessToken, router, pathname]);

  if (!accessToken) return null;

  // Determine the KYC route based on the user's current step
  const kycRoute = () => {
    switch (user?.signup_step) {
      case "initiated":
        return "/register/complete-profile";
      case "documents_uploaded":
        return "/register/add-broker";
      case "broker_profile_added":
        return "/register/verification";
      default:
        return "/hedgium/dashboard/";
    }
  };

  return (
    <>
      {/* Show KYC reminder if user is not verified */}
      {user?.signup_step !== "verified" && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 flex justify-between items-center">
          <p className="text-sm font-medium">
            Your profile verification is pending. Please complete your KYC to unlock full access.
          </p>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => router.push(kycRoute())}
          >
            Complete KYC
          </button>
        </div>
      )}

      {children}
    </>
  );
}
