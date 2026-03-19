"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Palette, ChevronLeft, CreditCard, Target, Zap, Crown } from "lucide-react";
import { useTheme } from "next-themes";
import ThemeTab from "@/components/settings/ThemeTab";
import { useSandboxStore, type SandboxPlan } from "@/store/sandboxStore";

const PLANS: { id: SandboxPlan; name: string; icon: React.ElementType }[] = [
  { id: "BASIC", name: "Basic", icon: Target },
  { id: "MASTERS", name: "Masters", icon: Zap },
  { id: "LEGENDS", name: "Legends", icon: Crown },
];

export default function SandboxSettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { sandboxPlan, setSandboxPlan } = useSandboxStore();
  const [activeTab] = useState<string>("theme");

  useEffect(() => {
    if (!sandboxPlan) {
      router.replace("/sandbox");
    }
  }, [sandboxPlan, router]);

  function handlePlanChange(plan: SandboxPlan) {
    setSandboxPlan(plan);
    router.push("/sandbox/dashboard");
  }

  if (!sandboxPlan) return null;

  return (
    <div className="min-h-screen flex flex-col px-4 md:px-8 py-8">
      <div className="max-w-6xl mx-auto w-full">
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.back()}
            className="btn btn-ghost btn-circle mr-2"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-3xl font-bold text-base-content">Sandbox Settings</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/4">
            <div className="card bg-base-100 border border-base-300 card-hover sticky top-24">
              <ul className="menu menu-vertical space-y-2 w-full">
                <li>
                  <button className={activeTab === "theme" ? "text-primary" : ""}>
                    <Palette className="h-5 w-5" />
                    Theme
                  </button>
                </li>
                <li>
                  <div className="flex items-center gap-2 px-4 py-2 text-base-content/70">
                    <CreditCard className="h-5 w-5" />
                    <span>Plan: {PLANS.find((p) => p.id === sandboxPlan)?.name ?? sandboxPlan}</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="lg:w-3/4 space-y-6">
            <ThemeTab theme={theme} setTheme={setTheme} />
            <div className="card bg-base-100 border border-base-300 p-6">
              <h2 className="text-2xl font-bold mb-2">Plan</h2>
              <p className="text-base-content/70 mb-4">
                You are viewing real data from other users on the{" "}
                <span className="font-semibold text-primary">
                  {PLANS.find((p) => p.id === sandboxPlan)?.name ?? sandboxPlan}
                </span>{" "}
                plan. Change the plan below to view data from a different plan.
              </p>
              <div className="flex flex-wrap gap-3">
                {PLANS.map(({ id, name, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handlePlanChange(id)}
                    className={`btn gap-2 ${sandboxPlan === id ? "btn-primary" : "btn-outline"}`}
                  >
                    <Icon className="w-4 h-4" />
                    {name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
