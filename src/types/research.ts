export type Probabilities = {
  bullish: number;
  bearish: number;
  sideways: number;
};

export type NewsSummary = {
  positive: number;
  neutral: number;
  negative: number;
};

export type HoldingOutlook = {
  horizon_days: string;
  stance: string;
};

export type MarketData = {
  ohlcv_bars: number;
  latest_date: string;
  latest_close: number;
  latest_delivery_pct?: number | null;
  sector_return_20d?: number | null;
  fii_net?: number | null;
  dii_net?: number | null;
};

export type FeatureSummary = {
  as_of_date?: string | null;
  technical?: Record<string, unknown> | null;
  volatility?: Record<string, unknown> | null;
  fundamental?: Record<string, unknown> | null;
  corporate_risk?: Record<string, unknown> | null;
};

export type AgentBlock = {
  summary?: string;
  raw_summary?: string;
  signals?: string[];
  concerns?: string[];
  [key: string]: unknown;
};

export type AgentInsights = {
  provider: string;
  enabled: boolean;
  elapsed_ms: number;
  fallback_used?: boolean;
  technical: AgentBlock;
  fundamental: AgentBlock;
  news: AgentBlock;
  governance: AgentBlock;
  master: AgentBlock;
  news_counts?: NewsSummary;
};

export type RiskRule = {
  code?: string;
  severity?: string;
  weight?: number;
  message?: string;
  evidence?: string | Record<string, unknown>;
};

export type PerModelProbabilities = {
  version?: string;
  bullish: number;
  bearish: number;
  sideways: number;
};

export type ResearchReport = {
  symbol: string;
  company_name: string;
  probabilities: Probabilities;
  confidence_score: number;
  risk_level: string;
  key_positive_factors: string[];
  risk_factors: string[];
  news_summary: NewsSummary;
  holding_outlook: HoldingOutlook;
  generated_at: string;
  status: string;
  market_data?: MarketData | null;
  features?: FeatureSummary | null;
  model_version?: string | null;
  risk_score?: number | null;
  risk_rules?: RiskRule[] | null;
  agent_insights?: AgentInsights | null;
  per_model?: Record<string, PerModelProbabilities> | null;
};
