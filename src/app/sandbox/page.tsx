"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSandboxStore } from "@/store/sandboxStore";
import { Target, Zap, Crown } from "lucide-react";

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
      router.replace("/sandbox/dashboard");
    }
  }, [sandboxPlan, router]);

  function handleSelect(plan: "BASIC" | "MASTERS" | "LEGENDS") {
    setSandboxPlan(plan);
    router.push("/sandbox/dashboard");
  }

  return (
    <div className="min-h-screen bg-base-200 px-4 py-8 md:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-2xl md:text-3xl font-bold text-base-content">
            Sandbox Mode
          </h1>
          <p className="text-base-content/70 mt-2">
            Select a plan to view real data from other users on that plan
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map(({ id, name, icon: Icon, desc }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleSelect(id)}
              className="card bg-base-100 border cursor-pointer border-base-300 hover:border-primary hover:shadow-lg transition-all text-left"
            >
              <div className="card-body">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="card-title text-lg">{name}</h2>
                </div>
                <p className="text-sm text-base-content/70">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
