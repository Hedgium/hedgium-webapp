"use client";

import { useEffect } from "react";
import AuthNav from "@/components/AuthNav";
import AuthFooter from "@/components/AuthFooter";
import NotificationProvider from "@/providers/NotificationProvider";
import { useSandboxStore } from "@/store/sandboxStore";

const BANNER =
  "Sandbox — illustrative performance from a reference account on the selected plan tier. E1 is simulated; E2 is from that reference account, for demonstration only. Past performance does not guarantee future results.";

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
      <div className="flex h-screen flex-col">
        <div className="shrink-0 border-b border-primary/20 bg-gradient-to-r from-primary/12 via-primary/8 to-secondary/10 px-4 py-2.5 text-center text-xs leading-snug text-base-content/90 backdrop-blur-sm md:text-xs">
          {BANNER}
        </div>
        <main className="flex flex-1 flex-col overflow-y-auto bg-base-200">
          <AuthNav />
          <div className="flex-1">{children}</div>
          <AuthFooter />
        </main>
      </div>
    </NotificationProvider>
  );
}
