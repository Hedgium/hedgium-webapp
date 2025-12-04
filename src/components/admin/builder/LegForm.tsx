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

    // Helper function to format date for API (YY MMM DD)
    const formatDateForAPI = (dateString: string): string => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear().toString().slice(-2);
        const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
        const day = date.getDate().toString().padStart(2, '0');
        return `${year} ${month} ${day}`;
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

    const [lotSize, setLotSize] = useState<number>(75); // Default lot size
    const [noOfLots, setNoOfLots] = useState<number>(1); // Default number of lots

    const [validationStatus, setValidationStatus] = useState<{
        isValidating: boolean;
        isValid: boolean;
        message: string;
        validatedSymbol: string;
    }>({
        isValidating: false,
        isValid: false,
        message: '',
        validatedSymbol: ''
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

    // Validate instrument whenever relevant fields change
    useEffect(() => {
        const validateInstrument = async () => {
            // Check if all required fields are filled
            if (!formData.symbol || !formData.expiry || !formData.strike || !formData.option_type || !formData.period) {
                setValidationStatus({
                    isValidating: false,
                    isValid: false,
                    message: '',
                    validatedSymbol: ''
                });
                return;
            }

            setValidationStatus(prev => ({
                ...prev,
                isValidating: true,
                message: 'Validating instrument...'
            }));

            try {
                const dateFormatted = formatDateForAPI(formData.expiry);
                const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/market/instruments/validate?` +
                    `security=${encodeURIComponent(formData.symbol)}` +
                    `&date=${encodeURIComponent(dateFormatted)}` +
                    `&strike=${formData.strike}` +
                    `&option=${formData.option_type}` +
                    `&period=${formData.period}`;

                const response = await fetch(url);
                const data = await response.json();

                if (data.exists) {
                    // Set lot size from API and calculate quantity
                    const apiLotSize = data.lot_size || 75;
                    setLotSize(apiLotSize);

                    setFormData(prev => ({
                        ...prev,
                        quantity: apiLotSize * noOfLots // Calculate: lot_size × no_of_lots
                    }));

                    setValidationStatus({
                        isValidating: false,
                        isValid: true,
                        message: `✓ Valid options contract: ${data.tradingsymbol} (Lot size: ${apiLotSize})`,
                        validatedSymbol: data.tradingsymbol
                    });
                } else {
                    setValidationStatus({
                        isValidating: false,
                        isValid: false,
                        message: `✗ ${data.message}`,
                        validatedSymbol: ''
                    });
                }
            } catch (error) {
                console.error('Error validating instrument:', error);
                setValidationStatus({
                    isValidating: false,
                    isValid: false,
                    message: '✗ Error validating instrument',
                    validatedSymbol: ''
                });
            }
        };

        // Debounce validation
        const timeoutId = setTimeout(validateInstrument, 500);
        return () => clearTimeout(timeoutId);
    }, [formData.symbol, formData.expiry, formData.strike, formData.option_type, formData.period]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        let { name, value } = e.target;
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
            // Keep only the first word of the symbol
            const firstWord = option.value.split(' ')[0];

            setFormData(prev => ({
                ...prev,
                symbol: firstWord,
                token: option.token,
            }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validationStatus.isValid) {
            alert('Please ensure the instrument is valid before submitting');
            return;
        }
        onSubmit(formData as BuilderLegCreate);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                    <label className="label"><span className="label-text">Leg Index</span></label>
                    <input type="number" name="leg_index" value={formData.leg_index} onChange={handleChange} className="input input-bordered w-full" required />
                </div>

                {/* Symbol (Underlying) - searchable */}
                <div className="form-control">
                    <label className="label"><span className="label-text">Symbol (Underlying)</span></label>
                    <AsyncSelect
                        cacheOptions
                        defaultOptions
                        loadOptions={loadOptions}
                        onChange={handleSymbolChange}
                        value={formData.symbol ? { label: formData.symbol, value: formData.symbol, token: formData.token || '', lot_size: 0 } : null}
                        className="react-select-container"
                        classNamePrefix="react-select"
                        placeholder="Search Symbol (e.g., NIFTY, BANKNIFTY)..."
                    />
                </div>

                <div className="form-control">
                    <label className="label"><span className="label-text">Token</span></label>
                    <input type="text" name="token" value={formData.token} className="input input-bordered w-full bg-gray-100" readOnly />
                </div>


                <div className="form-control">
                    <label className="label"><span className="label-text">Expiry</span></label>
                    <input type="date" name="expiry" value={formData.expiry || ''} onChange={handleChange} className="input input-bordered w-full" required />
                </div>

                <div className="form-control">
                    <label className="label"><span className="label-text">Strike</span></label>
                    <input type="number" name="strike" value={formData.strike} onChange={handleChange} className="input input-bordered w-full" required />
                </div>

                <div className="form-control">
                    <label className="label"><span className="label-text">Option Type</span></label>
                    <select name="option_type" value={formData.option_type} onChange={handleChange} className="select select-bordered w-full">
                        <option value="CE">CE</option>
                        <option value="PE">PE</option>
                    </select>
                </div>

                <div className="form-control">
                    <label className="label"><span className="label-text">Period</span></label>
                    <select name="period" value={formData.period} onChange={handleChange} className="select select-bordered w-full">
                        <option value="WEEKLY">WEEKLY</option>
                        <option value="MONTHLY">MONTHLY</option>
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
                    <label className="label"><span className="label-text">Lot Size (Auto-filled)</span></label>
                    <input
                        type="number"
                        value={lotSize}
                        className="input input-bordered w-full bg-gray-100"
                        readOnly
                    />
                </div>

                <div className="form-control">
                    <label className="label"><span className="label-text">Number of Lots</span></label>
                    <input
                        type="number"
                        value={noOfLots}
                        onChange={(e) => {
                            const newNoOfLots = parseInt(e.target.value) || 1;
                            setNoOfLots(newNoOfLots);
                            // Recalculate quantity: lot_size × no_of_lots
                            setFormData(prev => ({
                                ...prev,
                                quantity: lotSize * newNoOfLots
                            }));
                        }}
                        className="input input-bordered w-full"
                        min="1"
                    />
                </div>

                <div className="form-control">
                    <label className="label"><span className="label-text">Quantity (Lot Size × No. of Lots)</span></label>
                    <input
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        className="input input-bordered w-full bg-gray-100"
                        readOnly
                    />
                </div>
            </div>

            {/* Validation Status */}
            <div className="form-control md:col-span-2">
                <div className={`alert ${validationStatus.isValid ? 'alert-success' : validationStatus.message ? 'alert-warning' : 'alert-info'}`}>
                    <span>{validationStatus.message || 'Fill in the fields above to validate instrument'}</span>
                </div>
            </div>


            <div className="flex justify-end space-x-2 mt-6">
                <button type="button" onClick={onCancel} className="btn btn-ghost">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={!validationStatus.isValid}>
                    {initialData ? 'Update' : 'Add Leg'}
                </button>
            </div>
        </form>
    );
}
