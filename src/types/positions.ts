export interface LivePosition {
  tradingsymbol: string;
  exchange?: string;
  quantity: number;
  average_price?: number;
  last_price?: number;
  pnl?: number;
  buy_quantity?: number;
  sell_quantity?: number;
  realised?: number;
  realised_total?: number;
  unrealised_total?: number;
}

export interface LivePositionsData {
  status: string;
  data?: {
    net: LivePosition[];
  };
}
