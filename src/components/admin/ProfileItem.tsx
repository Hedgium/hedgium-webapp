import React, { useState } from 'react';
import { Profile } from '@/types/profile';
import { authFetch } from '@/utils/api';
import { formatMoneyIN } from '@/utils/formatNumber';
import useAlert from '@/hooks/useAlert';
import { RotateCw, Edit2, TrendingUp, KeyRound, Plus, Calendar } from 'lucide-react';
import Link from 'next/link';

interface ProfileItemProps {
    profile: Profile;
    onEdit?: (profile: Profile) => void;
    onAddPlan?: (profile: Profile) => void;
    onModifyPlan?: (profile: Profile) => void;
}

export default function ProfileItem({ profile, onEdit, onAddPlan, onModifyPlan }: ProfileItemProps) {
    const [refreshing, setRefreshing] = useState(false);
    const [sendingReminder, setSendingReminder] = useState(false);
    const [equityMargin, setEquityMargin] = useState(profile.margin_equity);

    // Broker Login State (generic for SHOONYA, ZERODHA, etc.)
    const [isBrokerLoginModalOpen, setIsBrokerLoginModalOpen] = useState(false);
    const [brokerPassword, setBrokerPassword] = useState("");
    const [isLoggingInBroker, setIsLoggingInBroker] = useState(false);
    
    // Broker Token Set State (for all brokers)
    const [isBrokerTokenModalOpen, setIsBrokerTokenModalOpen] = useState(false);
    const [brokerAccessToken, setBrokerAccessToken] = useState("");
    const [isSettingBrokerToken, setIsSettingBrokerToken] = useState(false);
    
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

    // const handleViewLivePositions = () => {
    //     router.push(`/admin/profiles/${profile.id}/live`);
    // };

    const handleSendLoginReminder = async () => {
        setSendingReminder(true);
        try {
            // Assuming endpoint structure, can be adjusted
            await authFetch(`notifications/`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        user_id: profile.user.id,
                        type: 'INFO',
                        title: 'Login reminder',
                        message: 'Please login to your account to continue'
                    })
                });
            alert.success("Login reminder sent successfully");
            // alert('Login reminder sent');
        } catch {
            alert.error('Error sending login reminder:');
            // alert('Failed to send login reminder');
        } finally {
            setSendingReminder(false);
        }
    };


    const handleBrokerLogin = async () => {
        if (!brokerPassword) {
            alert.error("Please enter a password / mpin");
            return;
        }

        // Determine API endpoint based on broker name
        const brokerEndpoints: Record<string, string> = {
            "SHOONYA": "users/shoonya-login/",
            "ZERODHA": "users/zerodha-login/",
            "KOTAKNEO": "users/kotakneo-login/",
        };

        const endpoint = brokerEndpoints[profile.broker_name];
        if (!endpoint) {
            alert.error(`Login not supported for ${profile.broker_name}`);
            return;
        }

        setIsLoggingInBroker(true);
        try {
            const response = await authFetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    "profile_id": String(profile.id),
                    ...(profile.broker_name === "KOTAKNEO"
                        ? { "mpin": brokerPassword }
                        : { "pwd": brokerPassword })
                }),
            });

            const data = await response.json();

            if (data.status === "success") {
                alert.success(`${profile.broker_name} login successful`);
                setIsBrokerLoginModalOpen(false);
                setBrokerPassword("");
                setBrokerLoggedIn(true);
            } else {
                alert.error(`Login failed: ${data.message || JSON.stringify(data)}`);
            }

        } catch (error) {
            console.error(`${profile.broker_name} login error:`, error);
            alert.error("An error occurred during login");
        } finally {
            setIsLoggingInBroker(false);
        }
    };

    const handleSetBrokerToken = async () => {
        if (!brokerAccessToken) {
            alert.error("Please enter broker access token");
            return;
        }

        setIsSettingBrokerToken(true);
        try {
            const response = await authFetch("users/set-broker-token/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    profile_id: profile.id,
                    broker_access_token: brokerAccessToken
                }),
            });

            const data = await response.json();

            if (response.ok && data.status === "success") {
                alert.success(data.message || `${profile.broker_name} access token validated and set successfully`);
                setIsBrokerTokenModalOpen(false);
                setBrokerAccessToken("");
                setBrokerLoggedIn(true);
                // Update margin equity if returned in response
                if (data.margin_equity !== undefined) {
                    setEquityMargin(data.margin_equity);
                }
            } else {
                // Handle error response
                const errorMsg = data.message || data.detail || `Failed to set token: ${JSON.stringify(data)}`;
                alert.error(errorMsg);
            }

        } catch (error: unknown) {
            console.error("Set broker token error:", error);
            const errorMessage = (error as { detail?: string; message?: string })?.detail || 
                                 (error as { detail?: string; message?: string })?.message || 
                                 "An error occurred";
            alert.error(`Error: ${errorMessage}`);
        } finally {
            setIsSettingBrokerToken(false);
        }
    };

    const u = profile.user as typeof profile.user & { aadhar_number?: string | null; pan_number?: string | null; pan_document_url?: string | null; aadhar_document_url?: string | null };

    return (
        <div className="bg-base-100 rounded-lg p-4 mb-4 border border-base-300">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                    <p className="text-gray-400 text-sm">User</p>
                    <Link
                        href={`/admin/profiles/${profile.id}`}
                        className="font-medium link link-hover"
                    >
                        {profile.user.email}
                    </Link>
                    <p className="text-sm text-gray-500">{profile.user.first_name} {profile.user.last_name} · ID: {profile.user_id}</p>
                    {profile.user.last_login && (
                        <p className="text-sm text-gray-500">Last login: {new Date(profile.user.last_login).toLocaleString()}</p>
                    )}
                </div>
                <div>
                    <p className="text-gray-400 text-sm">Aadhar / PAN / Documents</p>
                    <p className="text-xs text-gray-500">
                        {u.aadhar_number ? <span>Aadhar: {u.aadhar_number}</span> : <span className="opacity-60">Aadhar: —</span>}
                    </p>
                    <p className="text-xs text-gray-500">
                        {u.pan_number ? <span>PAN: {u.pan_number}</span> : <span className="opacity-60">PAN: —</span>}
                    </p>
                    <div className="flex gap-2 mt-1 flex-wrap items-center">
                        {u.pan_document_url ? (
                            <a href={u.pan_document_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1" title="View PAN">
                                <img src={u.pan_document_url} alt="PAN" className="w-10 h-10 object-cover rounded border border-base-300" />
                                <span className="link link-primary text-xs">PAN</span>
                            </a>
                        ) : (
                            <span className="text-xs opacity-60">PAN —</span>
                        )}
                        {u.aadhar_document_url ? (
                            <a href={u.aadhar_document_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1" title="View Aadhar">
                                <img src={u.aadhar_document_url} alt="Aadhar" className="w-10 h-10 object-cover rounded border border-base-300" />
                                <span className="link link-primary text-xs">Aadhar</span>
                            </a>
                        ) : (
                            <span className="text-xs opacity-60">Aadhar —</span>
                        )}
                    </div>
                </div>
                <div>
                    <p className="text-gray-400 text-sm">Broker</p>
                    <p className="font-medium">{profile.broker_name}</p>
                    <p className="text-sm text-gray-500">HID: {profile.id}, BROKER ID: {profile.broker_user_id}</p>

                    {brokerLoggedIn ? (
                        <span className="text-sm text-green-400">✓ Broker Logged In</span>
                    ) : (
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={handleSendLoginReminder}
                                disabled={sendingReminder}
                                className="btn btn-secondary btn-xs"
                            >
                                {sendingReminder ? 'Sending...' : 'Send Login Reminder'}
                            </button>

                            {(profile.broker_name === "SHOONYA" || profile.broker_name === "ZERODHA" || profile.broker_name === "KOTAKNEO") && (
                                <button
                                    onClick={() => setIsBrokerLoginModalOpen(true)}
                                    className="btn btn-primary btn-xs"
                                >
                                    Login
                                </button>
                            )}
                            
                            {/* Set Broker Token Button - Available for all brokers */}
                            <button
                                onClick={() => setIsBrokerTokenModalOpen(true)}
                                className="btn btn-outline btn-xs"
                                title="Set broker access token directly"
                            >
                                Set Token
                            </button>
                        </div>

                    )}

                </div>
                <div>
                    <p className="text-gray-400 text-sm">Margin & Action</p>
                    <p className="text-sm font-medium">{formatMoneyIN(equityMargin, { decimals: 0 })}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                        {brokerLoggedIn && (
                            <>
                                <div className="tooltip tooltip-right" data-tip="Refresh Margin">
                                    <button
                                        onClick={handleRefreshMargin}
                                        disabled={refreshing}
                                        className={`btn btn-ghost btn-xs btn-square ${refreshing ? "animate-spin" : ""}`}
                                        title="Refresh Margin"
                                    >
                                        <RotateCw size={16} />
                                    </button>
                                </div>
                                <div className="tooltip tooltip-right" data-tip="View Live Positions">
                                    <Link
                                        href={`/admin/profiles/${profile.id}/live`}
                                        className="btn btn-ghost btn-xs btn-square text-green-400"
                                        title="View Live Positions"
                                    >
                                        <TrendingUp size={16} />
                                    </Link>
                                </div>
                                <div className="tooltip tooltip-right" data-tip="Update Token">
                                    <button
                                        onClick={() => setIsBrokerTokenModalOpen(true)}
                                        className="btn btn-ghost btn-xs btn-square text-amber-400"
                                        title="Update Token"
                                    >
                                        <KeyRound size={16} />
                                    </button>
                                </div>
                            </>
                        )}
                        {onEdit && (
                            <div className="tooltip tooltip-right" data-tip="Edit Profile">
                                <button
                                    onClick={() => onEdit(profile)}
                                    className="btn btn-ghost btn-xs btn-square text-blue-400"
                                    title="Edit Profile"
                                >
                                    <Edit2 size={16} />
                                </button>
                            </div>
                        )}
                        {onAddPlan && !profile.subscription && (
                            <div className="tooltip tooltip-right" data-tip="Add Plan">
                                <button
                                    onClick={() => onAddPlan(profile)}
                                    className="btn btn-ghost btn-xs btn-square text-primary"
                                    title="Add Plan"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        )}
                        {onModifyPlan && profile.subscription && (
                            <div className="tooltip tooltip-right" data-tip="Modify Dates">
                                <button
                                    onClick={() => onModifyPlan(profile)}
                                    className="btn btn-ghost btn-xs btn-square text-amber-400"
                                    title="Modify Dates"
                                >
                                    <Calendar size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <div>
                    <p className="text-gray-400 text-sm">Status</p>
                    <div className="flex flex-col gap-1.5">
                        <div className="flex flex-wrap gap-1.5 items-center">
                            <span className={`px-2 py-0.5 rounded text-sm ${profile.is_active ? 'bg-blue-900 text-blue-300' : 'bg-gray-700 text-gray-300'}`}>
                                {profile.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-sm ${profile.auto_trade_allowed ? 'bg-purple-900 text-purple-300' : 'bg-gray-700 text-gray-300'}`}>
                                {profile.auto_trade_allowed ? 'Auto ON' : 'Auto OFF'}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-sm ${profile.verified ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`} title="Profile verified">
                                P ✓
                            </span>
                            <span className={`px-2 py-0.5 rounded text-sm ${profile.user.verified ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`} title="User verified">
                                U ✓
                            </span>
                        </div>
                        {profile.subscription ? (
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                                <span className="text-gray-500">
                                    Plan: <span className="font-medium text-gray-300">{profile.subscription.plan.name}</span>
                                    <span className={`ml-1 ${profile.subscription.is_valid ? 'text-green-400' : 'text-red-400'}`}>
                                        · {new Date(profile.subscription.end_date).toLocaleDateString()} ({Math.ceil((new Date(profile.subscription.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}d)
                                    </span>
                                </span>
                            </div>
                        ) : (
                            <span className="text-sm text-gray-500">No subscription</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Broker Login Modal (SHOONYA, ZERODHA) */}
            {isBrokerLoginModalOpen && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Login to {profile.broker_name}</h3>
                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text">{profile.broker_name === "KOTAKNEO" ? "MPIN" : "Password"}</span>
                            </label>
                            <input
                                type="password"
                                placeholder={`Enter ${profile.broker_name === "KOTAKNEO" ? "MPIN" : "Password"}`}
                                className="input input-bordered w-full"
                                value={brokerPassword}
                                onChange={(e) => setBrokerPassword(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !isLoggingInBroker && brokerPassword) {
                                        handleBrokerLogin();
                                    }
                                }}
                            />
                        </div>
                        <div className="modal-action">
                            <button
                                className="btn"
                                onClick={() => {
                                    setIsBrokerLoginModalOpen(false);
                                    setBrokerPassword("");
                                }}
                                disabled={isLoggingInBroker}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleBrokerLogin}
                                disabled={isLoggingInBroker}
                            >
                                {isLoggingInBroker ? <span className="loading loading-spinner"></span> : "Login"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Set / Update Broker Token Modal - Available for all brokers */}
            {isBrokerTokenModalOpen && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">
                            {brokerLoggedIn ? "Update" : "Set"} {profile.broker_name} Access Token
                        </h3>
                        <div className="form-control w-full mb-4">
                            <label className="label">
                                <span className="label-text">Broker Access Token</span>
                            </label>
                            <input
                                type="password"
                                placeholder={`Enter ${profile.broker_name} access token`}
                                className="input input-bordered w-full"
                                value={brokerAccessToken}
                                onChange={(e) => setBrokerAccessToken(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !isSettingBrokerToken && brokerAccessToken) {
                                        handleSetBrokerToken();
                                    }
                                }}
                            />
                            <label className="label">
                                <span className="label-text-alt">
                                    {brokerLoggedIn
                                        ? "Enter the new access token to replace the current one."
                                        : "Provide the broker access token directly. This will update the profile's access token."}
                                </span>
                            </label>
                        </div>
                        <div className="modal-action">
                            <button
                                className="btn"
                                onClick={() => {
                                    setIsBrokerTokenModalOpen(false);
                                    setBrokerAccessToken("");
                                }}
                                disabled={isSettingBrokerToken}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSetBrokerToken}
                                disabled={isSettingBrokerToken}
                            >
                                {isSettingBrokerToken ? <span className="loading loading-spinner"></span> : (brokerLoggedIn ? "Update Token" : "Set Token")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

}
