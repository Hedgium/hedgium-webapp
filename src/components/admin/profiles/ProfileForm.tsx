import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Profile } from '@/types/profile';

export type ProfileFormPayload = Partial<Profile> & {
    mobile?: string | null;
    signup_step?: string | null;
    user_verified?: boolean;
    proxy_password?: string;
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

function FormCollapse({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <details className="group rounded-xl border border-base-300 bg-base-200/40 open:bg-base-200/60 transition-colors">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-base-content/90 [&::-webkit-details-marker]:hidden">
                <span>{title}</span>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50 transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-base-300/60 px-4 pb-4 pt-3">{children}</div>
        </details>
    );
}

export default function ProfileForm({ initialData, onSubmit, onCancel }: ProfileFormProps) {
    const [formData, setFormData] = useState({
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
        proxy_host: '',
        proxy_port: '' as string,
        proxy_username: '',
        proxy_password: '',
    });

    useEffect(() => {
        if (!initialData) return;
        const u = initialData.user;
        setFormData({
            broker_name: initialData.broker_name,
            broker_user_id: initialData.broker_user_id ?? '',
            margin_equity: initialData.margin_equity,
            order_value_factor: initialData.order_value_factor ?? 1,
            quantity_multiplier: initialData.quantity_multiplier ?? 1,
            is_active: initialData.is_active,
            verified: initialData.verified,
            auto_trade_allowed: initialData.auto_trade_allowed ?? false,
            mobile: u?.mobile ?? '',
            signup_step: u?.signup_step ?? 'initiated',
            user_verified: u?.verified ?? false,
            proxy_host: initialData.proxy_host ?? '',
            proxy_port:
                initialData.proxy_port !== null && initialData.proxy_port !== undefined
                    ? String(initialData.proxy_port)
                    : '',
            proxy_username: initialData.proxy_username ?? '',
            proxy_password: '',
        });
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]:
                type === 'checkbox'
                    ? (e.target as HTMLInputElement).checked
                    : name === 'margin_equity' || name === 'order_value_factor'
                      ? parseFloat(value)
                      : name === 'quantity_multiplier'
                        ? parseInt(value, 10)
                        : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload: ProfileFormPayload = {
            broker_name: formData.broker_name,
            broker_user_id: formData.broker_user_id || undefined,
            margin_equity: formData.margin_equity,
            order_value_factor: formData.order_value_factor,
            quantity_multiplier: formData.quantity_multiplier,
            is_active: formData.is_active,
            verified: formData.verified,
            auto_trade_allowed: formData.auto_trade_allowed,
            mobile: formData.mobile || null,
            signup_step: formData.signup_step || null,
            user_verified: formData.user_verified,
            proxy_host: formData.proxy_host.trim() || null,
            proxy_port: formData.proxy_port.trim()
                ? parseInt(formData.proxy_port, 10)
                : null,
            proxy_username: formData.proxy_username.trim() || null,
        };
        const pwd = formData.proxy_password.trim();
        if (pwd) {
            payload.proxy_password = pwd;
        }
        onSubmit(payload);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-base-content/60">
                Essentials below. Open a section for user account fields, order proxy, or sizing.
            </p>

            <div className="rounded-xl border border-base-300 bg-base-100 p-4 space-y-4">
                <h3 className="text-sm font-semibold text-base-content/80">Profile essentials</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control md:col-span-2">
                        <label className="label"><span className="label-text">Broker</span></label>
                        <input
                            type="text"
                            name="broker_name"
                            value={formData.broker_name}
                            onChange={handleChange}
                            className="input input-bordered w-full"
                        />
                    </div>
                    <div className="form-control">
                        <label className="label"><span className="label-text">Broker user ID</span></label>
                        <input
                            type="text"
                            name="broker_user_id"
                            value={formData.broker_user_id}
                            onChange={handleChange}
                            className="input input-bordered w-full"
                        />
                    </div>
                    <div className="form-control">
                        <label className="label"><span className="label-text">Margin equity</span></label>
                        <input
                            type="number"
                            step="0.01"
                            name="margin_equity"
                            value={formData.margin_equity}
                            onChange={handleChange}
                            className="input input-bordered w-full"
                        />
                    </div>
                    <div className="form-control">
                        <label className="label cursor-pointer justify-start gap-4">
                            <span className="label-text">Active</span>
                            <input
                                type="checkbox"
                                name="is_active"
                                checked={formData.is_active}
                                onChange={handleChange}
                                className="checkbox"
                            />
                        </label>
                    </div>
                    <div className="form-control">
                        <label className="label cursor-pointer justify-start gap-4">
                            <span className="label-text">Verified (profile)</span>
                            <input
                                type="checkbox"
                                name="verified"
                                checked={formData.verified}
                                onChange={handleChange}
                                className="checkbox"
                            />
                        </label>
                    </div>
                    <div className="form-control md:col-span-2">
                        <label className="label cursor-pointer justify-start gap-4">
                            <span className="label-text">Auto trade allowed</span>
                            <input
                                type="checkbox"
                                name="auto_trade_allowed"
                                checked={formData.auto_trade_allowed}
                                onChange={handleChange}
                                className="checkbox checkbox-primary"
                            />
                        </label>
                    </div>
                </div>
            </div>

            <FormCollapse title="User account (admin)">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                        <label className="label"><span className="label-text">Mobile</span></label>
                        <input
                            type="text"
                            name="mobile"
                            value={formData.mobile}
                            onChange={handleChange}
                            className="input input-bordered w-full"
                            placeholder="User mobile"
                        />
                    </div>
                    <div className="form-control">
                        <label className="label"><span className="label-text">Verification step</span></label>
                        <select
                            name="signup_step"
                            value={formData.signup_step}
                            onChange={handleChange}
                            className="select select-bordered w-full"
                        >
                            {SIGNUP_STEPS.map((s) => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-control md:col-span-2">
                        <label className="label cursor-pointer justify-start gap-4">
                            <span className="label-text">User verified</span>
                            <input
                                type="checkbox"
                                name="user_verified"
                                checked={formData.user_verified}
                                onChange={handleChange}
                                className="checkbox"
                            />
                        </label>
                    </div>
                </div>
            </FormCollapse>

            <FormCollapse title="Order API proxy (static IP)">
                <p className="text-xs text-base-content/60 mb-3">
                    Used only for create / modify / cancel order requests. Clear <strong className="font-medium text-base-content/80">Proxy host</strong> and save to turn the proxy off.
                    Leave password empty to keep the current proxy password unchanged.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control md:col-span-2">
                        <label className="label"><span className="label-text">Proxy host</span></label>
                        <input
                            type="text"
                            name="proxy_host"
                            value={formData.proxy_host}
                            onChange={handleChange}
                            className="input input-bordered w-full font-mono text-sm"
                            placeholder="e.g. proxy.example.com (empty = direct)"
                        />
                    </div>
                    <div className="form-control">
                        <label className="label"><span className="label-text">Proxy port</span></label>
                        <input
                            type="number"
                            name="proxy_port"
                            value={formData.proxy_port}
                            onChange={handleChange}
                            className="input input-bordered w-full"
                            placeholder="443"
                            min={1}
                            max={65535}
                        />
                    </div>
                    <div className="form-control">
                        <label className="label"><span className="label-text">Proxy username</span></label>
                        <input
                            type="text"
                            name="proxy_username"
                            value={formData.proxy_username}
                            onChange={handleChange}
                            className="input input-bordered w-full"
                            autoComplete="off"
                        />
                    </div>
                    <div className="form-control md:col-span-2">
                        <label className="label"><span className="label-text">Proxy password</span></label>
                        <input
                            type="password"
                            name="proxy_password"
                            value={formData.proxy_password}
                            onChange={handleChange}
                            className="input input-bordered w-full"
                            placeholder="Leave blank to keep existing"
                            autoComplete="new-password"
                        />
                    </div>
                </div>
            </FormCollapse>

            <FormCollapse title="Trading & sizing">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text flex items-center gap-1">
                                Order value factor
                                <span
                                    className="tooltip tooltip-right"
                                    data-tip="1 = 10 Lakhs"
                                >
                                    <span className="inline-flex h-4 w-4 cursor-default select-none items-center justify-center rounded-full bg-base-300 text-[10px] font-bold text-base-content">
                                        i
                                    </span>
                                </span>
                            </span>
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            name="order_value_factor"
                            value={formData.order_value_factor}
                            onChange={handleChange}
                            className="input input-bordered w-full"
                        />
                    </div>
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text flex items-center gap-1">
                                Quantity multiplier
                                <span
                                    className="tooltip tooltip-right"
                                    data-tip="Multiplies leg quantities when strategy has multiplier_allowed enabled."
                                >
                                    <span className="inline-flex h-4 w-4 cursor-default select-none items-center justify-center rounded-full bg-base-300 text-[10px] font-bold text-base-content">
                                        i
                                    </span>
                                </span>
                            </span>
                        </label>
                        <input
                            type="number"
                            step="1"
                            min={1}
                            name="quantity_multiplier"
                            value={formData.quantity_multiplier}
                            onChange={handleChange}
                            className="input input-bordered w-full"
                        />
                    </div>
                </div>
            </FormCollapse>

            <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={onCancel} className="btn btn-ghost">
                    Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                    Update profile
                </button>
            </div>
        </form>
    );
}
