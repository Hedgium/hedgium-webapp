import React, { useState, useEffect } from 'react';
import { ChevronDown, Search, UserCircle2, X } from 'lucide-react';
import { Profile } from '@/types/profile';
import { authFetch } from '@/utils/api';

export type ProfileFormPayload = Partial<Profile> & {
    mobile?: string | null;
    signup_step?: string | null;
    user_verified?: boolean;
    proxy_password?: string;
    relationship_manager_id?: number | null;
};

type RmSearchUser = {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    mobile?: string | null;
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

    const [relationshipManagerId, setRelationshipManagerId] = useState<number | null>(
        () => initialData.relationship_manager?.id ?? null
    );
    /** Snapshot of selected RM for display after pick (search results are cleared). */
    const [rmPick, setRmPick] = useState<RmSearchUser | null>(() =>
        initialData.relationship_manager
            ? {
                  id: initialData.relationship_manager.id,
                  email: initialData.relationship_manager.email || '',
                  first_name: initialData.relationship_manager.first_name || '',
                  last_name: initialData.relationship_manager.last_name || '',
                  mobile: initialData.relationship_manager.mobile ?? null,
              }
            : null
    );
    const [rmSearch, setRmSearch] = useState('');
    const [debouncedRmSearch, setDebouncedRmSearch] = useState('');
    const [rmResults, setRmResults] = useState<RmSearchUser[]>([]);
    const [rmSearchLoading, setRmSearchLoading] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedRmSearch(rmSearch.trim()), 350);
        return () => clearTimeout(t);
    }, [rmSearch]);

    useEffect(() => {
        if (debouncedRmSearch.length < 2) {
            setRmResults([]);
            setRmSearchLoading(false);
            return;
        }
        let cancelled = false;
        setRmSearchLoading(true);
        (async () => {
            try {
                const params = new URLSearchParams({ q: debouncedRmSearch });
                const res = await authFetch(`profiles/relationship-manager-search/?${params}`);
                const data = await res.json();
                if (!cancelled && res.ok && Array.isArray(data.results)) {
                    setRmResults(data.results as RmSearchUser[]);
                } else if (!cancelled) {
                    setRmResults([]);
                }
            } catch {
                if (!cancelled) setRmResults([]);
            } finally {
                if (!cancelled) setRmSearchLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [debouncedRmSearch]);

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
        setRelationshipManagerId(initialData.relationship_manager?.id ?? null);
        setRmPick(
            initialData.relationship_manager
                ? {
                      id: initialData.relationship_manager.id,
                      email: initialData.relationship_manager.email || '',
                      first_name: initialData.relationship_manager.first_name || '',
                      last_name: initialData.relationship_manager.last_name || '',
                      mobile: initialData.relationship_manager.mobile ?? null,
                  }
                : null
        );
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
        payload.relationship_manager_id = relationshipManagerId;
        onSubmit(payload);
    };

    const rmDisplay =
        relationshipManagerId != null
            ? rmPick && rmPick.id === relationshipManagerId
                ? rmPick
                : {
                      id: relationshipManagerId,
                      email: '',
                      first_name: '',
                      last_name: '',
                      mobile: null as string | null,
                  }
            : null;

    const pickRm = (u: RmSearchUser) => {
        setRelationshipManagerId(u.id);
        setRmPick(u);
        setRmSearch('');
        setRmResults([]);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-base-content/60">
                Essentials below. Open a section for user account fields, order proxy, or sizing.
            </p>


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


            <FormCollapse title="Profile essentials">
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
                                    data-tip="1 = 30 Lakhs"
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


            <FormCollapse title="Relationship manager">
                <p className="text-xs text-base-content/60 mb-3">
                    Search staff by email, name, username, or mobile. Clear to remove the assignment.
                </p>
                {relationshipManagerId != null && rmDisplay ? (
                    <div className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-base-300 bg-base-200/40 p-3 mb-3">
                        <div className="flex gap-2 min-w-0">
                            <UserCircle2 className="size-5 shrink-0 text-base-content/50 mt-0.5" />
                            <div className="min-w-0 text-sm">
                                <p className="font-medium truncate">
                                    {(rmDisplay.first_name || '').trim()} {(rmDisplay.last_name || '').trim()}
                                    {!String((rmDisplay.first_name || '') + (rmDisplay.last_name || '')).trim() && (
                                        <span className="text-base-content/50">User #{relationshipManagerId}</span>
                                    )}
                                </p>
                                {(rmDisplay.email || '').trim() ? (
                                    <p className="text-base-content/70 truncate">{rmDisplay.email}</p>
                                ) : null}
                                {rmDisplay.mobile ? (
                                    <p className="text-base-content/60">{rmDisplay.mobile}</p>
                                ) : null}
                            </div>
                        </div>
                        <button
                            type="button"
                            className="btn btn-ghost btn-xs gap-1 shrink-0"
                            onClick={() => {
                                setRelationshipManagerId(null);
                                setRmPick(null);
                                setRmSearch('');
                                setRmResults([]);
                            }}
                        >
                            <X className="size-3.5" />
                            Clear
                        </button>
                    </div>
                ) : (
                    <p className="text-sm text-base-content/50 mb-3">No relationship manager assigned.</p>
                )}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="z-10 size-4 text-base-content/40" />
                    </div>
                    <input
                        type="search"
                        value={rmSearch}
                        onChange={(e) => setRmSearch(e.target.value)}
                        className="input input-bordered input-sm w-full pl-9"
                        placeholder="Type at least 2 characters to search…"
                        autoComplete="off"
                    />
                    {rmSearchLoading && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 loading loading-spinner loading-xs" />
                    )}
                </div>
                {rmResults.length > 0 && (
                    <ul className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-base-300 bg-base-100 divide-y divide-base-200">
                        {rmResults.map((u) => (
                            <li key={u.id}>
                                <button
                                    type="button"
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-base-200 transition-colors"
                                    onClick={() => pickRm(u)}
                                >
                                    <span className="font-medium">
                                        {u.first_name} {u.last_name}
                                    </span>
                                    <span className="text-base-content/60"> · </span>
                                    <span className="text-base-content/80 break-all">{u.email}</span>
                                    {u.mobile ? (
                                        <span className="block text-xs text-base-content/55">{u.mobile}</span>
                                    ) : null}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
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
