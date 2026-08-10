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
