import React, { useState } from 'react';
import { Profile } from '@/types/profile';
import { authFetch } from '@/utils/api';
import useAlert from '@/hooks/useAlert';
import { RotateCw, Edit2, TrendingUp } from 'lucide-react';
import LivePositionsModal, { LivePositionsData } from '@/components/LivePositionsModal';

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

    // Shoonya Login State
    const [isShoonyaLoginModalOpen, setIsShoonyaLoginModalOpen] = useState(false);
    const [shoonyaPassword, setShoonyaPassword] = useState("");
    const [isLoggingInShoonya, setIsLoggingInShoonya] = useState(false);
    const [brokerLoggedIn, setBrokerLoggedIn] = useState(profile.broker_logged_in);

    const alert = useAlert();

    const handleRefreshMargin = async () => {
        setRefreshing(true);
        try {
            // Assuming endpoint structure, can be adjusted
            const response = await authFetch(`profiles/refresh-margin/${profile.id}/`);
            const data = await response.json();
            // console.log(data);
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


    const handleShoonyaLogin = async () => {
        if (!shoonyaPassword) {
            alert.error("Please enter a password");
            return;
        }

        setIsLoggingInShoonya(true);
        try {
            const response = await authFetch("users/shoonya-login/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    "profile_id": String(profile.id),
                    "pwd": shoonyaPassword
                }),
            });

            const data = await response.json();

            if (data.status === "success") {
                alert.success("Shoonya login successful");
                setIsShoonyaLoginModalOpen(false);
                setShoonyaPassword("");
                setBrokerLoggedIn(true);                // Optionally trigger a refresh or update local state to show logged in
                // For now, we might need to reload or notify parent. 
                // A full refresh might be needed to update the 'broker_logged_in' status if it comes from backend
                // window.location.reload()
            } else {
                alert.error(`Login failed: ${data.message || JSON.stringify(data)}`);
            }

        } catch (error) {
            console.error("Shoonya login error:", error);
            alert.error("An error occurred during login");
        } finally {
            setIsLoggingInShoonya(false);
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
                    <p className="text-xs text-gray-500">HID:{profile.id}, BROKER ID:{profile.broker_user_id}</p>

                    {brokerLoggedIn ? (
                        <span className="ml-auto text-xs text-green-400 flex items-center">
                            ✓ Broker Logged In
                        </span>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={handleSendLoginReminder}
                                disabled={sendingReminder}
                                className="btn btn-secondary btn-xs"
                            >
                                {sendingReminder ? 'Sending...' : 'Send Login Reminder'}
                            </button>

                            {profile.broker_name === "SHOONYA" && (
                                <button
                                    onClick={() => setIsShoonyaLoginModalOpen(true)}
                                    className="btn btn-primary btn-xs"
                                >
                                    Login
                                </button>
                            )}
                        </div>

                    )}

                </div>
                <div>
                    <p className="text-gray-400 text-sm">Margin Equity</p>
                    <p className="font-medium">₹{equityMargin?.toLocaleString()}</p>
                    <div className="flex space-x-2 mt-1">
                        {brokerLoggedIn && <button
                            onClick={handleRefreshMargin}
                            disabled={refreshing}
                            className={`btn btn-ghost btn-xs ${refreshing ? "animate-spin" : ""}`}
                            title="Refresh Margin"
                        >
                            <RotateCw size={16} />
                        </button>}
                        {brokerLoggedIn && <button
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
                        <div className="flex items-center space-x-2 flex-wrap">
                            <span className={`px-2 my-1 py-1 rounded text-xs ${profile.verified ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                                {profile.verified ? 'Verified' : 'Unverified'}
                            </span>
                            <span className={`px-2 my-1 py-1 rounded text-xs ${profile.is_active ? 'bg-blue-900 text-blue-300' : 'bg-gray-700 text-gray-300'}`}>
                                {profile.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <span className={`px-2 my-1 py-1 rounded text-xs ${profile.auto_trade_allowed ? 'bg-purple-900 text-purple-300' : 'bg-gray-700 text-gray-300'}`}>
                                {profile.auto_trade_allowed ? 'Auto Trade ON' : 'Auto Trade OFF'}
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
            <LivePositionsModal
                isOpen={showPositionsModal}
                onClose={() => setShowPositionsModal(false)}
                positions={livePositions}
                brokerName={profile.broker_name}
            />

            {/* Shoonya Login Modal */}
            {isShoonyaLoginModalOpen && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Login to Shoonya</h3>
                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text">Password</span>
                            </label>
                            <input
                                type="password"
                                placeholder="Enter Shoonya Password"
                                className="input input-bordered w-full"
                                value={shoonyaPassword}
                                onChange={(e) => setShoonyaPassword(e.target.value)}
                            />
                        </div>
                        <div className="modal-action">
                            <button
                                className="btn"
                                onClick={() => {
                                    setIsShoonyaLoginModalOpen(false);
                                    setShoonyaPassword("");
                                }}
                                disabled={isLoggingInShoonya}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleShoonyaLogin}
                                disabled={isLoggingInShoonya}
                            >
                                {isLoggingInShoonya ? <span className="loading loading-spinner"></span> : "Login"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

}
