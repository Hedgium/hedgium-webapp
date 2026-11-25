export interface MutualFundInstrumentOption {
  id: number;
  tradingsymbol: string;
  name: string;
  amc?: string;
  last_price?: number | null;
  last_price_date?: string | null;
  scheme_type?: string;
  plan?: string;
}

export interface ManualMutualFundLot {
  id: number;
  profile_id: number;
  instrument_id: number;
  tradingsymbol: string;
  scheme_name: string;
  amc?: string;
  purchase_date: string;
  quantity: number;
  purchase_nav: number;
  last_price?: number | null;
  last_price_date?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}
