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
