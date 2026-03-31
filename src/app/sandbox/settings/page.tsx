"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Palette, ChevronLeft, CreditCard, Target, Zap, Crown } from "lucide-react";
import { useTheme } from "next-themes";
import ThemeTab from "@/components/settings/ThemeTab";
import SandboxPageShell from "@/components/sandbox/SandboxPageShell";
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
    router.push("/sandbox/home");
  }

  if (!sandboxPlan) return null;

  return (
    <SandboxPageShell maxWidth="6xl" contentClassName="py-8">
      <div className="flex items-start gap-2 pb-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn btn-ghost btn-circle shrink-0"
          aria-label="Go back"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-base-content">Sandbox settings</h1>
          <p className="mt-1 max-w-xl text-sm text-base-content/55">
            Appearance and which sample plan you are browsing.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="lg:w-1/4">
          <div className="card sticky top-24 border border-base-300/70 bg-base-100/90 backdrop-blur-sm card-hover">
            <ul className="menu menu-vertical w-full space-y-1 px-1 py-2">
              <li>
                <button
                  type="button"
                  className={`rounded-lg ${activeTab === "theme" ? "bg-base-200/80 text-primary" : ""}`}
                >
                  <Palette className="h-5 w-5" />
                  Theme
                </button>
              </li>
              <li>
                <div className="flex items-center gap-2 px-4 py-3 text-sm text-base-content/65">
                  <CreditCard className="h-5 w-5 shrink-0" />
                  <span>
                    Plan:{" "}
                    <span className="font-medium text-base-content">
                      {PLANS.find((p) => p.id === sandboxPlan)?.name ?? sandboxPlan}
                    </span>
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="space-y-6 lg:w-3/4">
          <ThemeTab theme={theme} setTheme={setTheme} />
          <div className="rounded-2xl border border-base-300/60 bg-base-100/80 p-6 backdrop-blur-sm md:p-8">
            <h2 className="text-xl font-semibold tracking-tight text-base-content md:text-2xl">Plan</h2>
            <p className="mt-2 text-sm leading-relaxed text-base-content/55">
              You are viewing anonymised data from other users on the{" "}
              <span className="font-semibold text-primary">
                {PLANS.find((p) => p.id === sandboxPlan)?.name ?? sandboxPlan}
              </span>{" "}
              tier. Switch to compare sample data across plans.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {PLANS.map(({ id, name, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handlePlanChange(id)}
                  className={`btn gap-2 rounded-xl ${sandboxPlan === id ? "btn-primary shadow-lg shadow-primary/15" : "btn-outline border-base-300/70"}`}
                >
                  <Icon className="h-4 w-4" />
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SandboxPageShell>
  );
}
