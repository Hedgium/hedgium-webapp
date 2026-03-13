"use client";

import AuthNav from "@/components/AuthNav";
import AuthFooter from "@/components/AuthFooter";
import AuthNavigation from "@/components/AuthNavigation";
import NotificationProvider from '@/providers/NotificationProvider';
import AuthInitializingProvider from "@/components/AuthInitializing";

import BrokerConnect from "@/components/BrokerConnect";


export default function Layout({ children }: { children: React.ReactNode }) {
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
