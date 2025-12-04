import React, { useState } from 'react';
import { Profile } from '@/types/profile';
import { authFetch } from '@/utils/api';
import useAlert from '@/hooks/useAlert';
import { RotateCw, Edit2, TrendingUp } from 'lucide-react';

interface Position {
    tradingsymbol: string;
    quantity: number;
    average_price?: number;
    last_price?: number;
    pnl?: number;
    day_pnl?: number;
}

interface LivePositionsData {
    status: string;
    data?: {
        net: Position[];
    };
}

interface ProfileItemProps {
    profile: Profile;
    onEdit?: (profile: Profile) => void;
}

export default function ProfileItem({ profile, onEdit }: ProfileItemProps) {
    const [refreshing, setRefreshing] = useState(false);
    const [sendingReminder, setSendingReminder] = useState(false);
    const [equityMargin, setEquityMargin] = useState(profile.margin_equity);
    const [loadingPositions, setLoadingPositions] = useState(false);
    const [showPositionsModal, setShowPositionsModal] = useState(false);
    const [livePositions, setLivePositions] = useState<LivePositionsData | null>(null);
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

    const handleViewLivePositions = async () => {
        setLoadingPositions(true);
        try {
            const response = await authFetch(`positions/live/positions/${profile.id}/`);
            const data = await response.json();

            if (data.status === 'success') {
                setLivePositions(data);
                setShowPositionsModal(true);
                alert.success("Live positions fetched successfully");
            } else {
                alert.error("Failed to fetch live positions");
            }
        } catch (error) {
            console.error('Error fetching live positions:', error);
            alert.error('Error fetching live positions');
        } finally {
            setLoadingPositions(false);
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
        } catch {
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
                        {profile.broker_logged_in && <button
                            onClick={handleViewLivePositions}
                            disabled={loadingPositions}
                            className="btn btn-ghost btn-xs text-green-400"
                            title="View Live Positions"
                        >
                            {loadingPositions ? '...' : <TrendingUp size={16} />}
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
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded text-xs ${profile.verified ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                                {profile.verified ? 'Verified' : 'Unverified'}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs ${profile.is_active ? 'bg-blue-900 text-blue-300' : 'bg-gray-700 text-gray-300'}`}>
                                {profile.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        {profile.subscription && (
                            <div className="mt-1">
                                <p className="text-xs text-gray-500">Plan: <span className="font-medium text-gray-300">{profile.subscription.plan.name}</span></p>
                                <p className={`text-xs ${profile.subscription.is_valid ? 'text-green-400' : 'text-red-400'}`}>
                                    Expires: {new Date(profile.subscription.end_date).toLocaleDateString()}
                                    <span className="ml-1 opacity-75">
                                        ({Math.ceil((new Date(profile.subscription.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left)
                                    </span>
                                </p>
                            </div>
                        )}
                        {!profile.subscription && (
                            <p className="text-xs text-gray-500">No active subscription</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Live Positions Modal */}
            {showPositionsModal && livePositions && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowPositionsModal(false)}>
                    <div className="bg-base-200 rounded-lg p-6 max-w-6xl w-full max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Live Positions - {profile.broker_name}</h3>
                            <button onClick={() => setShowPositionsModal(false)} className="btn btn-sm btn-circle">✕</button>
                        </div>

                        {livePositions.data?.net && livePositions.data.net.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="table table-zebra w-full">
                                    <thead>
                                        <tr>
                                            <th>Instrument</th>
                                            <th>Qty</th>
                                            <th>Avg Price</th>
                                            <th>LTP</th>
                                            <th>P&L</th>
                                            <th>Day P&L</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {livePositions.data.net.map((position: Position, index: number) => (
                                            <tr key={index}>
                                                <td className="font-medium">{position.tradingsymbol}</td>
                                                <td>{position.quantity}</td>
                                                <td>₹{position.average_price?.toFixed(2)}</td>
                                                <td>₹{position.last_price?.toFixed(2)}</td>
                                                <td className={position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                                                    ₹{position.pnl?.toFixed(2)}
                                                </td>
                                                <td className={position.day_pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                                                    ₹{position.day_pnl?.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-center text-gray-400 py-8">No positions found</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
