"use client";

import { useRouter } from "next/navigation";
import AuthNav from "@/components/AuthNav";
import AuthFooter from "@/components/AuthFooter";
import AuthNavigation from "@/components/AuthNavigation";
import { useAuthStore } from "@/store/authStore";
import { authFetch } from "@/utils/api";
import NotificationProvider from '@/providers/NotificationProvider';
import AuthInitializingProvider from "@/components/AuthInitializing";

import BrokerConnect from "@/components/BrokerConnect";


export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, updateUser } = useAuthStore();
  const router = useRouter();

  // Determine KYC route
  const kycRoute = async () => {

    try{
        const formData = {"kyc_skipped": false}; // optional, if you added this field
        await authFetch("users/me/", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });
    
      updateUser({  kyc_skipped: false });
    
      } catch(e){
        console.log("Error")
      }
    
    switch (user?.signup_step) {
      case "initiated":
        router.push("/onboarding/complete-profile")

      case "documents_uploaded":
        router.push("/onboarding/add-broker")

      case "broker_profile_added":
        router.push("/onboarding/verification")

      default:
        router.push("/hedgium/dashboard/")
    }
  };

  return (
    <NotificationProvider>
      <AuthInitializingProvider requireAuth={true}>
        <div className="flex flex-col h-screen">

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - visible on md+ */}
        <aside className="hidden md:flex md:flex-col md:w-56 md:shrink-0 bg-base-200 border-r border-base-300 rounded-box">
          <AuthNavigation sidebar />
        </aside>

        {/* Main content */}
        <main className="flex-1 bg-base-200 overflow-y-auto flex flex-col">

              {(user && user?.signup_step !== "verified" ) && (
                <div className="bg-warning border-l-4 px-4 py-2 flex justify-between items-center">
                <p className="text-sm font-medium">
                  Your profile verification is pending. Please complete your KYC to unlock full access.
                </p>
                <button
                  className="btn btn-sm btn-error"
                  onClick={kycRoute}
                >
                  Complete KYC
                </button>
              </div>
              )}

              <BrokerConnect />

          <AuthNav />

          <div className="flex-1">{children}</div>

          <AuthFooter />
        </main>
      </div>

      {/* Bottom Navigation for mobile */}
      <div className="md:hidden">
        <AuthNavigation />
      </div>
        </div>
      </AuthInitializingProvider>
    </NotificationProvider>
  );
}
