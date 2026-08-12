export interface LegPresetConfig {
    version: number;
    inputs: string[];
    legs: Array<{
        option_type: 'CE' | 'PE';
        action: 'BUY' | 'SELL';
        /** Integer ATM offset in strike steps. Mutually exclusive with strike_pct. */
        strike_distance?: number;
        /** Percent of ATM (signed: + above, - below). Resolved to strike_distance at create. */
        strike_pct?: number;
        expiry_ref: string;
        when?: Record<string, string[]>;
    }>;
}

export type CalendarMode = 'CE' | 'PE' | 'BOTH';

export interface LegPresetInputs {
    symbol: string;
    token: string;
    strike_step: number;
    lot_size: number;
    lots: number;
    atm_strike: number;
    strike_distance?: number;
    expiry?: string;
    near_expiry?: string;
    far_expiry?: string;
    calendar_mode?: CalendarMode;
}

export interface StrategyTemplate {
    id: number;
    name: string;
    description: string;
    minimum_capital: number;
    leg_preset_config?: LegPresetConfig | null;
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
    auto_approve_adjustments?: boolean;
    auto_approve_max?: number | null;
    auto_match_allowed?: boolean;
    auto_match_max?: number | null;
    strategy_template: StrategyTemplate;
    builder_legs: BuilderLeg[];
    supergroup_ids: number[];
    /** Absolute-delta band lower bound in lakhs (combined sum(net_delta×spot); null with max = disabled) */
    delta_band_min?: number | null;
    /** Absolute-delta band upper bound in lakhs (2 = ₹2L) */
    delta_band_max?: number | null;
    /** Per-underlying spot deviation lower bound in percentage from last captured spot. */
    spot_dev_pct_min?: number | null;
    /** Per-underlying spot deviation upper bound in percentage from last captured spot. */
    spot_dev_pct_max?: number | null;
    num_lots_delta_band_adjust?: number | null;
    adjustment_strike_distance?: number;
    shift_enabled?: boolean;
    compulsory_shift_enabled?: boolean;
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
    auto_approve_adjustments?: boolean;
    auto_approve_max?: number | null;
    auto_match_allowed?: boolean;
    auto_match_max?: number | null;
    supergroup_ids?: number[];
    delta_band_min?: number | null;
    delta_band_max?: number | null;
    spot_dev_pct_min?: number | null;
    spot_dev_pct_max?: number | null;
    num_lots_delta_band_adjust?: number | null;
    adjustment_strike_distance?: number;
    shift_enabled?: boolean;
    compulsory_shift_enabled?: boolean;
    shift_strike_distance_itm?: number | null;
    shift_strike_distance_otm?: number | null;
    sell_exposure_limit_lacs?: number | null;
    leg_preset?: LegPresetInputs;
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
    auto_approve_adjustments?: boolean;
    auto_approve_max?: number | null;
    auto_match_allowed?: boolean;
    auto_match_max?: number | null;
    supergroup_ids?: number[];
    delta_band_min?: number | null;
    delta_band_max?: number | null;
    spot_dev_pct_min?: number | null;
    spot_dev_pct_max?: number | null;
    num_lots_delta_band_adjust?: number | null;
    adjustment_strike_distance?: number;
    shift_enabled?: boolean;
    compulsory_shift_enabled?: boolean;
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
