export interface PositionGreeksSnapshot {
  greek_delta?: number | string | null;
  greek_gamma?: number | string | null;
  greek_theta?: number | string | null;
  greek_vega?: number | string | null;
  greek_updated_at?: string | null;
  greek_source?: string | null;
  greek_spot?: number | string | null;
}

export interface LivePosition {
  tradingsymbol: string;
  exchange?: string;
  /** Broker may expose last update / day position time when available */
  last_price_update?: string;
  updated_at?: string;
  quantity: number;
  average_price?: number;
  last_price?: number;
  pnl?: number;
  buy_quantity?: number;
  sell_quantity?: number;
  realised?: number;
  realised_total?: number;
  unrealised_total?: number;
  /** Broker live API (e.g. Zerodha) — may be set when unrealised_total is not */
  unrealised?: number;
}

export interface LivePositionsData {
  status: string;
  data?: {
    net: LivePosition[];
  };
}

export interface LiveHolding {
  tradingsymbol: string;
  exchange?: string;
  quantity: number;
  available_quantity?: number;
  average_price?: number;
  last_price?: number;
  close_price?: number;
  pnl?: number;
  current_value?: number;
}
