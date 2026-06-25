export type TradeCycleAllocationSummary = {
  all_time: number;
  last_year: number;
  last_month: number;
  last_week: number;
  today: number;
};

export type TradeCycleAllocationSummaryResponse = {
  allocation_summary: TradeCycleAllocationSummary;
};
