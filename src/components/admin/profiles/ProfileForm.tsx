import React, { useState, useEffect } from 'react';
import { Profile } from '@/types/profile';

type ProfileFormPayload = Partial<Profile> & {
    mobile?: string | null;
    signup_step?: string | null;
    user_verified?: boolean;
};

interface ProfileFormProps {
    initialData: Profile;
    onSubmit: (data: ProfileFormPayload) => void;
    onCancel: () => void;
}

const SIGNUP_STEPS = [
    { value: 'initiated', label: 'Initiated' },
    { value: 'documents_uploaded', label: 'Documents Uploaded' },
    { value: 'broker_profile_added', label: 'Broker Profile Added' },
    { value: 'verified', label: 'Verified' },
];

export default function ProfileForm({ initialData, onSubmit, onCancel }: ProfileFormProps) {
    const [formData, setFormData] = useState<ProfileFormPayload>({
        broker_name: '',
        broker_user_id: '',
        margin_equity: 0,
        order_value_factor: 1,
        quantity_multiplier: 1,
        is_active: false,
        verified: false,
        auto_trade_allowed: false,
        mobile: '',
        signup_step: 'initiated',
        user_verified: false,
    });

    useEffect(() => {
        if (initialData) {
            const u = initialData.user;
            setFormData({
                broker_name: initialData.broker_name,
                broker_user_id: initialData.broker_user_id,
                margin_equity: initialData.margin_equity,
                order_value_factor: initialData.order_value_factor ?? 1,
                quantity_multiplier: initialData.quantity_multiplier ?? 1,
                is_active: initialData.is_active,
                verified: initialData.verified,
                auto_trade_allowed: initialData.auto_trade_allowed ?? false,
                mobile: u?.mobile ?? '',
                signup_step: u?.signup_step ?? 'initiated',
                user_verified: u?.verified ?? false,
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox'
                ? (e.target as HTMLInputElement).checked
                : (name === 'margin_equity' || name === 'order_value_factor')
                    ? parseFloat(value)
                    : name === 'quantity_multiplier'
                        ? parseInt(value, 10)
                        : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control md:col-span-2">
                    <h3 className="font-medium text-base opacity-80 mb-1">User (admin)</h3>
                </div>
                <div className="form-control">
                    <label className="label"><span className="label-text">Mobile</span></label>
                    <input type="text" name="mobile" value={formData.mobile ?? ''} onChange={handleChange} className="input input-bordered w-full" placeholder="User mobile" />
                </div>
                <div className="form-control">
                    <label className="label"><span className="label-text">Verification step</span></label>
                    <select name="signup_step" value={formData.signup_step ?? 'initiated'} onChange={handleChange} className="select select-bordered w-full">
                        {SIGNUP_STEPS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                </div>
                <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-4">
                        <span className="label-text">User verified</span>
                        <input type="checkbox" name="user_verified" checked={formData.user_verified ?? false} onChange={handleChange} className="checkbox" />
                    </label>
                </div>

                <div className="form-control md:col-span-2">
                    <h3 className="font-medium text-base opacity-80 mb-1 mt-2">Profile</h3>
                </div>
                <div className="form-control">
                    <label className="label"><span className="label-text">Broker Name</span></label>
                    <input type="text" name="broker_name" value={formData.broker_name} onChange={handleChange} className="input input-bordered w-full" />
                </div>
                <div className="form-control">
                    <label className="label"><span className="label-text">Broker User ID</span></label>
                    <input type="text" name="broker_user_id" value={formData.broker_user_id || ''} onChange={handleChange} className="input input-bordered w-full" />
                </div>
                <div className="form-control">
                    <label className="label"><span className="label-text">Margin Equity</span></label>
                    <input type="number" step="0.01" name="margin_equity" value={formData.margin_equity} onChange={handleChange} className="input input-bordered w-full" />
                </div>
                <div className="form-control">
                    <label className="label">
                        <span className="label-text flex items-center gap-1">
                            Order Value Factor
                            <span className="tooltip tooltip-right" data-tip="1 = 10 Lakhs">
                                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-base-300 text-base-content text-[10px] font-bold cursor-default select-none">i</span>
                            </span>
                        </span>
                    </label>
                    <input type="number" step="0.01" name="order_value_factor" value={formData.order_value_factor ?? 1} onChange={handleChange} className="input input-bordered w-full" />
                </div>
                <div className="form-control">
                    <label className="label">
                        <span className="label-text flex items-center gap-1">
                            Quantity Multiplier
                            <span className="tooltip tooltip-right" data-tip="Multiplies leg quantities when strategy has multiplier_allowed enabled. Default is 1 (no change).">
                                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-base-300 text-base-content text-[10px] font-bold cursor-default select-none">i</span>
                            </span>
                        </span>
                    </label>
                    <input type="number" step="1" min="1" name="quantity_multiplier" value={formData.quantity_multiplier ?? 1} onChange={handleChange} className="input input-bordered w-full" />
                </div>

                <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-4">
                        <span className="label-text">Active</span>
                        <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} className="checkbox" />
                    </label>
                </div>

                <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-4">
                        <span className="label-text">Verified (profile)</span>
                        <input type="checkbox" name="verified" checked={formData.verified} onChange={handleChange} className="checkbox" />
                    </label>
                </div>

                <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-4">
                        <span className="label-text">Auto Trade Allowed</span>
                        <input type="checkbox" name="auto_trade_allowed" checked={formData.auto_trade_allowed ?? false} onChange={handleChange} className="checkbox checkbox-primary" />
                    </label>
                </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
                <button type="button" onClick={onCancel} className="btn btn-ghost">Cancel</button>
                <button type="submit" className="btn btn-primary">Update Profile</button>
            </div>
        </form>
    );
}
