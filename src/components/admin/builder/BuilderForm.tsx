import React, { useState, useEffect } from 'react';
import { StrategyBuilder, StrategyBuilderCreate, StrategyBuilderUpdate, StrategyTemplate } from '@/types/builder';
import { authFetch } from '@/utils/api';

interface SuperGroup {
    id: number;
    name: string;
    description?: string;
    plan_id?: number;
    risk_profile?: string;
}

interface BuilderFormProps {
    initialData?: StrategyBuilder;
    onSubmit: (data: StrategyBuilderCreate | StrategyBuilderUpdate) => void;
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
        supergroup_ids: []
    });
    const [supergroups, setSupergroups] = useState<SuperGroup[]>([]);
    const [loadingSupergroups, setLoadingSupergroups] = useState(false);
    const [strategyTemplates, setStrategyTemplates] = useState<StrategyTemplate[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);

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
                supergroup_ids: initialData.supergroup_ids || []
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
            const selectedTemplate = templateId != null ? strategyTemplates.find(t => t.id === templateId) : null;
            setFormData(prev => ({
                ...prev,
                [name]: templateId,
                margin_required: selectedTemplate?.minimum_capital || prev.margin_required || 0
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
            [name]: name === 'strike_step' || name === 'strike_multiplier' || name === 'strategy_template_id' ? parseInt(value) :
                name === 'entry_ws' || name === 'exit_ws' || name === 'margin_required' ? parseFloat(value) : value
        }));
    };

    const handleSupergroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => parseInt(option.value));
        setFormData(prev => ({
            ...prev,
            supergroup_ids: selectedOptions
        }));
    };

    const handleSubmit = (e?: React.FormEvent | React.KeyboardEvent) => {
        if (e) {
            e.preventDefault();
        }
        onSubmit(formData as StrategyBuilderCreate);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
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
                        <span className="label-text-alt">Auto-populated from template, but editable</span>
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

                <div className="form-control md:col-span-2">
                    <label className="label py-0"><span className="label-text text-sm font-medium text-base-content/80 mb-1.5">Supergroups</span></label>
                    <select 
                        name="supergroup_ids" 
                        multiple
                        value={formData.supergroup_ids?.map(id => id.toString()) || []} 
                        onChange={handleSupergroupChange} 
                        className="select select-bordered select-sm w-full h-28"
                        disabled={loadingSupergroups}
                    >
                        {supergroups.map(sg => (
                            <option key={sg.id} value={sg.id.toString()}>
                                {sg.name} {sg.risk_profile ? `(${sg.risk_profile})` : ''}
                            </option>
                        ))}
                    </select>
                    <label className="label">
                        <span className="label-text-alt">Hold Ctrl/Cmd to select multiple supergroups</span>
                    </label>
                </div>

            </div>

            <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={onCancel} className="btn btn-ghost btn-sm">Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">{initialData ? 'Update' : 'Create'}</button>
            </div>
        </form>
    );
}
