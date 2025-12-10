import React, { useState, useEffect } from 'react';
import { Profile } from '@/types/profile';

interface ProfileFormProps {
    initialData: Profile;
    onSubmit: (data: Partial<Profile>) => void;
    onCancel: () => void;
}

export default function ProfileForm({ initialData, onSubmit, onCancel }: ProfileFormProps) {
    const [formData, setFormData] = useState<Partial<Profile>>({
        broker_name: '',
        broker_user_id: '',
        margin_equity: 0,
        is_active: false,
        verified: false,
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                broker_name: initialData.broker_name,
                broker_user_id: initialData.broker_user_id,
                margin_equity: initialData.margin_equity,
                is_active: initialData.is_active,
                verified: initialData.verified,
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
                name === 'margin_equity' ? parseFloat(value) : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <label className="label cursor-pointer justify-start gap-4">
                        <span className="label-text">Active</span>
                        <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} className="checkbox" />
                    </label>
                </div>

                <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-4">
                        <span className="label-text">Verified</span>
                        <input type="checkbox" name="verified" checked={formData.verified} onChange={handleChange} className="checkbox" />
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
