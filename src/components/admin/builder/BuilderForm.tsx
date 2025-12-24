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
        strategy_template_id: 1, // Default or fetch from API
        margin_required: 0,
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
        const { name, value } = e.target;
        
        // Handle strategy_template_id change - auto-populate margin_required
        if (name === 'strategy_template_id') {
            const templateId = parseInt(value);
            const selectedTemplate = strategyTemplates.find(t => t.id === templateId);
            setFormData(prev => ({
                ...prev,
                [name]: templateId,
                margin_required: selectedTemplate?.minimum_capital || prev.margin_required || 0
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData as StrategyBuilderCreate);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="form-control">
                    <label className="label"><span className="label-text">Strategy Template</span></label>
                    <select 
                        name="strategy_template_id" 
                        value={formData.strategy_template_id} 
                        onChange={handleChange} 
                        className="select select-bordered w-full"
                        disabled={loadingTemplates}
                    >
                        {strategyTemplates.map(template => (
                            <option key={template.id} value={template.id}>
                                {template.name}
                            </option>
                        ))}
                    </select>
                </div>
                
                <div className="form-control">
                    <label className="label"><span className="label-text">Name</span></label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="input input-bordered w-full" required />
                </div>
                <div className="form-control">
                    <label className="label"><span className="label-text">Exchange</span></label>
                    <select name="exchange" value={formData.exchange} onChange={handleChange} className="select select-bordered w-full">
                        <option value="NSE">NSE</option>
                        <option value="BSE">BSE</option>
                        <option value="NFO">NFO</option>
                    </select>
                </div>
                <div className="form-control">
                    <label className="label"><span className="label-text">Status</span></label>
                    <select name="status" value={formData.status} onChange={handleChange} className="select select-bordered w-full">
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
                    <label className="label"><span className="label-text">Entry WS (%)</span></label>
                    <input type="number" step="0.01" name="entry_ws" value={formData.entry_ws} onChange={handleChange} className="input input-bordered w-full" />
                </div>
                <div className="form-control">
                    <label className="label"><span className="label-text">Exit WS (%)</span></label>
                    <input type="number" step="0.01" name="exit_ws" value={formData.exit_ws} onChange={handleChange} className="input input-bordered w-full" />
                </div>

                <div className="form-control">
                    <label className="label"><span className="label-text">Entry Condition</span></label>
                    <select name="entry_condition" value={formData.entry_condition} onChange={handleChange} className="select select-bordered w-full">
                        <option value="LESS">LESS</option>
                        <option value="GREATER">GREATER</option>
                    </select>
                </div>
                <div className="form-control">
                    <label className="label"><span className="label-text">Exit PnL (₹)</span></label>
                    <input type="number" step="0.01" name="exit_pnl" value={formData.exit_pnl} onChange={handleChange} className="input input-bordered w-full" />
                </div>

                

                <div className="form-control">
                    <label className="label"><span className="label-text">Margin Required (₹)</span></label>
                    <input 
                        type="number" 
                        step="0.01" 
                        name="margin_required" 
                        value={formData.margin_required || 0} 
                        onChange={handleChange} 
                        className="input input-bordered w-full" 
                    />
                    <label className="label">
                        <span className="label-text-alt">Auto-populated from template, but editable</span>
                    </label>
                </div>

                <div className="form-control md:col-span-2">
                    <label className="label"><span className="label-text">Supergroups</span></label>
                    <select 
                        name="supergroup_ids" 
                        multiple
                        value={formData.supergroup_ids?.map(id => id.toString()) || []} 
                        onChange={handleSupergroupChange} 
                        className="select select-bordered w-full h-32"
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

            <div className="flex justify-end space-x-2 mt-6">
                <button type="button" onClick={onCancel} className="btn btn-ghost">Cancel</button>
                <button type="submit" className="btn btn-primary">{initialData ? 'Update' : 'Create'}</button>
            </div>
        </form>
    );
}
