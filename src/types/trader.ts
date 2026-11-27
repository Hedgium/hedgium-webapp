import type { StrategyBuilder, StrategyTemplate } from "@/types/builder";

export type TraderView = "builder" | "strategies" | "profiles" | "alerts";
export type BuilderTab = "create" | "active" | "others";
export type MarketViewOption = "BULLISH" | "BEARISH" | "NEUTRAL" | "OTHER" | "CUSTOM";

export interface TraderProfile {
  id: number;
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  broker_name?: string | null;
  margin_equity?: number | null;
  is_active: boolean;
  ready_for_trade: boolean;
  strategies_paused: boolean;
  risk_profile?: string | null;
}

export interface TraderSubscription {
  id: number;
  client_id: number;
  client_username: string;
  client_first_name: string;
  status: "pending" | "active" | "ended" | string;
  profiles: TraderProfile[];
  created_at: string;
}

export interface TraderInvite {
  id: number;
  code: string;
  expires_at?: string | null;
  max_uses: number;
  use_count: number;
  created_at: string;
  join_path: string;
}

export interface AcceptInviteResult {
  subscription_id: number;
  status: string;
  trader_id: number;
  trader_username: string;
}

export interface TraderStrategyRow {
  id: number;
  name: string;
  description?: string | null;
  margin_required: number;
  created_at: string;
  is_active: boolean;
  builder_id?: number | null;
  builder_status?: string | null;
  completed: boolean;
  completed_at?: string | null;
  wpnl_total?: number | null;
  mid_wpnl_total?: number | null;
  atm_spread?: number | null;
  pnl_total?: number | null;
  last_version?: number | null;
  last_approved?: boolean | null;
  last_completed?: boolean | null;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type { StrategyBuilder, StrategyTemplate };
