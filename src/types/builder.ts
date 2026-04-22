export interface StrategyTemplate {
    id: number;
    name: string;
    description: string;
    minimum_capital: number;
}

export interface BuilderLeg {
    id: number;
    leg_index: number;
    strike_type: string;
    strike_step: number;
    strike_distance: number;
    strike: number;
    token: string;
    symbol: string;
    // period: string;
    expiry: string | null;
    option_type: string;
    action: string;
    price: number;
    quantity: number;
    lot_size: number;
    exchange?: string;
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
    margin_required: number;
    multiplier_allowed: boolean;
    strategy_template: StrategyTemplate;
    builder_legs: BuilderLeg[];
    supergroup_ids: number[];
    /** Per-underlying Greeks band: net delta lower bound (null with max = disabled) */
    delta_band_min?: number | null;
    /** Per-underlying Greeks band: net delta upper bound */
    delta_band_max?: number | null;
    num_lots_delta_band_adjust?: number | null;
    shift_enabled?: boolean;
    shift_strike_distance_itm?: number | null;
    shift_strike_distance_otm?: number | null;
    sell_exposure_limit_lacs?: number | null;
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
    margin_required?: number;
    multiplier_allowed?: boolean;
    supergroup_ids?: number[];
    delta_band_min?: number | null;
    delta_band_max?: number | null;
    num_lots_delta_band_adjust?: number | null;
    shift_enabled?: boolean;
    shift_strike_distance_itm?: number | null;
    shift_strike_distance_otm?: number | null;
    sell_exposure_limit_lacs?: number | null;
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
    margin_required?: number;
    multiplier_allowed?: boolean;
    supergroup_ids?: number[];
    delta_band_min?: number | null;
    delta_band_max?: number | null;
    num_lots_delta_band_adjust?: number | null;
    shift_enabled?: boolean;
    shift_strike_distance_itm?: number | null;
    shift_strike_distance_otm?: number | null;
    sell_exposure_limit_lacs?: number | null;
}

export interface BuilderLegCreate {
    strategy_builder_id: number;
    leg_index: number;
    strike_type: string;
    strike_step: number;
    strike_distance: number;
    strike: number;
    token: string;
    symbol: string;
    // period: string;
    expiry?: string | null;
    option_type: string;
    action: string;
    price: number;
    quantity: number;
    lot_size: number;
    exchange?: string;
}

export interface BuilderLegUpdate {
    leg_index?: number;
    strike_type?: string;
    strike_step?: number;
    strike_distance?: number;
    strike?: number;
    token?: string;
    symbol?: string;
    // period?: string;
    expiry?: string | null;
    option_type?: string;
    action?: string;
    price?: number;
    quantity?: number;
    lot_size?: number;
    exchange?: string;
}

export interface StrategyBuilderResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: StrategyBuilder[];
}
