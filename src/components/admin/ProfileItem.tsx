import React, { useState } from 'react';
import { Profile } from '@/types/profile';
import { authFetch } from '@/utils/api';
import { formatMoneyIN } from '@/utils/formatNumber';
import useAlert from '@/hooks/useAlert';
import { RotateCw, Edit2, TrendingUp, KeyRound, Plus, Calendar, ChevronDown } from 'lucide-react';
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

    const proxyOn = Boolean((profile.proxy_host || "").trim());
    const proxyHost = (profile.proxy_host || "").trim();
    const daysLeft = profile.subscription
        ? Math.ceil(
              (new Date(profile.subscription.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )
        : null;

    return (
        <div className="bg-base-100 rounded-xl p-4 mb-4 border border-base-300">
            {/* lg: center uses 1fr so stats span all space between identity and a tight action column */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,17.5rem)_minmax(0,1fr)_auto] lg:items-start lg:gap-x-3">
                {/* Identity + flags */}
                <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <Link
                            href={`/admin/profiles/${profile.id}`}
                            className="font-medium link link-hover break-all sm:break-normal lg:truncate lg:max-w-none"
                        >
                            {profile.user.email}
                        </Link>
                        <span className="text-base-content/40 hidden sm:inline">·</span>
                        <span className="text-sm font-medium text-base-content/90">{profile.broker_name}</span>
                        {proxyOn && (
                            <span className="badge badge-success badge-xs whitespace-nowrap">Order proxy</span>
                        )}
                        {brokerLoggedIn ? (
                            <span className="badge badge-success badge-xs whitespace-nowrap">Broker in</span>
                        ) : (
                            <span className="badge badge-ghost badge-xs whitespace-nowrap">Broker out</span>
                        )}
                    </div>
                    <p className="text-xs text-base-content/55">
                        {profile.user.first_name} {profile.user.last_name}
                        <span className="mx-1.5 opacity-40">·</span>
                        User #{profile.user_id}
                        {profile.user.last_login && (
                            <>
                                <span className="mx-1.5 opacity-40">·</span>
                                Last login {new Date(profile.user.last_login).toLocaleString()}
                            </>
                        )}
                    </p>
                    <div className="flex flex-wrap gap-1.5 items-center">
                        <span className={`px-2 py-0.5 rounded text-xs ${profile.is_active ? "bg-primary/20 text-primary" : "bg-base-300 text-base-content/60"}`}>
                            {profile.is_active ? "Active" : "Inactive"}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs ${profile.auto_trade_allowed ? "bg-secondary/20 text-secondary" : "bg-base-300 text-base-content/60"}`}>
                            {profile.auto_trade_allowed ? "Auto ON" : "Auto OFF"}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs ${profile.verified ? "bg-success/20 text-success" : "bg-error/15 text-error"}`} title="Profile verified">
                            P {profile.verified ? "✓" : "✗"}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs ${profile.user.verified ? "bg-success/20 text-success" : "bg-error/15 text-error"}`} title="User verified">
                            U {profile.user.verified ? "✓" : "✗"}
                        </span>
                    </div>
                </div>

                {/* Grows with 1fr: stats use full width between identity and actions */}
                <div className="min-w-0 w-full rounded-xl border border-base-300/70 bg-base-200/35 px-4 py-3">
                    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)]">
                        <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-base-content/45">
                                Margin equity
                            </p>
                            <p className="text-lg font-semibold tabular-nums leading-tight text-base-content">
                                {formatMoneyIN(equityMargin, { decimals: 0 })}
                            </p>
                        </div>
                        <div className="min-w-0 border-t border-base-300/50 pt-3 sm:border-l sm:border-t-0 sm:border-base-300/50 sm:pl-6 sm:pt-0">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-base-content/45">
                                IDs
                            </p>
                            <p className="font-mono text-xs text-base-content/85 leading-snug">
                                HID {profile.id}
                            </p>
                            <p
                                className="font-mono text-xs text-base-content/70 break-all sm:truncate"
                                title={profile.broker_user_id || undefined}
                            >
                                Broker {profile.broker_user_id || "—"}
                            </p>
                        </div>
                        <div className="min-w-0 border-t border-base-300/50 pt-3 sm:col-span-1 sm:border-l sm:border-t-0 sm:border-base-300/50 sm:pl-6 sm:pt-0">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-base-content/45">
                                Proxy · plan
                            </p>
                            <p className="text-xs text-base-content/80 leading-snug">
                                {proxyOn ? (
                                    <span className="text-success break-all">
                                        {proxyHost}:{profile.proxy_port ?? 443}
                                        {(profile.proxy_username || "").trim() ? " · auth" : ""}
                                    </span>
                                ) : (
                                    <span className="text-base-content/50">Orders direct</span>
                                )}
                            </p>
                            {profile.subscription ? (
                                <p className="text-xs text-base-content/70 mt-0.5" title={profile.subscription.plan.name}>
                                    <span className="font-medium text-base-content/90">{profile.subscription.plan.name}</span>
                                    <span className={profile.subscription.is_valid ? " text-success" : " text-warning"}>
                                        {" "}
                                        · {daysLeft !== null && daysLeft >= 0 ? `${daysLeft}d` : "ended"}
                                    </span>
                                </p>
                            ) : (
                                <p className="text-xs text-base-content/45 mt-0.5">No plan</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Narrow column: only as wide as controls (no empty 25% track) */}
                <div className="flex min-w-0 flex-col gap-2 border-t border-base-300 pt-3 lg:border-t-0 lg:border-l lg:border-base-300 lg:pl-3 lg:pt-0">
                    <div className="flex flex-wrap justify-end gap-1">
                        {brokerLoggedIn && (
                            <>
                                <div className="tooltip tooltip-bottom lg:tooltip-left" data-tip="Refresh margin">
                                    <button
                                        type="button"
                                        onClick={handleRefreshMargin}
                                        disabled={refreshing}
                                        className={`btn btn-ghost btn-sm btn-square ${refreshing ? "animate-spin" : ""}`}
                                        aria-label="Refresh margin"
                                    >
                                        <RotateCw size={18} />
                                    </button>
                                </div>
                                <div className="tooltip tooltip-bottom lg:tooltip-left" data-tip="Live positions">
                                    <Link
                                        href={`/admin/profiles/${profile.id}/live`}
                                        className="btn btn-ghost btn-sm btn-square text-success"
                                        aria-label="Live positions"
                                    >
                                        <TrendingUp size={18} />
                                    </Link>
                                </div>
                            </>
                        )}
                        <div
                            className="tooltip tooltip-bottom lg:tooltip-left"
                            data-tip={brokerLoggedIn ? "Update token" : "Set access token"}
                        >
                            <button
                                type="button"
                                onClick={() => setIsBrokerTokenModalOpen(true)}
                                className="btn btn-ghost btn-sm btn-square text-warning"
                                aria-label={brokerLoggedIn ? "Update token" : "Set access token"}
                            >
                                <KeyRound size={18} />
                            </button>
                        </div>
                        {onEdit && (
                            <div className="tooltip tooltip-bottom lg:tooltip-left" data-tip="Edit profile (incl. order proxy)">
                                <button
                                    type="button"
                                    onClick={() => onEdit(profile)}
                                    className="btn btn-ghost btn-sm btn-square text-info"
                                    aria-label="Edit profile"
                                >
                                    <Edit2 size={18} />
                                </button>
                            </div>
                        )}
                        {onAddPlan && !profile.subscription && (
                            <div className="tooltip tooltip-bottom lg:tooltip-left" data-tip="Add plan">
                                <button
                                    type="button"
                                    onClick={() => onAddPlan(profile)}
                                    className="btn btn-ghost btn-sm btn-square text-primary"
                                    aria-label="Add plan"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                        )}
                        {onModifyPlan && profile.subscription && (
                            <div className="tooltip tooltip-bottom lg:tooltip-left" data-tip="Modify plan dates">
                                <button
                                    type="button"
                                    onClick={() => onModifyPlan(profile)}
                                    className="btn btn-ghost btn-sm btn-square text-warning"
                                    aria-label="Modify plan dates"
                                >
                                    <Calendar size={18} />
                                </button>
                            </div>
                        )}
                    </div>
                    {/* Desktop: stack broker actions under icons so the row stays one line tall */}
                    {!brokerLoggedIn && (
                        <div className="hidden w-full min-w-[11rem] flex-col gap-1.5 lg:flex">
                            <button
                                type="button"
                                onClick={handleSendLoginReminder}
                                disabled={sendingReminder}
                                className="btn btn-secondary btn-sm w-full whitespace-normal"
                            >
                                {sendingReminder ? "Sending…" : "Send login reminder"}
                            </button>
                            {(profile.broker_name === "SHOONYA" ||
                                profile.broker_name === "ZERODHA" ||
                                profile.broker_name === "KOTAKNEO") && (
                                <button
                                    type="button"
                                    onClick={() => setIsBrokerLoginModalOpen(true)}
                                    className="btn btn-secondary btn-outline btn-sm w-full"
                                >
                                    Broker login
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {!brokerLoggedIn && (
                <div className="mt-3 flex flex-wrap gap-2 lg:hidden">
                    <button
                        type="button"
                        onClick={handleSendLoginReminder}
                        disabled={sendingReminder}
                        className="btn btn-secondary btn-sm"
                    >
                        {sendingReminder ? "Sending…" : "Send login reminder"}
                    </button>
                    {(profile.broker_name === "SHOONYA" || profile.broker_name === "ZERODHA" || profile.broker_name === "KOTAKNEO") && (
                        <button
                            type="button"
                            onClick={() => setIsBrokerLoginModalOpen(true)}
                            className="btn btn-primary btn-sm"
                        >
                            Broker login
                        </button>
                    )}
                </div>
            )}

            <details className="group mt-3 rounded-lg border border-base-300/80 bg-base-200/25 open:bg-base-200/40">
                <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-sm text-base-content/70 hover:text-base-content [&::-webkit-details-marker]:hidden">
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50 transition-transform group-open:rotate-180" />
                    <span className="font-medium">KYC documents · subscription detail</span>
                </summary>
                <div className="border-t border-base-300/60 px-3 pb-3 pt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs font-medium text-base-content/50 mb-2">Aadhar / PAN</p>
                        <p className="text-xs text-base-content/70">
                            {u.aadhar_number ? <span>Aadhar: {u.aadhar_number}</span> : <span className="opacity-50">Aadhar: —</span>}
                        </p>
                        <p className="text-xs text-base-content/70">
                            {u.pan_number ? <span>PAN: {u.pan_number}</span> : <span className="opacity-50">PAN: —</span>}
                        </p>
                        <div className="flex gap-2 mt-2 flex-wrap items-center">
                            {u.pan_document_url ? (
                                <a href={u.pan_document_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1" title="View PAN">
                                    <img src={u.pan_document_url} alt="PAN" className="w-10 h-10 object-cover rounded border border-base-300" />
                                    <span className="link link-primary text-xs">PAN doc</span>
                                </a>
                            ) : (
                                <span className="text-xs opacity-50">PAN doc —</span>
                            )}
                            {u.aadhar_document_url ? (
                                <a href={u.aadhar_document_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1" title="View Aadhar">
                                    <img src={u.aadhar_document_url} alt="Aadhar" className="w-10 h-10 object-cover rounded border border-base-300" />
                                    <span className="link link-primary text-xs">Aadhar doc</span>
                                </a>
                            ) : (
                                <span className="text-xs opacity-50">Aadhar doc —</span>
                            )}
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-base-content/50 mb-2">Subscription</p>
                        {profile.subscription ? (
                            <div className="text-sm text-base-content/80 space-y-1">
                                <p>
                                    <span className="font-medium">{profile.subscription.plan.name}</span>
                                    <span className={`ml-2 ${profile.subscription.is_valid ? "text-success" : "text-warning"}`}>
                                        {profile.subscription.is_valid ? "Valid" : "Expired"}
                                    </span>
                                </p>
                                <p className="text-xs text-base-content/60">
                                    {new Date(profile.subscription.start_date).toLocaleDateString()}
                                    {" — "}
                                    {new Date(profile.subscription.end_date).toLocaleDateString()}
                                    <span className="ml-1">
                                        ({Math.ceil((new Date(profile.subscription.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}d left)
                                    </span>
                                </p>
                            </div>
                        ) : (
                            <p className="text-sm text-base-content/50">No active subscription</p>
                        )}
                    </div>
                </div>
            </details>

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
