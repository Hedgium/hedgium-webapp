import React, { useState } from 'react';
import { Profile } from '@/types/profile';
import { authFetch } from '@/utils/api';
import useAlert from '@/hooks/useAlert';
import { RotateCw, Edit2 } from 'lucide-react';

interface ProfileItemProps {
    profile: Profile;
    onEdit?: (profile: Profile) => void;
}

export default function ProfileItem({ profile, onEdit }: ProfileItemProps) {
    const [refreshing, setRefreshing] = useState(false);
    const [sendingReminder, setSendingReminder] = useState(false);
    const [equityMargin, setEquityMargin] = useState(profile.margin_equity);
    const alert = useAlert();

    const handleRefreshMargin = async () => {
        setRefreshing(true);
        try {
            // Assuming endpoint structure, can be adjusted
            const response = await authFetch(`profiles/refresh-margin/${profile.id}/`);
            const data = await response.json();
            console.log(data);
            setEquityMargin(data.margin_equity);
            alert.success("Margin equity updated successfully");
            // alert('Margin refresh initiated'); // Simple feedback for now
        } catch (error) {
            console.error('Error refreshing margin:', error);
            // alert('Failed to refresh margin');
        } finally {
            setRefreshing(false);
        }
    };

    const handleSendLoginReminder = async () => {
        setSendingReminder(true);
        try {
            // Assuming endpoint structure, can be adjusted
            const response = await authFetch(`notifications/`,

                {
                    method: 'POST',
                    body: JSON.stringify({
                        user_id: profile.user.id,
                        type: 'INFO',
                        title: 'Login reminder',
                        message: 'Please login to your account to continue'
                    })
                });
            const data = await response.json();
            console.log(data);
            alert.success("Login reminder sent successfully");
            // alert('Login reminder sent');
        } catch (error) {
            alert.error('Error sending login reminder:');
            // alert('Failed to send login reminder');
        } finally {
            setSendingReminder(false);
        }
    };

    return (
        <div className="bg-base-100 rounded-lg p-4 mb-4 border border-base-300">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                    <p className="text-gray-400 text-sm">User</p>
                    <p className="font-medium">{profile.user.email}</p>
                    <p className="text-xs text-gray-500">{profile.user.first_name} {profile.user.last_name}</p>
                    <p className="text-xs text-gray-500">ID: {profile.user_id}</p>
                </div>
                <div>
                    <p className="text-gray-400 text-sm">Broker</p>
                    <p className="font-medium">{profile.broker_name}</p>
                    <p className="text-xs text-gray-500">{profile.broker_user_id}</p>

                    {profile.broker_logged_in ? (
                        <span className="ml-auto text-xs text-green-400 flex items-center">
                            ✓ Broker Logged In
                        </span>
                    ) : (
                        <button
                            onClick={handleSendLoginReminder}
                            disabled={sendingReminder}
                            className="btn btn-secondary btn-xs"
                        >
                            {sendingReminder ? 'Sending...' : 'Send Login Reminder'}
                        </button>
                    )}

                </div>
                <div>
                    <p className="text-gray-400 text-sm">Margin Equity</p>
                    <p className="font-medium">₹{equityMargin.toLocaleString()}</p>
                    <div className="flex space-x-2 mt-1">
                        {profile.broker_logged_in && <button
                            onClick={handleRefreshMargin}
                            disabled={refreshing}
                            className={`btn btn-ghost btn-xs ${refreshing ? "animate-spin" : ""}`}
                            title="Refresh Margin"
                        >
                            <RotateCw size={16} />
                        </button>}
                        {onEdit && (
                            <button
                                onClick={() => onEdit(profile)}
                                className="btn btn-ghost btn-xs text-blue-400"
                                title="Edit Profile"
                            >
                                <Edit2 size={16} />
                            </button>
                        )}
                    </div>

                </div>
                <div>
                    <p className="text-gray-400 text-sm">Status</p>
                    <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs ${profile.verified ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                            {profile.verified ? 'Verified' : 'Unverified'}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${profile.is_active ? 'bg-blue-900 text-blue-300' : 'bg-gray-700 text-gray-300'}`}>
                            {profile.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
