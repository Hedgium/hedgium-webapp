export interface LiveOrderHistoryRow {
  order_id?: string;
  exchange_order_id?: string;
  status?: string;
  order_timestamp?: string;
  exchange_timestamp?: string;
  exchange?: string | null;
  tradingsymbol?: string | null;
  order_type?: string;
  transaction_type?: string;
  product?: string;
  quantity?: number;
  price?: number;
  average_price?: number;
  filled_quantity?: number;
  pending_quantity?: number;
  cancelled_quantity?: number;
  trigger_price?: number;
  validity?: string;
  variety?: string;
  rejection_reason?: string | null;
  status_message?: string | null;
}

export interface LiveOrderHistoryResponse {
  status: string;
  message?: string;
  detail?: string;
  error_message?: string;
  data?: LiveOrderHistoryRow[];
}
