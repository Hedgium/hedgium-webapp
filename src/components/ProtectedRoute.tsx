"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { accessToken, isInitializing } = useAuthStore();
  const router = useRouter();
    const pathname = usePathname();


  useEffect(() => {
    if (!isInitializing && !accessToken) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);

    }
  }, [isInitializing, accessToken, router]);

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-10 w-10 border-2 border-blue-600 rounded-full border-t-transparent" />
      </div>
    );
  }

  if (!accessToken) return null;

  return <>{children}</>;
}

