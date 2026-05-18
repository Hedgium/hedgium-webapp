"use client";

import { useEffect } from "react";
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
      <SandboxPlanSelector />
      {sandboxPlan ? <SandboxPositionsContent /> : null}
    </SandboxPageShell>
  );
}
