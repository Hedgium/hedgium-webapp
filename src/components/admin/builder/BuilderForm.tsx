import React, { useState, useEffect, useRef, useMemo } from 'react';
import AsyncSelect from 'react-select/async';
import type { StylesConfig } from 'react-select';
import {
    StrategyBuilder,
    StrategyBuilderCreate,
    StrategyBuilderUpdate,
    StrategyTemplate,
    CalendarMode,
    LegPresetInputs,
} from '@/types/builder';
import UnderlyingDividendSection from '@/components/admin/builder/UnderlyingDividendSection';
import { authFetch } from '@/utils/api';

interface SuperGroup {
    id: number;
    name: string;
    description?: string;
    plan_id?: number;
    risk_profile?: string;
}

interface UnderlyingOption {
    label: string;
    value: string;
    token: string;
    lot_size: number;
}

interface InstrumentSearchResult {
    tradingsymbol: string;
    name: string;
    instrument_token: number;
    exchange: string;
    lot_size: number;
}

const reactSelectStyles: StylesConfig<UnderlyingOption> = {
    control: (base, state) => ({
        ...base,
        backgroundColor: 'var(--color-base-100)',
        borderColor: state.isFocused ? 'var(--color-primary)' : 'var(--color-base-300)',
        boxShadow: state.isFocused ? '0 0 0 1px var(--color-primary)' : 'none',
        '&:hover': { borderColor: 'var(--color-base-content)' },
    }),
    menu: (base) => ({
        ...base,
        backgroundColor: 'var(--color-base-100)',
        border: '1px solid var(--color-base-300)',
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected
            ? 'var(--color-primary)'
            : state.isFocused
            ? 'var(--color-base-200)'
            : 'transparent',
        color: state.isSelected ? 'var(--color-primary-content)' : 'var(--color-base-content)',
    }),
    singleValue: (base) => ({ ...base, color: 'var(--color-base-content)' }),
    input: (base) => ({ ...base, color: 'var(--color-base-content)' }),
};

interface BuilderFormProps {
    initialData?: StrategyBuilder;
    onSubmit: (data: StrategyBuilderCreate | StrategyBuilderUpdate) => void | Promise<void>;
    onCancel: () => void;
}

export default function BuilderForm({ initialData, onSubmit, onCancel }: BuilderFormProps) {
    const [formData, setFormData] = useState<Partial<StrategyBuilderCreate>>({
        name: '',
        exchange: 'NFO',
        status: 'CHECKING',
        entry_ws: 0,
        exit_ws: 0,
        entry_condition: 'LESS',
        exit_pnl: 0,
        strategy_template_id: null, // Default or fetch from API
        margin_required: 0,
        multiplier_allowed: false,
        auto_approve_adjustments: false,
        auto_approve_max: null,
        auto_match_allowed: false,
        auto_match_max: null,
        supergroup_ids: [],
        delta_band_min: null,
        delta_band_max: null,
        spot_dev_pct_min: null,
        spot_dev_pct_max: null,
        num_lots_delta_band_adjust: null,
        adjustment_strike_distance: 0,
        shift_enabled: false,
        shift_strike_distance_itm: null,
        shift_strike_distance_otm: null,
        sell_exposure_limit_lacs: null,
    });
    const [supergroups, setSupergroups] = useState<SuperGroup[]>([]);
    const [loadingSupergroups, setLoadingSupergroups] = useState(false);
    const [strategyTemplates, setStrategyTemplates] = useState<StrategyTemplate[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const submittingRef = useRef(false);

    const [presetSymbol, setPresetSymbol] = useState('');
    const [presetToken, setPresetToken] = useState('');
    const [presetStrikeStep, setPresetStrikeStep] = useState(50);
    const [presetLotSize, setPresetLotSize] = useState(75);
    const [presetLots, setPresetLots] = useState(1);
    const [presetExpiry, setPresetExpiry] = useState('');
    const [presetNearExpiry, setPresetNearExpiry] = useState('');
    const [presetFarExpiry, setPresetFarExpiry] = useState('');
    const [presetCalendarMode, setPresetCalendarMode] = useState<CalendarMode>('PE');
    const [presetSpotPrice, setPresetSpotPrice] = useState<number | null>(null);
    const [presetAtmStrike, setPresetAtmStrike] = useState<number | null>(null);

    const calculateATMStrike = (currentPrice: number, strikeStep: number): number => {
        if (strikeStep === 0) return 0;
        return Math.round(currentPrice / strikeStep) * strikeStep;
    };

    const selectedTemplate = useMemo(
        () => strategyTemplates.find((t) => t.id === formData.strategy_template_id),
        [strategyTemplates, formData.strategy_template_id]
    );
    const legPresetConfig = selectedTemplate?.leg_preset_config ?? null;

    const resetPresetInputs = () => {
        setPresetSymbol('');
        setPresetToken('');
        setPresetStrikeStep(50);
        setPresetLotSize(75);
        setPresetLots(1);
        setPresetExpiry('');
        setPresetNearExpiry('');
        setPresetFarExpiry('');
        setPresetCalendarMode('PE');
        setPresetSpotPrice(null);
        setPresetAtmStrike(null);
    };

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                exchange: initialData.exchange,
                status: initialData.status,
                entry_ws: initialData.entry_ws,
                exit_ws: initialData.exit_ws,
                entry_condition: initialData.entry_condition,
                exit_pnl: initialData.exit_pnl,
                strategy_template_id: initialData.strategy_template?.id || 1,
                margin_required: initialData.margin_required || 0,
                multiplier_allowed: initialData.multiplier_allowed ?? false,
                auto_approve_adjustments: initialData.auto_approve_adjustments ?? false,
                auto_approve_max:
                    initialData.auto_approve_max == null
                        ? null
                        : Number(initialData.auto_approve_max),
                auto_match_allowed: initialData.auto_match_allowed ?? false,
                auto_match_max:
                    initialData.auto_match_max == null
                        ? null
                        : Number(initialData.auto_match_max),
                supergroup_ids: initialData.supergroup_ids || [],
                delta_band_min:
                    initialData.delta_band_min === undefined || initialData.delta_band_min === null
                        ? null
                        : Number(initialData.delta_band_min),
                delta_band_max:
                    initialData.delta_band_max === undefined || initialData.delta_band_max === null
                        ? null
                        : Number(initialData.delta_band_max),
                spot_dev_pct_min:
                    initialData.spot_dev_pct_min === undefined || initialData.spot_dev_pct_min === null
                        ? null
                        : Number(initialData.spot_dev_pct_min),
                spot_dev_pct_max:
                    initialData.spot_dev_pct_max === undefined || initialData.spot_dev_pct_max === null
                        ? null
                        : Number(initialData.spot_dev_pct_max),
                num_lots_delta_band_adjust:
                    initialData.num_lots_delta_band_adjust == null
                        ? null
                        : Number(initialData.num_lots_delta_band_adjust),
                adjustment_strike_distance:
                    initialData.adjustment_strike_distance == null
                        ? 0
                        : Number(initialData.adjustment_strike_distance),
                shift_enabled: initialData.shift_enabled ?? false,
                shift_strike_distance_itm:
                    initialData.shift_strike_distance_itm == null
                        ? null
                        : Number(initialData.shift_strike_distance_itm),
                shift_strike_distance_otm:
                    initialData.shift_strike_distance_otm == null
                        ? null
                        : Number(initialData.shift_strike_distance_otm),
                sell_exposure_limit_lacs:
                    initialData.sell_exposure_limit_lacs == null
                        ? null
                        : Number(initialData.sell_exposure_limit_lacs),
            });
        }
    }, [initialData]);

    useEffect(() => {
        const fetchTemplates = async () => {
            setLoadingTemplates(true);
            try {
                const response = await authFetch('strategies/templates/', {
                    method: 'GET',
                });
                if (response.ok) {
                    const data = await response.json();
                    setStrategyTemplates(data.results || []);
                }
            } catch (error) {
                console.error('Error fetching templates:', error);
            } finally {
                setLoadingTemplates(false);
            }
        };
        fetchTemplates();
    }, []);

    // When creating new: once templates load, set first template and its margin_required
    useEffect(() => {
        if (initialData || strategyTemplates.length === 0) return;
        const first = strategyTemplates[0];
        setFormData(prev => {
            if (prev.strategy_template_id != null) return prev;
            return {
                ...prev,
                strategy_template_id: first.id,
                margin_required: first.minimum_capital ?? 0,
            };
        });
    }, [strategyTemplates, initialData]);

    useEffect(() => {
        const fetchSupergroups = async () => {
            setLoadingSupergroups(true);
            try {
                const response = await authFetch('subscriptions/supergroups/', {
                    method: 'GET',
                });
                if (response.ok) {
                    const data = await response.json();
                    setSupergroups(data.results || []);
                }
            } catch (error) {
                console.error('Error fetching supergroups:', error);
            } finally {
                setLoadingSupergroups(false);
            }
        };
        fetchSupergroups();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        // Handle strategy_template_id change - auto-populate margin_required
        if (name === 'strategy_template_id') {
            const templateId = value === '' ? null : parseInt(value, 10);
            const selected = templateId != null ? strategyTemplates.find(t => t.id === templateId) : null;
            resetPresetInputs();
            setFormData(prev => ({
                ...prev,
                [name]: templateId,
                margin_required: selected?.minimum_capital || prev.margin_required || 0
            }));
            return;
        }

        const nullableNumeric = new Set([
            'delta_band_min',
            'delta_band_max',
            'spot_dev_pct_min',
            'spot_dev_pct_max',
            'num_lots_delta_band_adjust',
            'auto_approve_max',
            'auto_match_max',
            'shift_strike_distance_itm',
            'shift_strike_distance_otm',
            'sell_exposure_limit_lacs',
        ]);
        if (nullableNumeric.has(name)) {
            if (value === '') {
                setFormData(prev => ({ ...prev, [name]: null }));
                return;
            }
            const n = parseFloat(value);
            setFormData(prev => ({
                ...prev,
                [name]: Number.isFinite(n) ? n : null,
            }));
            return;
        }

        if (type === 'checkbox') {
            setFormData(prev => ({
                ...prev,
                [name]: (e.target as HTMLInputElement).checked
            }));
            return;
        }
        
        setFormData(prev => ({
            ...prev,
            [name]: name === 'strike_step' || name === 'strike_multiplier' || name === 'strategy_template_id' || name === 'adjustment_strike_distance' ? parseInt(value) :
                name === 'entry_ws' || name === 'exit_ws' || name === 'margin_required' ? parseFloat(value) : value
        }));
    };

    const toggleSupergroup = (id: number, checked: boolean) => {
        setFormData(prev => {
            const current = prev.supergroup_ids ?? [];
            return {
                ...prev,
                supergroup_ids: checked
                    ? [...current, id]
                    : current.filter(sgId => sgId !== id),
            };
        });
    };

    const loadUnderlyingOptions = async (inputValue: string) => {
        if (!inputValue) return [];
        try {
            const instrumentType = formData.exchange === 'MCX' ? 'FUT' : 'EQ';
            const response = await authFetch(
                `market/instruments/search/?instrument_type=${instrumentType}&q=${encodeURIComponent(inputValue)}`
            );
            const data: InstrumentSearchResult[] = await response.json();
            return data.map((item) => ({
                label: `${item.tradingsymbol} - ${item.name} - ${item.exchange}`,
                value: item.tradingsymbol,
                token: item.instrument_token.toString(),
                lot_size: item.lot_size,
            }));
        } catch {
            return [];
        }
    };

    const fetchUnderlyingSpot = async (token: string): Promise<number | null> => {
        try {
            const response = await authFetch('market/quotes/', {}, { instruments: token });
            const data = await response.json();
            const quote = data.data?.[token];
            const lastPrice = Number(quote?.last_price);
            return Number.isFinite(lastPrice) ? lastPrice : null;
        } catch {
            return null;
        }
    };

    const handlePresetUnderlyingChange = async (option: UnderlyingOption | null) => {
        if (!option) {
            setPresetSymbol('');
            setPresetToken('');
            setPresetSpotPrice(null);
            setPresetAtmStrike(null);
            return;
        }
        const parts = option.label.split(' - ');
        const firstWord = option.value.split(' ')[0];
        const symbol = formData.exchange === 'MCX' ? parts[1] : firstWord;
        setPresetSymbol(symbol);
        setPresetToken(option.token);
        if (option.lot_size > 0) {
            setPresetLotSize(option.lot_size);
        }
        let strikeStep = presetStrikeStep;
        try {
            const response = await authFetch(`market/get/${symbol}`);
            if (response.ok) {
                const data = await response.json();
                const step = Number(data.strike_step);
                if (Number.isFinite(step) && step > 0) {
                    strikeStep = step;
                    setPresetStrikeStep(step);
                }
            }
        } catch {
            // strike step stays at current value
        }
        const spot = await fetchUnderlyingSpot(option.token);
        if (spot != null) {
            setPresetSpotPrice(spot);
            setPresetAtmStrike(calculateATMStrike(spot, strikeStep));
        } else {
            setPresetSpotPrice(null);
            setPresetAtmStrike(null);
        }
    };

    const presetReady = useMemo(() => {
        if (!legPresetConfig?.inputs?.length || !presetSymbol || !presetToken || presetAtmStrike == null) {
            return false;
        }
        const values: Record<string, string | number> = {
            symbol: presetSymbol,
            token: presetToken,
            strike_step: presetStrikeStep,
            lot_size: presetLotSize,
            lots: presetLots,
            expiry: presetExpiry,
            near_expiry: presetNearExpiry,
            far_expiry: presetFarExpiry,
            calendar_mode: presetCalendarMode,
        };
        return legPresetConfig.inputs.every((key) => {
            if (key === 'strike_distance') return true;
            const value = values[key];
            return value !== '' && value !== null && value !== undefined;
        });
    }, [
        legPresetConfig,
        presetSymbol,
        presetToken,
        presetStrikeStep,
        presetLotSize,
        presetLots,
        presetExpiry,
        presetNearExpiry,
        presetFarExpiry,
        presetCalendarMode,
        presetAtmStrike,
    ]);

    const buildLegPresetPayload = (): LegPresetInputs | undefined => {
        if (!legPresetConfig || !presetReady || presetAtmStrike == null) return undefined;
        const payload: LegPresetInputs = {
            symbol: presetSymbol,
            token: presetToken,
            strike_step: presetStrikeStep,
            lot_size: presetLotSize,
            lots: presetLots,
            atm_strike: presetAtmStrike,
            strike_distance: 0,
        };
        if (legPresetConfig.inputs.includes('expiry')) {
            payload.expiry = presetExpiry;
        }
        if (legPresetConfig.inputs.includes('near_expiry')) {
            payload.near_expiry = presetNearExpiry;
        }
        if (legPresetConfig.inputs.includes('far_expiry')) {
            payload.far_expiry = presetFarExpiry;
        }
        if (legPresetConfig.inputs.includes('calendar_mode')) {
            payload.calendar_mode = presetCalendarMode;
        }
        return payload;
    };

    const handleSubmit = async (e?: React.FormEvent | React.KeyboardEvent) => {
        if (e) {
            e.preventDefault();
        }
        if (submittingRef.current) return;
        if (formData.auto_approve_adjustments) {
            const approveMax = formData.auto_approve_max;
            if (approveMax == null || !Number.isFinite(Number(approveMax)) || Number(approveMax) < 1) {
                alert('Auto approve max must be at least 1 when auto-approve adjustments is enabled.');
                return;
            }
        }
        if (formData.auto_match_allowed) {
            const max = formData.auto_match_max;
            if (max == null || !Number.isFinite(Number(max)) || Number(max) < 1) {
                alert('Auto match max must be at least 1 when auto match is enabled.');
                return;
            }
        }
        if (!initialData && legPresetConfig && !presetReady) {
            alert('Please complete all leg setup fields before submitting.');
            return;
        }
        submittingRef.current = true;
        setIsSubmitting(true);
        try {
            const payload = { ...formData } as StrategyBuilderCreate;
            const legPreset = buildLegPresetPayload();
            if (!initialData && legPreset) {
                payload.leg_preset = legPreset;
            }
            await Promise.resolve(onSubmit(payload));
        } finally {
            submittingRef.current = false;
            setIsSubmitting(false);
        }
    };

    const optionalNumberValue = (v: unknown): string | number => {
        if (v == null) return '';
        if (typeof v === 'number') return Number.isNaN(v) ? '' : v;
        return '';
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3" aria-busy={isSubmitting}>
            <div className="join join-vertical w-full border border-base-300 rounded-box overflow-hidden bg-base-100">
            <div className="collapse collapse-arrow join-item border-0 !rounded-none min-h-0">
                <input
                    type="checkbox"
                    defaultChecked
                    aria-label="Show or hide General"
                    className="min-h-0"
                />
                <div className="collapse-title min-h-0 py-3 text-sm font-semibold text-base-content after:!top-1/2 after:!-translate-y-1/2">
                    General
                </div>
                <div className="collapse-content pt-0">
                <div className="px-0 pb-4 sm:px-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
                    <label className="label py-0"><span className="label-text text-sm font-medium text-base-content/80 mb-1.5">Strategy Template</span></label>
                    <select 
                        name="strategy_template_id" 
                        value={formData.strategy_template_id ?? ''} 
                        onChange={handleChange} 
                        className="select select-bordered select-sm h-9 w-full"
                        disabled={loadingTemplates}
                    >
                        <option value="">Select template...</option>
                        {strategyTemplates.map(template => (
                            <option key={template.id} value={template.id}>
                                {template.name}
                            </option>
                        ))}
                    </select>
                </div>
                
                <div className="form-control">
                    <label className="label py-0"><span className="label-text text-sm font-medium text-base-content/80 mb-1.5">Name</span></label>
                    <input 
                        type="text" 
                        name="name" 
                        value={formData.name} 
                        onChange={handleChange}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleSubmit(e);
                            }
                        }}
                        className="input input-bordered input-sm h-9 w-full" 
                        required 
                    />
                </div>
                <div className="form-control">
                    <label className="label py-0"><span className="label-text text-sm font-medium text-base-content/80 mb-1.5">Exchange</span></label>
                    <select name="exchange" value={formData.exchange} onChange={handleChange} className="select select-bordered select-sm h-9 w-full">
                        <option value="NSE">NSE</option>
                        <option value="BSE">BSE</option>
                        <option value="NFO">NFO</option>
                        <option value="BFO">BFO</option>
                        <option value="MCX">MCX</option>
                        <option value="NFO_BFO">NFO_BFO</option>
                    </select>
                </div>
                <div className="form-control">
                    <label className="label py-0"><span className="label-text text-sm font-medium text-base-content/80 mb-1.5">Status</span></label>
                    <select name="status" value={formData.status} onChange={handleChange} className="select select-bordered select-sm h-9 w-full">
                        <option value="CHECKING">CHECKING</option>
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="EXIT_CHECKING">EXIT_CHECKING</option>
                        <option value="EXITED">EXITED</option>
                        <option value="INACTIVE">INACTIVE</option>
                    </select>
                </div>
                {/* <div className="form-control">
                    <label className="label"><span className="label-text">Strike Step</span></label>
                    <input type="number" name="strike_step" value={formData.strike_step} onChange={handleChange} className="input input-bordered w-full" />
                </div>
                <div className="form-control">
                    <label className="label"><span className="label-text">Strike Multiplier</span></label>
                    <input type="number" name="strike_multiplier" value={formData.strike_multiplier} onChange={handleChange} className="input input-bordered w-full" />
                </div> */}
                <div className="form-control">
                    <label className="label py-0"><span className="label-text text-sm font-medium text-base-content/80 mb-1.5">Entry WS (%)</span></label>
                    <input 
                        type="number" 
                        step="0.01" 
                        required 
                        name="entry_ws" 
                        value={formData.entry_ws} 
                        onChange={handleChange}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleSubmit(e);
                            }
                        }}
                        className="input input-bordered input-sm h-9 w-full" 
                    />
                </div>
                <div className="form-control">
                    <label className="label py-0"><span className="label-text text-sm font-medium text-base-content/80 mb-1.5">Exit WS (%)</span></label>
                    <input 
                        type="number" 
                        step="0.01" 
                        required 
                        name="exit_ws" 
                        value={formData.exit_ws} 
                        onChange={handleChange}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleSubmit(e);
                            }
                        }}
                        className="input input-bordered input-sm h-9 w-full" 
                    />
                </div>

                <div className="form-control">
                    <label className="label py-0"><span className="label-text text-sm font-medium text-base-content/80 mb-1.5">Entry Condition</span></label>
                    <select name="entry_condition" value={formData.entry_condition} onChange={handleChange} className="select select-bordered select-sm h-9 w-full">
                        <option value="LESS">LESS</option>
                        <option value="GREATER">GREATER</option>
                    </select>
                </div>
                <div className="form-control">
                    <label className="label py-0"><span className="label-text text-sm font-medium text-base-content/80 mb-1.5">Exit PnL</span></label>
                    <input 
                        type="number" 
                        required 
                        step="0.01" 
                        name="exit_pnl" 
                        value={formData.exit_pnl} 
                        onChange={handleChange}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleSubmit(e);
                            }
                        }}
                        className="input input-bordered input-sm h-9 w-full" 
                    />
                </div>

                

                <div className="form-control">
                    <label className="label py-0"><span className="label-text text-sm font-medium text-base-content/80 mb-1.5">Margin Required</span></label>
                    <input 
                        type="number" 
                        step="0.01" 
                        name="margin_required" 
                        value={formData.margin_required} 
                        onChange={handleChange}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleSubmit(e);
                            }
                        }}
                        className="input input-bordered input-sm h-9 w-full" 
                        required
                    />
                    <label className="label">
                        <span className="text-xs text-base-content/60">Auto-populated from template, but editable</span>
                    </label>
                </div>

                <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-4 py-0">
                        <span className="label-text text-sm font-medium text-base-content/80 flex items-center gap-1">
                            Multiplier Allowed
                            <span className="tooltip tooltip-right" data-tip="When enabled, each user's quantity_multiplier will be applied to leg quantities when creating trade cycle legs.">
                                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-base-300 text-base-content text-[10px] font-bold cursor-default select-none">i</span>
                            </span>
                        </span>
                        <input
                            type="checkbox"
                            name="multiplier_allowed"
                            checked={formData.multiplier_allowed ?? false}
                            onChange={handleChange}
                            className="toggle toggle-primary"
                        />
                    </label>
                </div>

                <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-4 py-0">
                        <span className="label-text text-sm font-medium text-base-content/80 flex items-center gap-1">
                            Auto-approve adjustments (after v1)
                            <span className="tooltip tooltip-right" data-tip="When enabled, adjustments from v2 onward are approved and orders placed automatically — no admin Approve click. v1 always requires manual approval.">
                                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-base-300 text-base-content text-[10px] font-bold cursor-default select-none">i</span>
                            </span>
                        </span>
                        <input
                            type="checkbox"
                            name="auto_approve_adjustments"
                            checked={formData.auto_approve_adjustments ?? false}
                            onChange={handleChange}
                            className="toggle toggle-primary"
                        />
                    </label>
                </div>

                <div className="form-control">
                    <label className="label py-0">
                        <span className="label-text text-sm font-medium text-base-content/80 mb-1.5">Auto Approve Max (per strategy)</span>
                    </label>
                    <input
                        type="number"
                        min={1}
                        step={1}
                        name="auto_approve_max"
                        value={optionalNumberValue(formData.auto_approve_max)}
                        onChange={handleChange}
                        disabled={!formData.auto_approve_adjustments}
                        placeholder={formData.auto_approve_adjustments ? 'e.g. 3' : 'Enable auto-approve first'}
                        className="input input-bordered input-sm h-9 w-full"
                    />
                    <label className="label">
                        <span className="text-xs text-base-content/60">Max auto-approved adjustments (v2+) per deployed strategy</span>
                    </label>
                </div>

                <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-4 py-0">
                        <span className="label-text text-sm font-medium text-base-content/80 flex items-center gap-1">
                            Auto Match Allowed
                            <span className="tooltip tooltip-right" data-tip="When enabled, Celery can place batch match orders when follower positions diverge from master (per-cycle max applies).">
                                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-base-300 text-base-content text-[10px] font-bold cursor-default select-none">i</span>
                            </span>
                        </span>
                        <input
                            type="checkbox"
                            name="auto_match_allowed"
                            checked={formData.auto_match_allowed ?? false}
                            onChange={handleChange}
                            className="toggle toggle-primary"
                        />
                    </label>
                </div>

                <div className="form-control">
                    <label className="label py-0">
                        <span className="label-text text-sm font-medium text-base-content/80 mb-1.5">Auto Match Max (per trade cycle)</span>
                    </label>
                    <input
                        type="number"
                        min={1}
                        step={1}
                        name="auto_match_max"
                        value={optionalNumberValue(formData.auto_match_max)}
                        onChange={handleChange}
                        disabled={!formData.auto_match_allowed}
                        placeholder={formData.auto_match_allowed ? 'e.g. 3' : 'Enable auto match first'}
                        className="input input-bordered input-sm h-9 w-full"
                    />
                    <label className="label">
                        <span className="text-xs text-base-content/60">Max automated match batch runs per follower trade cycle</span>
                    </label>
                </div>

                <div className="form-control md:col-span-2">
                    <label className="label py-0"><span className="label-text text-sm font-medium text-base-content/80 mb-1.5">Supergroups</span></label>
                    <div className="w-full h-28 overflow-y-auto rounded-btn border border-base-300 bg-base-100 p-2 space-y-1">
                        {supergroups.length === 0 ? (
                            <p className="text-sm text-base-content/50 px-1">
                                {loadingSupergroups ? 'Loading supergroups…' : 'No supergroups available'}
                            </p>
                        ) : (
                            supergroups.map(sg => (
                                <label
                                    key={sg.id}
                                    className="flex items-center gap-2 cursor-pointer rounded px-1 py-0.5 text-sm hover:bg-base-200"
                                >
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-xs checkbox-primary"
                                        checked={formData.supergroup_ids?.includes(sg.id) ?? false}
                                        onChange={(e) => toggleSupergroup(sg.id, e.target.checked)}
                                        disabled={loadingSupergroups}
                                    />
                                    <span>
                                        {sg.name}
                                        {sg.risk_profile ? ` (${sg.risk_profile})` : ''}
                                    </span>
                                </label>
                            ))
                        )}
                    </div>
                    <label className="label">
                        <span className="text-xs text-base-content/60">Select one or more supergroups</span>
                    </label>
                </div>

            </div>
            </div>
            </div>
            </div>

            <div className="collapse collapse-arrow join-item border-0 !rounded-none border-t border-base-300 min-h-0">
                <input
                    type="checkbox"
                    aria-label="Show or hide Adjustment"
                    className="min-h-0"
                />
                <div className="collapse-title min-h-0 py-3 text-sm font-semibold text-base-content after:!top-1/2 after:!-translate-y-1/2">
                    Adjustment
                </div>
                <div className="collapse-content pt-0">
                <div className="px-0 pb-4 sm:px-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control md:col-span-2">
                    <label className="label py-0">
                        <span className="label-text text-sm font-medium text-base-content/80">
                            Delta band (Greeks task, per underlying)
                        </span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="label py-0">
                                <span className="label-text text-xs text-base-content/70">Min (net delta)</span>
                            </label>
                            <input
                                type="number"
                                step="any"
                                name="delta_band_min"
                                value={optionalNumberValue(formData.delta_band_min)}
                                onChange={handleChange}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSubmit(e);
                                }}
                                placeholder="e.g. -200 (empty = off)"
                                className="input input-bordered input-sm h-9 w-full"
                            />
                        </div>
                        <div>
                            <label className="label py-0">
                                <span className="label-text text-xs text-base-content/70">Max (net delta)</span>
                            </label>
                            <input
                                type="number"
                                step="any"
                                name="delta_band_max"
                                value={optionalNumberValue(formData.delta_band_max)}
                                onChange={handleChange}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSubmit(e);
                                }}
                                placeholder="e.g. 200 (both required to enable)"
                                className="input input-bordered input-sm h-9 w-full"
                            />
                        </div>
                    </div>
                    <label className="label">
                        <span className="text-xs text-base-content/60">
                            Leave either field empty to disable. Net delta per underlying is compared to these bounds directly.
                        </span>
                    </label>
                </div>

                {initialData ? (
                    <UnderlyingDividendSection
                        symbols={(initialData.builder_legs || []).map((leg) => leg.symbol)}
                    />
                ) : null}

                <div className="form-control md:col-span-2">
                    <label className="label py-0">
                        <span className="label-text text-sm font-medium text-base-content/80">
                            Spot deviation band (%) from last captured spot
                        </span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="label py-0">
                                <span className="label-text text-xs text-base-content/70">Min deviation %</span>
                            </label>
                            <input
                                type="number"
                                step="any"
                                name="spot_dev_pct_min"
                                value={optionalNumberValue(formData.spot_dev_pct_min)}
                                onChange={handleChange}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSubmit(e);
                                }}
                                placeholder="e.g. -1.5"
                                className="input input-bordered input-sm h-9 w-full"
                            />
                        </div>
                        <div>
                            <label className="label py-0">
                                <span className="label-text text-xs text-base-content/70">Max deviation %</span>
                            </label>
                            <input
                                type="number"
                                step="any"
                                name="spot_dev_pct_max"
                                value={optionalNumberValue(formData.spot_dev_pct_max)}
                                onChange={handleChange}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSubmit(e);
                                }}
                                placeholder="e.g. 1.5 (both required to enable)"
                                className="input input-bordered input-sm h-9 w-full"
                            />
                        </div>
                    </div>
                    <label className="label">
                        <span className="text-xs text-base-content/60">
                            Leave either field empty to disable spot deviation checks.
                        </span>
                    </label>
                </div>

                <div className="form-control">
                    <label className="label py-0">
                        <span className="label-text text-sm font-medium text-base-content/80">Lots per delta-band adjustment</span>
                    </label>
                    <input
                        type="number"
                        step="1"
                        min="0"
                        name="num_lots_delta_band_adjust"
                        value={optionalNumberValue(formData.num_lots_delta_band_adjust)}
                        onChange={handleChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSubmit(e);
                        }}
                        placeholder="e.g. 1 (required for auto push)"
                        className="input input-bordered input-sm h-9 w-full"
                    />
                </div>

                <div className="form-control">
                    <label className="label py-0">
                        <span className="label-text text-sm font-medium text-base-content/80">Adjustment strike distance (strikes from ATM)</span>
                    </label>
                    <input
                        type="number"
                        step="1"
                        name="adjustment_strike_distance"
                        value={formData.adjustment_strike_distance ?? 0}
                        onChange={handleChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSubmit(e);
                        }}
                        placeholder="0 = ATM"
                        className="input input-bordered input-sm h-9 w-full"
                    />
                    <label className="label">
                        <span className="text-xs text-base-content/60">
                            0 = ATM. +2 → CE at ATM+2×step, PE at ATM−2×step.
                        </span>
                    </label>
                </div>

                <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-4 py-0">
                        <span className="label-text text-sm font-medium text-base-content/80">Shift (ITM/OTM → ATM) enabled</span>
                        <input
                            type="checkbox"
                            name="shift_enabled"
                            checked={formData.shift_enabled ?? false}
                            onChange={handleChange}
                            className="toggle toggle-primary"
                        />
                    </label>
                </div>

                <div className="form-control">
                    <label className="label py-0">
                        <span className="label-text text-sm font-medium text-base-content/80">Shift distance ITM (strikes)</span>
                    </label>
                    <input
                        type="number"
                        step="any"
                        name="shift_strike_distance_itm"
                        value={optionalNumberValue(formData.shift_strike_distance_itm)}
                        onChange={handleChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSubmit(e);
                        }}
                        className="input input-bordered input-sm h-9 w-full"
                    />
                </div>
                <div className="form-control">
                    <label className="label py-0">
                        <span className="label-text text-sm font-medium text-base-content/80">Shift distance OTM (strikes)</span>
                    </label>
                    <input
                        type="number"
                        step="any"
                        name="shift_strike_distance_otm"
                        value={optionalNumberValue(formData.shift_strike_distance_otm)}
                        onChange={handleChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSubmit(e);
                        }}
                        className="input input-bordered input-sm h-9 w-full"
                    />
                </div>

                <div className="form-control md:col-span-2">
                    <label className="label py-0">
                        <span className="label-text text-sm font-medium text-base-content/80">Sell exposure limit (lacs)</span>
                    </label>
                    <input
                        type="number"
                        step="any"
                        name="sell_exposure_limit_lacs"
                        value={optionalNumberValue(formData.sell_exposure_limit_lacs)}
                        onChange={handleChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSubmit(e);
                        }}
                        className="input input-bordered input-sm h-9 w-full max-w-md"
                    />
                </div>
            </div>
            </div>
            </div>
            </div>
            </div>

            {!initialData && legPresetConfig ? (
            <div className="collapse collapse-arrow join-item border-0 !rounded-none border-t border-base-300 min-h-0">
                <input
                    type="checkbox"
                    defaultChecked
                    aria-label="Show or hide Leg setup"
                    className="min-h-0"
                />
                <div className="collapse-title min-h-0 py-3 text-sm font-semibold text-base-content after:!top-1/2 after:!-translate-y-1/2">
                    Leg setup
                </div>
                <div className="collapse-content pt-0">
                <div className="px-0 pb-4 sm:px-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {legPresetConfig.inputs.includes('symbol') ? (
                        <div className="form-control md:col-span-2">
                            <label className="label py-0">
                                <span className="label-text text-sm font-medium text-base-content/80 mb-1.5">Underlying</span>
                            </label>
                            <AsyncSelect
                                cacheOptions
                                defaultOptions
                                loadOptions={loadUnderlyingOptions}
                                onChange={handlePresetUnderlyingChange}
                                value={
                                    presetSymbol
                                        ? {
                                              label: presetSymbol,
                                              value: presetSymbol,
                                              token: presetToken,
                                              lot_size: presetLotSize,
                                          }
                                        : null
                                }
                                placeholder="Search symbol (e.g. NIFTY)..."
                                styles={reactSelectStyles}
                            />
                            <label className="label py-0">
                                <span className="text-xs text-base-content/60">
                                    Token: {presetToken || '—'}, strike step: {presetStrikeStep}, lot size: {presetLotSize}
                                    {presetSpotPrice != null ? `, spot: ${presetSpotPrice}` : ''}
                                    {presetAtmStrike != null ? `, ATM: ${presetAtmStrike}` : ''}
                                </span>
                            </label>
                        </div>
                    ) : null}

                    {legPresetConfig.inputs.includes('lots') ? (
                        <div className="form-control">
                            <label className="label py-0">
                                <span className="label-text text-sm font-medium text-base-content/80 mb-1.5">Lots</span>
                            </label>
                            <input
                                type="number"
                                min={1}
                                value={presetLots}
                                onChange={(e) => setPresetLots(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                className="input input-bordered input-sm h-9 w-full"
                            />
                        </div>
                    ) : null}

                    {legPresetConfig.inputs.includes('expiry') ? (
                        <div className="form-control">
                            <label className="label py-0">
                                <span className="label-text text-sm font-medium text-base-content/80 mb-1.5">Expiry</span>
                            </label>
                            <input
                                type="date"
                                value={presetExpiry}
                                onChange={(e) => setPresetExpiry(e.target.value)}
                                className="input input-bordered input-sm h-9 w-full"
                                required
                            />
                        </div>
                    ) : null}

                    {legPresetConfig.inputs.includes('near_expiry') ? (
                        <div className="form-control">
                            <label className="label py-0">
                                <span className="label-text text-sm font-medium text-base-content/80 mb-1.5">Near expiry</span>
                            </label>
                            <input
                                type="date"
                                value={presetNearExpiry}
                                onChange={(e) => setPresetNearExpiry(e.target.value)}
                                className="input input-bordered input-sm h-9 w-full"
                                required
                            />
                        </div>
                    ) : null}

                    {legPresetConfig.inputs.includes('far_expiry') ? (
                        <div className="form-control">
                            <label className="label py-0">
                                <span className="label-text text-sm font-medium text-base-content/80 mb-1.5">Far expiry</span>
                            </label>
                            <input
                                type="date"
                                value={presetFarExpiry}
                                onChange={(e) => setPresetFarExpiry(e.target.value)}
                                className="input input-bordered input-sm h-9 w-full"
                                required
                            />
                        </div>
                    ) : null}

                    {legPresetConfig.inputs.includes('calendar_mode') ? (
                        <div className="form-control">
                            <label className="label py-0">
                                <span className="label-text text-sm font-medium text-base-content/80 mb-1.5">Calendar legs</span>
                            </label>
                            <select
                                value={presetCalendarMode}
                                onChange={(e) => setPresetCalendarMode(e.target.value as CalendarMode)}
                                className="select select-bordered select-sm h-9 w-full"
                            >
                                <option value="CE">Call (CE) — 2 legs</option>
                                <option value="PE">Put (PE) — 2 legs</option>
                                <option value="BOTH">Both CE and PE — 4 legs</option>
                            </select>
                        </div>
                    ) : null}
                </div>
                </div>
                </div>
            </div>
            ) : null}

            <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={onCancel} disabled={isSubmitting} className="btn btn-ghost btn-sm">
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting || (!initialData && Boolean(legPresetConfig) && !presetReady)}
                    className="btn btn-primary btn-sm min-w-[5.5rem] gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <span className="loading loading-spinner loading-xs" aria-hidden />
                            {initialData ? "Updating…" : "Creating…"}
                        </>
                    ) : (
                        initialData ? "Update" : "Create"
                    )}
                </button>
            </div>
        </form>
    );
}
