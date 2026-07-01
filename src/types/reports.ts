export type ReportsScope =
  | { mode: "client" }
  | { mode: "admin"; profileId: string };

export type PnlPeriodSummary = {
  all_time?: number;
  last_year?: number;
  last_month?: number;
  last_week?: number;
  today?: number;
};

export type AllocationSummary = {
  all_time?: number;
  last_year?: number;
  last_month?: number;
  last_week?: number;
  today?: number;
};

export type TradeCycleReport = {
  id: number;
  name: string;
  description: string | null;
  state: string;
  sub_state: string;
  created_at: string;
  updated_at: string;
  pnl: number;
  strategy_id?: number | null;
  strategy_name?: string | null;
};

export type TradeCycleReportsResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: TradeCycleReport[];
  summary: { total_count: number; pnl_total: number };
};

export type MarginSnapshotRow = {
  snapshot_date: string;
  net: number;
  available?: number;
  utilised?: number;
};
