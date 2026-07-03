"use client";

import { useEffect } from "react";
import { FlaskConical } from "lucide-react";
import SandboxPageShell from "@/components/sandbox/SandboxPageShell";
import SandboxPlanSelector from "@/components/sandbox/SandboxPlanSelector";
import SandboxPositionsContent from "@/components/sandbox/SandboxPositionsContent";
import { useSandboxStore } from "@/store/sandboxStore";

export default function SandboxPage() {
  const { sandboxPlan, setSandboxPlan, hydrate } = useSandboxStore();

  useEffect(() => {
    hydrate();
    if (!useSandboxStore.getState().sandboxPlan) {
      setSandboxPlan("BASIC");
    }
  }, [hydrate, setSandboxPlan]);

  return (
    <SandboxPageShell maxWidth="6xl">
      <div className="space-y-8">
        <header className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-6 w-6 text-primary" aria-hidden />
              <h1 className="text-2xl font-bold tracking-tight text-base-content md:text-3xl">
                Sandbox
              </h1>
            </div>
            <p className="text-sm text-base-content/70">
              Explore illustrative performance on a reference account for your plan tier.
            </p>
          </div>
          <SandboxPlanSelector />
        </header>
        {sandboxPlan ? <SandboxPositionsContent /> : null}
      </div>
    </SandboxPageShell>
  );
}
