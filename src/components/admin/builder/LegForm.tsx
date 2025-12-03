import React, { useState, useEffect } from 'react';
import { BuilderLeg, BuilderLegCreate, BuilderLegUpdate } from '@/types/builder';
import AsyncSelect from 'react-select/async';

interface LegFormProps {
    initialData?: BuilderLeg;
    builderId: number;
    onSubmit: (data: BuilderLegCreate | BuilderLegUpdate) => void;
    onCancel: () => void;
}

interface Option {
    label: string;
    value: string;
    token: string;
    lot_size: number;
}

export default function LegForm({ initialData, builderId, onSubmit, onCancel }: LegFormProps) {

    // Helper function to convert ISO datetime to YYYY-MM-DD format
    const formatDateForInput = (dateString: string | null | undefined): string => {
        if (!dateString) return '';
        // Extract just the date part (YYYY-MM-DD) from ISO format
        return dateString.split('T')[0];
    };

    const [formData, setFormData] = useState<Partial<BuilderLegCreate>>({
        strategy_builder_id: builderId,
        leg_index: 1,
        token: '',
        symbol: '',
        period: 'WEEKLY',
        strike: 0,
        expiry: null,
        option_type: 'CE',
        action: 'BUY',
        quantity: 0
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                strategy_builder_id: builderId,
                leg_index: initialData.leg_index,
                token: initialData.token,
                symbol: initialData.symbol,
                period: initialData.period,
                strike: initialData.strike,
                expiry: formatDateForInput(initialData.expiry),
                option_type: initialData.option_type,
                action: initialData.action,
                quantity: initialData.quantity
            });
        }
    }, [initialData, builderId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'leg_index' || name === 'strike' || name === 'quantity' ? parseInt(value) : value
        }));
    };

    const loadOptions = async (inputValue: string) => {
        if (!inputValue) return [];
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/market/instruments/search?q=${inputValue}`);
            const data = await response.json();
            return data.map((item: any) => ({
                label: `${item.tradingsymbol} - ${item.name}`,
                value: item.tradingsymbol,
                token: item.instrument_token.toString(),
                lot_size: item.lot_size
            }));
        } catch (error) {
            console.error("Error fetching instruments:", error);
            return [];
        }
    };

    const handleSymbolChange = (option: Option | null) => {
        if (option) {
            setFormData(prev => ({
                ...prev,
                symbol: option.value,
                token: option.token,
                // quantity: option.lot_size // Optional: auto-fill quantity with lot size
            }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData as BuilderLegCreate);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                    <label className="label"><span className="label-text">Leg Index</span></label>
                    <input type="number" name="leg_index" value={formData.leg_index} onChange={handleChange} className="input input-bordered w-full" required />
                </div>
                <div className="form-control">
                    <label className="label"><span className="label-text">Symbol</span></label>
                    <AsyncSelect
                        cacheOptions
                        defaultOptions
                        loadOptions={loadOptions}
                        onChange={handleSymbolChange}
                        value={formData.symbol ? { label: formData.symbol, value: formData.symbol, token: formData.token, lot_size: 0 } : null}
                        className="react-select-container"
                        classNamePrefix="react-select"
                        placeholder="Search Symbol..."
                    />
                </div>
                <div className="form-control">
                    <label className="label"><span className="label-text">Token</span></label>
                    <input type="text" name="token" value={formData.token} onChange={handleChange} className="input input-bordered w-full" readOnly />
                </div>
                <div className="form-control">
                    <label className="label"><span className="label-text">Period</span></label>
                    <select name="period" value={formData.period} onChange={handleChange} className="select select-bordered w-full">
                        <option value="WEEKLY">WEEKLY</option>
                        <option value="MONTHLY">MONTHLY</option>
                    </select>
                </div>
                <div className="form-control">
                    <label className="label"><span className="label-text">Strike</span></label>
                    <input type="number" name="strike" value={formData.strike} onChange={handleChange} className="input input-bordered w-full" />
                </div>
                <div className="form-control">
                    <label className="label"><span className="label-text">Expiry</span></label>
                    <input type="date" name="expiry" value={formData.expiry || ''} onChange={handleChange} className="input input-bordered w-full" />
                </div>
                <div className="form-control">
                    <label className="label"><span className="label-text">Option Type</span></label>
                    <select name="option_type" value={formData.option_type} onChange={handleChange} className="select select-bordered w-full">
                        <option value="CE">CE</option>
                        <option value="PE">PE</option>
                    </select>
                </div>
                <div className="form-control">
                    <label className="label"><span className="label-text">Action</span></label>
                    <select name="action" value={formData.action} onChange={handleChange} className="select select-bordered w-full">
                        <option value="BUY">BUY</option>
                        <option value="SELL">SELL</option>
                    </select>
                </div>
                <div className="form-control">
                    <label className="label"><span className="label-text">Quantity</span></label>
                    <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} className="input input-bordered w-full" />
                </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
                <button type="button" onClick={onCancel} className="btn btn-ghost">Cancel</button>
                <button type="submit" className="btn btn-primary">{initialData ? 'Update' : 'Add Leg'}</button>
            </div>
        </form>
    );
}
