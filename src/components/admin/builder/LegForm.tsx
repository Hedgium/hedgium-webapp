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

interface InstrumentSearchResult {
    tradingsymbol: string;
    name: string;
    instrument_token: number;
    lot_size: number;
    exists: boolean;
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
    const formatDateDisplay = (dateString: string | null | undefined): string => {
        if (!dateString) return '';
        const parts = dateString.split('-');
        if (parts.length !== 3) return dateString;
        return `${parts[2]}-${parts[1]}-${parts[0].slice(-2)}`;
    }

    const [expiryInputType, setExpiryInputType] = useState<string>('text');

    const [formData, setFormData] = useState<Partial<BuilderLegCreate>>({
        strategy_builder_id: builderId,
        strike_type: 'DYNAMIC',
        strike_step: 50,
        atm_strike_multiplier: 0,
        strike: 0,
        token: '',
        symbol: '',
        expiry: null,
        option_type: 'CE',
        action: 'BUY',
        // price: 0,
        quantity: 0,
        lot_size: 75
    });



    const [lotSize, setLotSize] = useState<number>(75); // Default lot size
    const [noOfLots, setNoOfLots] = useState<number>(1); // Default number of lots
    const [instrumentData, setInstrumentData] = useState<InstrumentSearchResult | null>(null);
    const [currentPrice, setCurrentPrice] = useState<number | null>(null);

    const calculateATMStrike = (currentPrice: number, strikeStep: number, strikeMultiplier: number = 1): number => {
        const step = strikeStep * strikeMultiplier;
        if (step === 0) return 0;
        return Math.round(currentPrice / step) * step;
    };



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
                strike_type: initialData.strike_type,
                strike_step: initialData.strike_step,
                atm_strike_multiplier: initialData.atm_strike_multiplier,
                strike: initialData.strike,
                token: initialData.token,
                symbol: initialData.symbol,
                // period: initialData.period,
                expiry: formatDateForInput(initialData.expiry),
                option_type: initialData.option_type,
                action: initialData.action,
                price: initialData.price,
                quantity: initialData.quantity,
                lot_size: initialData.lot_size
            });
            setLotSize(initialData.lot_size);
        }
    }, [initialData, builderId]);


    useEffect(() => {
        const atm = calculateATMStrike(currentPrice, formData.strike_step, 1);
        const atmNew = atm + formData.atm_strike_multiplier * formData.strike_step;
        setFormData(prev => ({
            ...prev,
            strike: atmNew
        }));

    }, [formData.strike_type, formData.atm_strike_multiplier, currentPrice]);

    // Validate instrument whenever relevant fields change
    useEffect(() => {
        const validateInstrument = async () => {
            // Check if all required fields are filled
            if (!formData.symbol || !formData.expiry || !formData.strike || !formData.option_type) {
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
                    `&option=${formData.option_type}`;

                const response = await fetch(url);
                const data = await response.json();

                setInstrumentData(data);

                if (data.exists) {
                    // Set lot size from API and calculate quantity
                    const apiLotSize = data.lot_size || 75;

                    setLotSize(apiLotSize);

                    setFormData(prev => ({
                        ...prev,
                        lot_size: apiLotSize,
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
                // console.error('Error validating instrument:', error);
                setValidationStatus({
                    isValidating: false,
                    isValid: false,
                    message: '✗ Error validating instrument',
                    validatedSymbol: ''
                });
            }
        }
        // Debounce validation
        const timeoutId = setTimeout(validateInstrument, 500);
        return () => clearTimeout(timeoutId);
    }, [formData.symbol, formData.expiry, formData.strike, formData.option_type, noOfLots]);

    // Fetch price when symbol changes

    async function fetchTokenPrice(token: string) {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/market/quotes/?instruments=${encodeURIComponent(token)}`);
            const data = await response.json();
            // console.log(data);
            return data.data[token];
        } catch (error) {
            console.error("Error fetching quote:", error);
            return null;
        }
    }

    // Fetch price when token changes
    useEffect(() => {
        const fetchPrice = async () => {
            if (!formData.token) return;
            const data = await fetchTokenPrice(formData.token);
            setCurrentPrice(data.last_price);
        };

        const timeoutId = setTimeout(fetchPrice, 500);
        return () => clearTimeout(timeoutId);
    }, [formData.token]);


    async function fetchDepthToken() {
        const data = await fetchTokenPrice(instrumentData?.instrument_token.toString());

        // console.log(data)

        if (formData.action == "BUY") {
            setFormData(prev => ({
                ...prev,
                price: data?.depth.sell[0].price
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                price: data?.depth.buy[0].price
            }));
        }
    }

    useEffect(() => {
        if (instrumentData?.exists) {
            // console.log("fdfdf")
        }
        fetchDepthToken();
    }, [instrumentData, formData?.action]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'strike' || name === 'quantity' || name === 'strike_step' || name === 'atm_strike_multiplier' || name === 'lot_size'
                ? parseInt(value)
                : name === 'price'
                    ? parseFloat(value)
                    : value
        }));
    };

    const loadOptions = async (inputValue: string) => {
        if (!inputValue) return [];
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/market/instruments/search?q=${inputValue}`);
            const data = await response.json();
            return data.map((item: InstrumentSearchResult) => ({
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

    const handleSymbolChange = async (option: Option | null) => {
        if (option) {
            // Keep only the first word of the symbol
            const firstWord = option.value.split(' ')[0];

            setFormData(prev => ({
                ...prev,
                symbol: firstWord,
                token: option.token,
            }));

            // Fetch strike step for the selected symbol
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/market/get/${firstWord}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.strike_step) {
                        setFormData(prev => ({
                            ...prev,
                            strike_step: data.strike_step
                        }));
                    }
                }
            } catch (error) {
                console.error("Error fetching strike step:", error);
            }
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

                    <label className="label"><span className="label-text text-xs">Token: {formData.token}, Price: {currentPrice}</span></label>

                </div>

                {/* <div className="form-control">
                    <label className="label"><span className="label-text">Token</span></label>
                    <input type="text" name="token" value={formData.token} className="input input-bordered w-full bg-gray-100" readOnly />
                </div> */}

                {/* <div className="form-control">
                    <label className="label"><span className="label-text">Current Price</span></label>
                    <input type="number" value={currentPrice !== null ? currentPrice : ''} className="input input-bordered w-full bg-gray-100" readOnly />
                </div> */}

                {/* Strike Type Selection */}
                <div className="form-control">
                    <label className="label"><span className="label-text">Strike Type</span></label>
                    <select name="strike_type" value={formData.strike_type} onChange={handleChange} className="select select-bordered w-full">
                        <option value="FIXED">FIXED</option>
                        <option value="DYNAMIC">DYNAMIC</option>
                    </select>

                </div>


                <div className="form-control">
                    <label className="label"><span className="label-text">ATM Strike Multiplier</span></label>
                    <input type="number" name="atm_strike_multiplier" value={formData.atm_strike_multiplier} onChange={handleChange} className="input input-bordered w-full" />
                </div>


                <div className="form-control">
                    <label className="label"><span className="label-text">Calculated Strike</span></label>
                    <input type="number" name="strike" value={formData.strike} onChange={handleChange} className="input input-bordered w-full" required />
                    <label className="label"><span className="label-text text-xs">Strike Step: {formData.strike_step}</span></label>

                </div>


                <div className="form-control">
                    <label className="label"><span className="label-text">Expiry</span></label>
                    <input
                        type={expiryInputType}
                        name="expiry"
                        value={expiryInputType === 'date' ? (formData.expiry || '') : formatDateDisplay(formData.expiry)}
                        onChange={handleChange}
                        onFocus={() => setExpiryInputType('date')}
                        onBlur={() => setExpiryInputType('text')}
                        placeholder="DD-MM-YY"
                        className="input input-bordered w-full"
                        required
                    />
                </div>



                <div className="form-control">
                    <label className="label"><span className="label-text">Option Type</span></label>
                    <select name="option_type" value={formData.option_type} onChange={handleChange} className="select select-bordered w-full">
                        <option value="CE">CE</option>
                        <option value="PE">PE</option>
                    </select>
                </div>

                {/* <div className="form-control">
                    <label className="label"><span className="label-text">Period</span></label>
                    <select name="period" value={formData.period} onChange={handleChange} className="select select-bordered w-full">
                        <option value="WEEKLY">WEEKLY</option>
                        <option value="MONTHLY">MONTHLY</option>
                    </select>
                </div> */}


                <div className="form-control">
                    <label className="label"><span className="label-text">Action</span></label>
                    <select name="action" value={formData.action} onChange={handleChange} className="select select-bordered w-full">
                        <option value="BUY">BUY</option>
                        <option value="SELL">SELL</option>
                    </select>
                </div>


                <div className="form-control">
                    <label className="label"><span className="label-text">Price (₹)</span></label>
                    <input type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} className="input input-bordered w-full" />
                </div>

                {/* <div className="form-control">
                    <label className="label"><span className="label-text">Lot Size (Auto-filled)</span></label>
                    <input
                        type="number"
                        value={lotSize}
                        className="input input-bordered w-full bg-gray-100"
                        readOnly
                    />
                </div> */}

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
                                lot_size: lotSize,
                                quantity: lotSize * newNoOfLots
                            }));
                        }}
                        className="input input-bordered w-full"
                        min="1"
                    />

                    <label className="label"><span className="label-text text-xs">Lot Size: {lotSize}, Quantity: {formData.quantity}</span></label>
                </div>

                {/* <div className="form-control">
                    <label className="label"><span className="label-text">Quantity (Lot Size × No. of Lots)</span></label>
                    <input
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        className="input input-bordered w-full bg-gray-100"
                        readOnly
                    />
                </div> */}
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
