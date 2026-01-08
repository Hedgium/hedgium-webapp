"use client";

import { useAuthStore } from "@/store/authStore";
import AdminSidebar from "@/components/admin/Sidebar";
import NotificationProvider from '@/providers/NotificationProvider';
import AuthInitializingProvider from "@/components/AuthInitializing";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();

  return (
    <NotificationProvider>
      <AuthInitializingProvider requireAuth={true}>
        {!user?.is_staff ? (
          <div className="p-4">Access Denied: Admins Only</div>
        ) : (
          <div className="flex flex-col h-screen">
            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar - visible on md+ */}
              <aside className="hidden md:flex md:flex-col md:shrink-0 bg-base-200 border-r border-base-300 rounded-box overflow-hidden">
                <AdminSidebar />
              </aside>

              {/* Main content */}
              <main className="flex-1 bg-base-200 overflow-y-auto flex flex-col">
                <div className="flex-1">{children}</div>
              </main>
            </div>
          </div>
        )}
      </AuthInitializingProvider>
    </NotificationProvider>
  );
}
