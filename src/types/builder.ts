export interface StrategyTemplate {
    id: number;
    name: string;
    description: string;
}

export interface BuilderLeg {
    id: number;
    leg_index: number;
    strike_type: string;
    strike_step: number;
    atm_strike_multiplier: number;
    strike: number;
    token: string;
    symbol: string;
    period: string;
    expiry: string | null;
    option_type: string;
    action: string;
    price: number;
    quantity: number;
    lot_size: number;
}

export interface StrategyBuilder {
    id: number;
    name: string;
    exchange: string;
    status: string;
    strike_step: number;
    strike_multiplier: number;
    entry_ws: number;
    exit_ws: number;
    entry_condition: string;
    created_at: string;
    updated_at: string;
    calculated_ws: number;
    exit_pnl: number;
    strategy_template: StrategyTemplate;
    builder_legs: BuilderLeg[];
}

export interface StrategyBuilderCreate {
    name: string;
    exchange: string;
    status: string;
    strike_step: number;
    strike_multiplier: number;
    entry_ws: number;
    exit_ws: number;
    entry_condition: string;
    exit_pnl: number;
    strategy_template_id: number;
}

export interface StrategyBuilderUpdate {
    name?: string;
    exchange?: string;
    status?: string;
    strike_step?: number;
    strike_multiplier?: number;
    entry_ws?: number;
    exit_ws?: number;
    entry_condition?: string;
    strategy_template_id?: number;
}

export interface BuilderLegCreate {
    strategy_builder_id: number;
    leg_index: number;
    strike_type: string;
    strike_step: number;
    atm_strike_multiplier: number;
    strike: number;
    token: string;
    symbol: string;
    period: string;
    expiry?: string | null;
    option_type: string;
    action: string;
    price: number;
    quantity: number;
    lot_size: number;
}

export interface BuilderLegUpdate {
    leg_index?: number;
    strike_type?: string;
    strike_step?: number;
    atm_strike_multiplier?: number;
    strike?: number;
    token?: string;
    symbol?: string;
    period?: string;
    expiry?: string | null;
    option_type?: string;
    action?: string;
    price?: number;
    quantity?: number;
    lot_size?: number;
}

export interface StrategyBuilderResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: StrategyBuilder[];
}
