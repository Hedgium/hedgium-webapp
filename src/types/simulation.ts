export type SimulationPlan = "BASIC" | "MASTERS" | "LEGENDS";

export type SimulationE1Risk = "LOW" | "MEDIUM" | "HIGH";

export type SimulationPhase = "before" | "after";

export type SimulationPeriodMetrics = {
  e2_pnl: number;
  e2_realised: number;
  e2_m2m: number;
  e1: number;
  roi_value: number;
  roi_percent: number;
  from: string;
  to: string;
  has_cycles?: boolean;
};

export type SimulationDashboard = {
  configured: boolean;
  plan?: SimulationPlan;
  detail?: string;
  notional_capital?: number;
  showcase_start?: string;
  doj?: string;
  e1_risk?: SimulationE1Risk;
  before_joining?: SimulationPeriodMetrics;
  after_joining?: SimulationPeriodMetrics;
  combined?: {
    e2_pnl: number;
    e2_realised: number;
    e2_m2m: number;
    e1: number;
    roi_value: number;
    roi_percent: number;
  };
};

export type SimulationTradeCycle = {
  id: number;
  name: string;
  description: string;
  state: string;
  sub_state: string;
  created_at: string;
  updated_at?: string;
};

export type SimulationTradeCycleListResponse = {
  count: number;
  configured: boolean;
  page: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  next: string | null;
  previous: string | null;
  results: SimulationTradeCycle[];
};
