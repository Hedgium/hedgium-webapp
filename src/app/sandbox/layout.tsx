"use client";

import { useEffect } from "react";
import AuthNav from "@/components/AuthNav";
import AuthFooter from "@/components/AuthFooter";
import SandboxNavigation from "@/components/SandboxNavigation";
import NotificationProvider from "@/providers/NotificationProvider";
import AuthInitializingProvider from "@/components/AuthInitializing";
import { useSandboxStore } from "@/store/sandboxStore";

const BANNER =
  "Sandbox — sample data from other users on this plan. Past performance does not guarantee future results.";

export default function SandboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hydrate = useSandboxStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
      <NotificationProvider>
        <AuthInitializingProvider requireAuth={true}>
          <div className="flex flex-col h-screen">
            <div className="shrink-0 border-b border-primary/20 bg-gradient-to-r from-primary/12 via-primary/8 to-secondary/10 px-4 py-2.5 text-center text-xs font-medium leading-snug text-base-content/90 backdrop-blur-sm md:text-sm">
              {BANNER}
            </div>
            <div className="flex flex-1 overflow-hidden">
              <aside className="hidden md:flex md:flex-col md:w-56 md:shrink-0 bg-base-200 border-r border-base-300 rounded-box">
                <SandboxNavigation sidebar />
              </aside>
              <main className="flex-1 bg-base-200 overflow-y-auto flex flex-col">
                <AuthNav />
                <div className="flex-1">{children}</div>
                <AuthFooter />
              </main>
            </div>
            <div className="md:hidden">
              <SandboxNavigation />
            </div>
          </div>
        </AuthInitializingProvider>
      </NotificationProvider>
  );
}
