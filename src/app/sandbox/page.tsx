"use client";

import React, { useEffect } from "react";

import { useRouter } from "nextjs-toploader/app";
import { useSandboxStore } from "@/store/sandboxStore";
import { Target, Zap, Crown, Sparkles } from "lucide-react";
import SandboxPageShell from "@/components/sandbox/SandboxPageShell";

const PLANS = [
  { id: "BASIC" as const, name: "Basic", icon: Target, desc: "Entry-level strategies" },
  { id: "MASTERS" as const, name: "Masters", icon: Zap, desc: "Advanced strategies" },
  { id: "LEGENDS" as const, name: "Legends", icon: Crown, desc: "Premium strategies" },
];

export default function SandboxPlanSelectPage() {
  const router = useRouter();
  const { sandboxPlan, setSandboxPlan } = useSandboxStore();

  useEffect(() => {
    if (sandboxPlan) {
      router.replace("/sandbox/home");
    }
  }, [sandboxPlan, router]);

  function handleSelect(plan: "BASIC" | "MASTERS" | "LEGENDS") {
    setSandboxPlan(plan);
    router.push("/sandbox/home");
  }

  return (
    <SandboxPageShell maxWidth="3xl" contentClassName="py-10 md:py-12">
      <div className="space-y-10 text-center">
        <div className="space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 shadow-inner">
            <Sparkles className="h-7 w-7 text-primary" aria-hidden />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-base-content md:text-3xl">
            Sandbox mode
          </h1>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-base-content/60 md:text-base">
            Choose a plan to explore anonymised real data from other users on that tier — same layout as the main app.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
          {PLANS.map(({ id, name, icon: Icon, desc }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleSelect(id)}
              className="group relative overflow-hidden cursor-pointer rounded-2xl border border-base-300/70 bg-base-100/90 p-5 text-left shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md"
            >
              <div
                className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5 opacity-0 blur-2xl transition-opacity group-hover:opacity-100"
                aria-hidden
              />
              <div className="relative flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-base-300/60 bg-base-200/50">
                    <Icon className="h-6 w-6 text-primary" aria-hidden />
                  </div>
                  <h2 className="text-lg font-semibold text-base-content">{name}</h2>
                </div>
                <p className="text-sm leading-relaxed text-base-content/55">{desc}</p>
                <span className="text-xs font-medium text-primary">Continue →</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </SandboxPageShell>
  );
}
