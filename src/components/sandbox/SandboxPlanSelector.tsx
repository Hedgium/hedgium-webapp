"use client";

import Link from "next/link";
import { useSandboxStore, type SandboxPlan } from "@/store/sandboxStore";

const PLANS: { id: SandboxPlan; label: string }[] = [
  { id: "BASIC", label: "25L" },
  { id: "MASTERS", label: "25L to 75L" },
  { id: "LEGENDS", label: "75L+" },
];

export default function SandboxPlanSelector() {
  const { sandboxPlan, setSandboxPlan } = useSandboxStore();
  const value = sandboxPlan ?? "BASIC";

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <label htmlFor="sandbox-plan" className="text-sm font-medium text-base-content/70">
          Plan
        </label>
        <select
          id="sandbox-plan"
          className="select select-bordered select-sm w-auto min-w-[11rem]"
          value={value}
          onChange={(e) => setSandboxPlan(e.target.value as SandboxPlan)}
          aria-label="Sandbox plan"
        >
          {PLANS.map(({ id, label }) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <Link href="/home" className="btn btn-sm btn-outline">
        Exit sandbox
      </Link>
    </div>
  );
}
