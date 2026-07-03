"use client";

import Link from "next/link";
import { useSandboxStore, type SandboxPlan } from "@/store/sandboxStore";

const PLANS: { id: SandboxPlan; label: string }[] = [
  { id: "BASIC", label: "25L" },
  { id: "MASTERS", label: "50L" },
  { id: "LEGENDS", label: "1 Cr" },
];

export default function SandboxPlanSelector() {
  const { sandboxPlan, setSandboxPlan } = useSandboxStore();
  const value = sandboxPlan ?? "BASIC";

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-base-300 bg-base-100/60 px-4 py-3 backdrop-blur-sm md:px-5 md:py-4">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="sandbox-plan" className="text-sm font-medium text-base-content/80">
          Capital
        </label>
        <select
          id="sandbox-plan"
          className="select select-bordered select-sm h-9 min-h-9 w-auto min-w-[11rem] border-base-300 bg-base-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          value={value}
          onChange={(e) => setSandboxPlan(e.target.value as SandboxPlan)}
        >
          {PLANS.map(({ id, label }) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <Link href="/home" className="btn btn-sm btn-outline border-base-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100">
        Exit sandbox
      </Link>
    </div>
  );
}
