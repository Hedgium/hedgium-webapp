export type SandboxPlan = "BASIC" | "MASTERS" | "LEGENDS";

export type SandboxE1Risk = "LOW" | "MEDIUM" | "HIGH";

export type SandboxPhase = "before" | "after";

export type SandboxPeriodMetrics = {
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

export type SandboxDashboard = {
  configured: boolean;
  plan?: SandboxPlan;
  detail?: string;
  notional_capital?: number;
  showcase_start?: string;
  doj?: string;
  e1_risk?: SandboxE1Risk;
  before_joining?: SandboxPeriodMetrics;
  after_joining?: SandboxPeriodMetrics;
  combined?: {
    e2_pnl: number;
    e2_realised: number;
    e2_m2m: number;
    e1: number;
    roi_value: number;
    roi_percent: number;
  };
};

export type SandboxTradeCycle = {
  id: number;
  name: string;
  description: string;
  state: string;
  sub_state: string;
  created_at: string;
  updated_at?: string;
};

export type SandboxTradeCycleListResponse = {
  count: number;
  configured: boolean;
  page: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  next: string | null;
  previous: string | null;
  results: SandboxTradeCycle[];
};
