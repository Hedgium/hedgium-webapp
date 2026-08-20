export const ENGINE1_RISKS = ["LOW", "MEDIUM", "HIGH"] as const;
export const ENGINE1_HOLDING_PERIODS = ["LT_1Y", "Y1_2", "Y3_PLUS"] as const;

export type Engine1Risk = (typeof ENGINE1_RISKS)[number];
export type Engine1HoldingPeriod = (typeof ENGINE1_HOLDING_PERIODS)[number];

export const ENGINE1_RISK_LABELS: Record<Engine1Risk, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const ENGINE1_HOLDING_PERIOD_LABELS: Record<Engine1HoldingPeriod, string> = {
  LT_1Y: "< 1 year",
  Y1_2: "1-2 years",
  Y3_PLUS: "3+ years",
};

export interface Engine1AssetClass {
  id: number;
  slug: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}

export interface Engine1GridCell {
  id: number;
  risk: Engine1Risk;
  holding_period: Engine1HoldingPeriod;
  asset_class_id: number;
  percent: number;
}

export interface Engine1Grid {
  cash_reserve_pct: number;
  cells: Engine1GridCell[];
  asset_classes: Engine1AssetClass[];
}

export interface Engine1Instrument {
  id: number;
  asset_class_id: number;
  asset_class_name: string;
  tradingsymbol: string;
  exchange: string;
  weight_in_class: number;
  is_active: boolean;
  sort_order: number;
}

export interface Engine1InstrumentDraft {
  id?: number;
  tradingsymbol: string;
  exchange: string;
  weight_in_class: number;
  is_active: boolean;
  sort_order: number;
}

export interface Engine1PreviewClassRow {
  id: number;
  slug: string;
  name: string;
  percent: number;
  amount: number;
}

export interface Engine1PreviewInstrumentRow {
  instrument_id: number;
  tradingsymbol: string;
  exchange: string;
  asset_class_id: number;
  asset_class_name: string;
  weight_in_class: number;
  portfolio_weight_pct: number;
  amount: number;
  price: number | null;
  lot_size: number;
  quantity: number;
  notional: number;
  skip_reason: string | null;
}

export interface Engine1Preview {
  risk_profile: string;
  holding_period: string;
  allocation_amount: number;
  cash_reserve_pct: number;
  cash_reserve: number;
  allocatable: number;
  asset_classes: Engine1PreviewClassRow[];
  instruments: Engine1PreviewInstrumentRow[];
  unallocated_cash: number;
}

export interface Engine1ExecuteResultRow {
  tradingsymbol: string;
  exchange: string;
  quantity: number;
  price: number | null;
  status: "success" | "skipped" | "error" | string;
  broker_order_id: string | null;
  error: string | null;
}

export interface Engine1Execute extends Engine1Preview {
  results: Engine1ExecuteResultRow[];
  executed_at: string;
}

export interface Engine1PreviewPayload {
  holding_period: Engine1HoldingPeriod;
  allocation_amount: number;
}
