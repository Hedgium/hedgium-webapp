import { create } from "zustand";
import type { SandboxE1Risk } from "@/types/sandbox";

export type SandboxPlan = "BASIC" | "MASTERS" | "LEGENDS";

const STORAGE_KEY = "hedgium_sandbox_plan";

interface SandboxState {
  sandboxPlan: SandboxPlan | null;
  sandboxE1Risk: SandboxE1Risk;
  setSandboxPlan: (plan: SandboxPlan | null) => void;
  setSandboxE1Risk: (risk: SandboxE1Risk) => void;
  clearSandboxPlan: () => void;
  hydrate: () => void;
}

export const useSandboxStore = create<SandboxState>((set) => ({
  sandboxPlan: null,
  sandboxE1Risk: "MEDIUM",

  hydrate: () => {
    if (typeof window === "undefined") return;
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored && ["BASIC", "MASTERS", "LEGENDS"].includes(stored)) {
      set({ sandboxPlan: stored as SandboxPlan });
    }
  },

  setSandboxPlan: (plan) => {
    if (typeof window !== "undefined") {
      if (plan) {
        sessionStorage.setItem(STORAGE_KEY, plan);
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
    set({ sandboxPlan: plan });
  },

  setSandboxE1Risk: (risk) => {
    set({ sandboxE1Risk: risk });
  },

  clearSandboxPlan: () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(STORAGE_KEY);
    }
    set({ sandboxPlan: null });
  },
}));
