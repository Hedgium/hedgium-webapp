import React, { useState, useEffect } from 'react';
import { BuilderLeg, BuilderLegCreate, BuilderLegUpdate } from '@/types/builder';
import AsyncSelect from 'react-select/async';
import { authFetch } from '@/utils/api';
import { Loader2 } from 'lucide-react';

interface LegFormProps {
    initialData?: BuilderLeg;
    builderId: number;
    onSubmit: (data: BuilderLegCreate | BuilderLegUpdate) => void | Promise<void>;
    onCancel: () => void;
    exchange: string;
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
    exchange: string;
    lot_size: number;
    exists: boolean;
}

export default function LegForm({ initialData, builderId, onSubmit, onCancel, exchange }: LegFormProps) {

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
        strike_distance: 0,
        strike: 0,
        token: '',
        symbol: '',
        expiry: null,
        option_type: 'CE',
        action: 'BUY',
        // price: 0,
        quantity: 75,
        lot_size: 75,
    });


    const [noOfLots, setNoOfLots] = useState<number>(1); // Default number of lots
    const [instrumentData, setInstrumentData] = useState<InstrumentSearchResult | null>(null);
    const [currentPrice, setCurrentPrice] = useState<number | null>(null);

    // When builder exchange is NFO_BFO, user picks NFO or BFO per leg
    const [legExchange, setLegExchange] = useState<string>('NFO');
    const effectiveExchange = exchange === 'NFO_BFO' ? legExchange : exchange;

    const calculateATMStrike = (currentPrice: number, strikeStep: number, strikeMultiplier: number = 1): number => {
        const step = strikeStep * strikeMultiplier;
        if (step === 0) return 0;
        return Math.round(currentPrice / step) * step;
    };



    const [isSubmitting, setIsSubmitting] = useState(false);

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
                strike_distance: initialData.strike_distance,
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
            setNoOfLots(initialData.quantity / initialData.lot_size);
            if (exchange === 'NFO_BFO') {
                setLegExchange(initialData.exchange === 'BFO' ? 'BFO' : 'NFO');
            }
        } else {
            setLegExchange(initialData?.exchange || 'NFO');
        } 
    }, [initialData, builderId, exchange]);


    useEffect(() => {
        const atm = calculateATMStrike(currentPrice, formData.strike_step, 1);
        const atmNew = atm + formData.strike_distance * formData.strike_step;
        setFormData(prev => ({
            ...prev,
            strike: atmNew
        }));

    }, [formData.strike_type, formData.strike_distance, currentPrice]);

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
                const response = await authFetch('market/instruments/validate?security=' + formData.symbol + '&date=' + dateFormatted + '&strike=' + formData.strike.toString() + '&option=' + formData.option_type + '&exchange=' + effectiveExchange);
                const data = await response.json();

                setInstrumentData(data);

                if (data.exists) {
                    // Set lot size from API and calculate quantity
                    const apiLotSize = data.lot_size || 75;

                    // setLotSize(apiLotSize);

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
    }, [formData.symbol, formData.expiry, formData.strike, formData.option_type, effectiveExchange]);

    // Fetch price when symbol changes

    async function fetchTokenPrice(token: string) {
        try {
            const response = await authFetch('market/quotes/', {}, {
                instruments: token
            });
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

        if (formData.action == "BUY") {
            setFormData(prev => ({
                ...prev,
                price: data?.depth.buy[0].price
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                price: data?.depth.sell[0].price
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
            [name]: name === 'strike' || name === 'quantity' || name === 'strike_step' || name === 'strike_distance' || name === 'lot_size'
                ? parseInt(value)
                : name === 'price'
                    ? parseFloat(value)
                    : value
        }));
    };

    const loadOptions = async (inputValue: string) => {
        if (!inputValue) return [];
        try {
            const instrumentType = effectiveExchange === 'MCX' ? 'FUT' : 'EQ';
            const response = await authFetch('market/instruments/search/?instrument_type=' + instrumentType + '&q=' + encodeURIComponent(inputValue));
            const data = await response.json();
            return data.map((item: InstrumentSearchResult) => ({
                label: `${item.tradingsymbol} - ${item.name} - ${item.exchange}`,
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

           // this one for nifty and banknifty
            const firstWord = option.value.split(' ')[0];
            const parts = option.label.split(" - ");
            const lastWord = parts[1];
            

            let symbol = '';
            if (effectiveExchange === "MCX") { symbol = lastWord; } else { symbol = firstWord; }
            
            setFormData(prev => ({
                ...prev,
                symbol: symbol,
                token: option.token
            }));

            // Fetch strike step for the selected symbol
            try {
                const response = await authFetch(`market/get/${symbol}`);
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

    const handleSubmit = async (e?: React.FormEvent | React.KeyboardEvent) => {
        if (e) {
            e.preventDefault();
        }
        if (!validationStatus.isValid) {
            alert('Please ensure the instrument is valid before submitting');
            return;
        }
        setIsSubmitting(true);
        try {
        const payload = { ...formData } as BuilderLegCreate | BuilderLegUpdate;
        payload.exchange = effectiveExchange;
        await Promise.resolve(onSubmit(payload));
        } finally {
            setIsSubmitting(false);
        }
    };



    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


                {/* Exchange (only when builder exchange is NFO_BFO) */}
                {exchange === 'NFO_BFO' && (
                    <div className="form-control">
                        <label className="label"><span className="label-text">Exchange</span></label>
                        <select
                            value={legExchange}
                            onChange={(e) => setLegExchange(e.target.value)}
                            className="select select-bordered w-full"
                        >
                            <option value="NFO">NFO</option>
                            <option value="BFO">BFO</option>
                        </select>
                    </div>
                )}

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
                    <input 
                        type="number" 
                        name="strike_distance" 
                        value={formData.strike_distance} 
                        onChange={handleChange}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleSubmit(e);
                            }
                        }}
                        className="input input-bordered w-full" 
                    />
                </div>


                <div className="form-control">
                    <label className="label"><span className="label-text">Calculated Strike</span></label>
                    <input 
                        type="number" 
                        name="strike" 
                        value={formData.strike} 
                        onChange={handleChange}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleSubmit(e);
                            }
                        }}
                        className="input input-bordered w-full" 
                        required 
                    />
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
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleSubmit(e);
                            }
                        }}
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
                    <input 
                        type="number" 
                        step="0.01" 
                        name="price" 
                        value={formData.price} 
                        onChange={handleChange}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleSubmit(e);
                            }
                        }}
                        className="input input-bordered w-full" 
                    />
                </div>

                <div className="form-control">
                    <label className="label"><span className="label-text">Lot Size (Auto-filled)</span></label>
                    <input
                        type="number"
                        name="lot_size"
                        value={formData.lot_size}
                        onChange={(e)=>{
                            setFormData(prev => ({
                                ...prev,
                                lot_size: parseInt(e.target.value),
                                quantity: parseInt(e.target.value) * noOfLots
                            }));
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleSubmit(e);
                            }
                        }}
                        className="input input-bordered w-full bg-gray-100"
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
                                quantity: formData.lot_size * newNoOfLots
                            }));
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleSubmit(e);
                            }
                        }}
                        className="input input-bordered w-full"
                        min="1"
                    />

                    <label className="label"><span className="label-text text-xs">Lot Size: {formData.lot_size}, Quantity: {formData.quantity}</span></label>
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
                <button type="button" onClick={onCancel} className="btn btn-ghost" disabled={isSubmitting}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={!validationStatus.isValid || isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {initialData ? 'Updating...' : 'Adding leg...'}
                        </>
                    ) : (
                        initialData ? 'Update' : 'Add Leg'
                    )}
                </button>
            </div>
        </form>
    );
}
