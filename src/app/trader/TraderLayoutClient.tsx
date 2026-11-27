"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ShieldX } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import AlertsContainer from "@/components/AlertsContainer";
import NotificationProvider from "@/providers/NotificationProvider";

export default function TraderLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isInitializing, logout } = useAuthStore();

  useEffect(() => {
    if (isInitializing) return;
    if (!user) {
      router.replace(`/?next=${encodeURIComponent("/trader")}`);
    }
  }, [isInitializing, user, router]);

  if (isInitializing || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-md text-primary" />
      </div>
    );
  }

  if (user.role !== "trader") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-200 p-4">
        <div className="card w-full max-w-md border border-base-300 bg-base-100 shadow-xl">
          <div className="card-body items-center text-center">
            <div className="rounded-full bg-error/10 p-4">
              <ShieldX className="size-10 text-error" aria-hidden />
            </div>
            <h1 className="card-title text-2xl">Trader access only</h1>
            <p className="text-base-content/70">
              This terminal is restricted to trader accounts.
            </p>
            <button
              type="button"
              className="btn btn-primary mt-4 gap-2"
              onClick={() => void logout().then(() => router.push("/"))}
            >
              <LogOut className="size-4" />
              Log out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <NotificationProvider>
      <div className="flex h-screen flex-col bg-base-200">
        {children}
        <AlertsContainer />
      </div>
    </NotificationProvider>
  );
}
