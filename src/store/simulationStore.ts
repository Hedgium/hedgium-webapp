import { create } from "zustand";
import type { SimulationE1Risk } from "@/types/simulation";

export type SimulationPlan = "BASIC" | "MASTERS" | "LEGENDS";

const STORAGE_KEY = "hedgium_simulation_plan";

interface SimulationState {
  simulationPlan: SimulationPlan | null;
  simulationE1Risk: SimulationE1Risk;
  setSimulationPlan: (plan: SimulationPlan | null) => void;
  setSimulationE1Risk: (risk: SimulationE1Risk) => void;
  clearSimulationPlan: () => void;
  hydrate: () => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  simulationPlan: null,
  simulationE1Risk: "MEDIUM",

  hydrate: () => {
    if (typeof window === "undefined") return;
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored && ["BASIC", "MASTERS", "LEGENDS"].includes(stored)) {
      set({ simulationPlan: stored as SimulationPlan });
    }
  },

  setSimulationPlan: (plan) => {
    if (typeof window !== "undefined") {
      if (plan) {
        sessionStorage.setItem(STORAGE_KEY, plan);
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
    set({ simulationPlan: plan });
  },

  setSimulationE1Risk: (risk) => {
    set({ simulationE1Risk: risk });
  },

  clearSimulationPlan: () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(STORAGE_KEY);
    }
    set({ simulationPlan: null });
  },
}));
