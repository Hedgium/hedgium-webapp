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

/** PnL summary from `positions/pnl/summary/` (current periods; E2 + optional E1/combined). */
export type E2PnlSummary = {
  week: string;
  month: string;
  quarter: string;
  fy: string;
  pnl_inception_date?: string | null;
  e1_hedgium_managed?: boolean;
  week_pnl: number;
  week_pnl_pct?: number | null;
  /** Current calendar month E2 PnL */
  pnl: number;
  pnl_pct?: number | null;
  quarter_pnl: number;
  quarter_pnl_pct?: number | null;
  ytd_pnl: number;
  ytd_pnl_pct?: number | null;
  ytd_charges?: number;
  all_time_pnl: number;
  all_time_pnl_pct?: number | null;
  all_time_charges?: number;
  week_charges?: number;
  /** Current calendar month E2 statutory charges */
  charges?: number;
  quarter_charges?: number;
  m2m?: number;
  realised?: number;
  ytd_m2m?: number;
  ytd_realised?: number;
  e1_week_pnl?: number | null;
  e1_week_pnl_pct?: number | null;
  e1_week_realised?: number | null;
  e1_week_mtm?: number | null;
  e1_month_pnl?: number | null;
  e1_month_pnl_pct?: number | null;
  e1_month_realised?: number | null;
  e1_month_mtm?: number | null;
  e1_quarter_pnl?: number | null;
  e1_quarter_pnl_pct?: number | null;
  e1_quarter_realised?: number | null;
  e1_quarter_mtm?: number | null;
  e1_ytd_pnl?: number | null;
  e1_ytd_pnl_pct?: number | null;
  e1_ytd_realised?: number | null;
  e1_ytd_mtm?: number | null;
  e1_all_time_pnl?: number | null;
  e1_all_time_pnl_pct?: number | null;
  e1_all_time_realised?: number | null;
  e1_all_time_mtm?: number | null;
  combined_week_pnl?: number | null;
  combined_week_pnl_pct?: number | null;
  combined_month_pnl?: number | null;
  combined_month_pnl_pct?: number | null;
  combined_quarter_pnl?: number | null;
  combined_quarter_pnl_pct?: number | null;
  combined_ytd_pnl?: number | null;
  combined_ytd_pnl_pct?: number | null;
  combined_all_time_pnl?: number | null;
  combined_all_time_pnl_pct?: number | null;
};

export type AllocationSummary = {
  week: string;
  month: string;
  quarter: string;
  fy: string;
  week_count: number;
  month_count: number;
  quarter_count: number;
  ytd_count: number;
  all_time: number;
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
  charges?: number;
  strategy_id?: number | null;
  strategy_name?: string | null;
};

export type TradeCycleReportsResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: TradeCycleReport[];
  summary: { total_count: number; pnl_total: number; charges_total?: number };
};

export type MarginSnapshotRow = {
  snapshot_date: string;
  net: number;
  available?: number;
  utilised?: number;
};
