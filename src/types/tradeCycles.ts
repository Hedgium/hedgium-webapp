export type TradeCycleAllocationSummary = {
  week?: string;
  month?: string;
  quarter?: string;
  fy?: string;
  week_count?: number;
  month_count?: number;
  quarter_count?: number;
  ytd_count?: number;
  all_time: number;
};

export type TradeCycleAllocationSummaryResponse = {
  allocation_summary: TradeCycleAllocationSummary;
};

export type SpotByUnderlying = Record<string, number>;

/** Strategy-cached book metrics nested on `GET trade-cycles/`. */
export type TradeCycleStrategyMetrics = {
  greek_delta?: number | string | null;
  greek_gamma?: number | string | null;
  greek_updated_at?: string | null;
  greek_delta_by_underlying?: SpotByUnderlying | null;
  greek_spot_by_underlying?: SpotByUnderlying | null;
  atm_spread?: number | string | null;
  spread_updated_at?: string | null;
  wpnl_total?: number | string | null;
  mid_wpnl_total?: number | string | null;
  wpnl_updated_at?: string | null;
};

/** Current-month list row from `GET trade-cycles/`. */
export type TradeCycleListItem = {
  id: number;
  name: string;
  description: string | null;
  state: string;
  sub_state: string;
  created_at: string;
  pnl_total?: number | string | null;
  pnl_updated_at?: string | null;
  greek_delta?: number | string | null;
  greek_gamma?: number | string | null;
  greek_updated_at?: string | null;
  greek_delta_by_underlying?: SpotByUnderlying | null;
  greek_spot_by_underlying?: SpotByUnderlying | null;
  atm_spread?: number | string | null;
  spread_updated_at?: string | null;
  wpnl_total?: number | string | null;
  mid_wpnl_total?: number | string | null;
  wpnl_updated_at?: string | null;
  strategy?: TradeCycleStrategyMetrics | null;
};

export type TradeCycleListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: TradeCycleListItem[];
};
