"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import AdminSidebar from "@/components/admin/Sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { accessToken, isInitializing, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect if user is not logged in
  useEffect(() => {
    if (!isInitializing && !accessToken) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isInitializing, accessToken, router, pathname]);

  if (!accessToken) return null; // Show nothing until auth is ready

  if (!user?.is_staff) {
    return <div className="p-4">Access Denied: Admins Only</div>;
  }

  return (
    <div className="flex flex-col h-screen">

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - visible on md+ */}
        <aside className="hidden md:flex md:flex-col md:w-56 md:shrink-0 bg-base-200 border-r border-base-300 rounded-box">
          <AdminSidebar />
        </aside>

        {/* Main content */}
        <main className="flex-1 bg-base-200 overflow-y-auto flex flex-col">
          <div className="flex-1">{children}</div>
        </main>
      </div>

      
    </div>
  );
}
