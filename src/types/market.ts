export interface UnderlyingDividend {
    symbol: string;
    dividend_active: boolean;
    dividend_amount: number | null;
    ex_dividend_date: string | null;
}

export interface UnderlyingDividendListResponse {
    dividends: UnderlyingDividend[];
}

export interface UnderlyingDividendUpdate {
    dividend_active: boolean;
    dividend_amount: number | null;
    ex_dividend_date: string | null;
}
