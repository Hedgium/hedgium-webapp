"use client";

import { useEffect } from "react";
import { FlaskConical } from "lucide-react";
import SimulationPageShell from "@/components/simulation/SimulationPageShell";
import SimulationPlanSelector from "@/components/simulation/SimulationPlanSelector";
import SimulationPositionsContent from "@/components/simulation/SimulationPositionsContent";
import { useSimulationStore } from "@/store/simulationStore";

export default function SimulationPage() {
  const { simulationPlan, setSimulationPlan, hydrate } = useSimulationStore();

  useEffect(() => {
    hydrate();
    if (!useSimulationStore.getState().simulationPlan) {
      setSimulationPlan("BASIC");
    }
  }, [hydrate, setSimulationPlan]);

  return (
    <SimulationPageShell maxWidth="6xl">
      <div className="space-y-8">
        <header className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-6 w-6 text-primary" aria-hidden />
              <h1 className="text-2xl font-bold tracking-tight text-base-content md:text-3xl">
                Simulation
              </h1>
            </div>
            <p className="text-sm text-base-content/70">
              Explore illustrative performance on a reference account for your plan tier.
            </p>
          </div>
          <SimulationPlanSelector />
        </header>
        {simulationPlan ? <SimulationPositionsContent /> : null}
      </div>
    </SimulationPageShell>
  );
}
