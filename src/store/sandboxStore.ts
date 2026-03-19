import { create } from "zustand";

export type SandboxPlan = "BASIC" | "MASTERS" | "LEGENDS";

const STORAGE_KEY = "hedgium_sandbox_plan";

interface SandboxState {
  sandboxPlan: SandboxPlan | null;
  setSandboxPlan: (plan: SandboxPlan | null) => void;
  clearSandboxPlan: () => void;
  hydrate: () => void;
}

export const useSandboxStore = create<SandboxState>((set) => ({
  sandboxPlan: null,

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

  clearSandboxPlan: () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(STORAGE_KEY);
    }
    set({ sandboxPlan: null });
  },
}));
