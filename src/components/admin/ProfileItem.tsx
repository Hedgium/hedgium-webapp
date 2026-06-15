import React, { useEffect, useState } from 'react';
import { Profile } from '@/types/profile';
import { getBrokerAccessToken } from '@/services/profile';
import { authFetch } from '@/utils/api';
import { brokerLoginWithPolling } from '@/utils/brokerLogin';
import { formatMoneyIN } from '@/utils/formatNumber';
import useAlert from '@/hooks/useAlert';
import { RotateCw, Edit2, TrendingUp, KeyRound, Plus, Calendar, ChevronDown, LogOut, FileText, Upload, Copy } from 'lucide-react';
import Link from 'next/link';
import { userRoleLabel } from '@/constants/userRoles';

interface ProfileItemProps {
    profile: Profile;
    onEdit?: (profile: Profile) => void;
    onAddPlan?: (profile: Profile) => void;
    onModifyPlan?: (profile: Profile) => void;
}

type DocumentKind = "image" | "pdf" | "other";
type UserDocumentResponse = {
    kyc_document_url?: string | null;
};

const getDocumentKind = (url?: string | null): DocumentKind => {
    if (!url) {
        return "other";
    }
    const cleanUrl = url.split("?")[0].toLowerCase();
    if (cleanUrl.endsWith(".pdf")) {
        return "pdf";
    }
    if (/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(cleanUrl)) {
        return "image";
    }
    return "other";
};

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
    const [isClearingBrokerToken, setIsClearingBrokerToken] = useState(false);
    const [isFetchingBrokerToken, setIsFetchingBrokerToken] = useState(false);

    const [brokerLoggedIn, setBrokerLoggedIn] = useState(profile.broker_logged_in);

    const [isKycUploadModalOpen, setIsKycUploadModalOpen] = useState(false);
    const [kycFile, setKycFile] = useState<File | null>(null);
    const [isUploadingKyc, setIsUploadingKyc] = useState(false);
    const [kycDocumentUrl, setKycDocumentUrl] = useState<string | null | undefined>(
        profile.user.kyc_document_url
    );

    const alert = useAlert();

    useEffect(() => {
        setKycDocumentUrl(profile.user.kyc_document_url);
    }, [profile.user.kyc_document_url]);

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

    const handleUploadKyc = async () => {
        if (!kycFile) {
            alert.error("Please select a file to upload");
            return;
        }
        setIsUploadingKyc(true);
        try {
            const body = new FormData();
            body.append("kyc_document", kycFile);
            const response = await authFetch(`users/${profile.user.id}/uploads/`, {
                method: "PUT",
                body,
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                alert.error(err.detail || err.message || "Failed to upload KYC document");
                return;
            }
            const data = (await response.json()) as UserDocumentResponse;
            let uploadedUrl = data.kyc_document_url ?? null;
            if (!uploadedUrl) {
                const userResponse = await authFetch(`users/${profile.user.id}/`);
                if (userResponse.ok) {
                    const userData = (await userResponse.json()) as UserDocumentResponse;
                    uploadedUrl = userData.kyc_document_url ?? null;
                }
            }
            setKycDocumentUrl(uploadedUrl);
            if (!uploadedUrl) {
                alert.error("KYC document uploaded, but the document URL was not returned");
                return;
            }
            alert.success("KYC document uploaded");
            setIsKycUploadModalOpen(false);
            setKycFile(null);
        } catch (error) {
            console.error("KYC upload error:", error);
            alert.error("An error occurred while uploading the KYC document");
        } finally {
            setIsUploadingKyc(false);
        }
    };


    const handleBrokerLogin = async () => {
        if (!brokerPassword) {
            alert.error("Please enter a password / mpin");
            return;
        }

        setIsLoggingInBroker(true);
        try {
            const result = await brokerLoginWithPolling({
                brokerName: profile.broker_name,
                profileId: profile.id,
                secret: brokerPassword,
            });

            if (result.status === "success") {
                alert.success(`${profile.broker_name} login successful`);
                setIsBrokerLoginModalOpen(false);
                setBrokerPassword("");
                setBrokerLoggedIn(true);
            } else {
                alert.error(`Login failed: ${result.message || "Unknown error"}`);
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
                if (data.margin_equity !== undefined) {
                    setEquityMargin(data.margin_equity);
                }
            } else {
                setBrokerLoggedIn(false);
                const errorMsg =
                    data.message ||
                    data.detail ||
                    "Token was not saved. Margin could not be fetched from the broker.";
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

    const handleBrokerLogout = async () => {
        setIsClearingBrokerToken(true);
        try {
            const response = await authFetch("users/clear-broker-token/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ profile_id: profile.id }),
            });
            const data = await response.json().catch(() => ({}));

            if (response.ok && data.status === "success") {
                alert.success(data.message || "Broker access token cleared");
                setBrokerLoggedIn(false);
            } else {
                const msg =
                    (data as { detail?: string; message?: string }).detail ||
                    (data as { detail?: string; message?: string }).message ||
                    "Failed to clear broker token";
                alert.error(msg);
            }
        } catch (error) {
            console.error("Broker logout error:", error);
            alert.error("An error occurred while clearing the broker token");
        } finally {
            setIsClearingBrokerToken(false);
        }
    };

    const handleCopyBrokerToken = async () => {
        setIsFetchingBrokerToken(true);
        try {
            const data = await getBrokerAccessToken(profile.id);
            if (!data.broker_access_token) {
                alert.error("No broker access token stored");
                return;
            }
            await navigator.clipboard.writeText(data.broker_access_token);
            alert.success("Broker access token copied");
        } catch (error) {
            console.error("Copy broker token error:", error);
            const message = error instanceof Error ? error.message : "Could not copy broker access token";
            alert.error(message);
        } finally {
            setIsFetchingBrokerToken(false);
        }
    };

    const handleLoadCurrentBrokerToken = async () => {
        setIsFetchingBrokerToken(true);
        try {
            const data = await getBrokerAccessToken(profile.id);
            if (!data.broker_access_token) {
                alert.error("No broker access token stored");
                return;
            }
            setBrokerAccessToken(data.broker_access_token);
            alert.success("Current broker access token loaded");
        } catch (error) {
            console.error("Load broker token error:", error);
            const message = error instanceof Error ? error.message : "Failed to load broker access token";
            alert.error(message);
        } finally {
            setIsFetchingBrokerToken(false);
        }
    };

    const openBrokerTokenModal = () => {
        setBrokerAccessToken("");
        setIsBrokerTokenModalOpen(true);
    };

    const u = profile.user as typeof profile.user & { aadhar_number?: string | null; pan_number?: string | null; pan_document_url?: string | null; aadhar_document_url?: string | null };

    const panDocumentKind = getDocumentKind(u.pan_document_url);
    const aadharDocumentKind = getDocumentKind(u.aadhar_document_url);
    const kycDocumentKind = getDocumentKind(kycDocumentUrl);
    const proxyAddress = (profile.broker_proxy_pool?.ip_address || profile.proxy_host || "").trim();
    const proxyPort = profile.broker_proxy_pool?.port ?? profile.proxy_port ?? 443;
    const proxyUsername = (profile.broker_proxy_pool?.username || profile.proxy_username || "").trim();
    const proxyOn = Boolean(proxyAddress);
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
                        {profile.user.role ? (
                            <span className="badge badge-outline badge-xs whitespace-nowrap">
                                {userRoleLabel(profile.user.role)}
                            </span>
                        ) : null}
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
                    {profile.relationship_manager && (
                        <p className="text-xs text-base-content/50">
                            <span className="font-medium text-base-content/65">RM:</span>{' '}
                            {profile.relationship_manager.first_name}{' '}
                            {profile.relationship_manager.last_name}
                            <span className="mx-1 opacity-40">·</span>
                            {profile.relationship_manager.email}
                        </p>
                    )}
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
                                        {proxyAddress}:{proxyPort}
                                        {proxyUsername ? " · auth" : ""}
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
                                <div className="tooltip tooltip-bottom lg:tooltip-left" data-tip="Broker logout (clear access token)">
                                    <button
                                        type="button"
                                        onClick={handleBrokerLogout}
                                        disabled={isClearingBrokerToken}
                                        className="btn btn-ghost btn-sm btn-square text-error"
                                        aria-label="Broker logout"
                                    >
                                        {isClearingBrokerToken ? (
                                            <span className="loading loading-spinner loading-sm" />
                                        ) : (
                                            <LogOut size={18} />
                                        )}
                                    </button>
                                </div>
                                <div className="tooltip tooltip-bottom lg:tooltip-left" data-tip="Copy access token">
                                    <button
                                        type="button"
                                        onClick={handleCopyBrokerToken}
                                        disabled={isFetchingBrokerToken}
                                        className="btn btn-ghost btn-sm btn-square"
                                        aria-label="Copy broker access token"
                                    >
                                        {isFetchingBrokerToken ? (
                                            <span className="loading loading-spinner loading-sm" />
                                        ) : (
                                            <Copy size={18} />
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                        <div
                            className="tooltip tooltip-bottom lg:tooltip-left"
                            data-tip={brokerLoggedIn ? "Update token" : "Set access token"}
                        >
                            <button
                                type="button"
                                onClick={openBrokerTokenModal}
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
                            <div className="tooltip tooltip-bottom lg:tooltip-left" data-tip="Modify plan and dates">
                                <button
                                    type="button"
                                    onClick={() => onModifyPlan(profile)}
                                    className="btn btn-ghost btn-sm btn-square text-warning"
                                    aria-label="Modify subscription plan and dates"
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
                                    {panDocumentKind === "image" ? (
                                        <img src={u.pan_document_url} alt="PAN" className="w-10 h-10 object-cover rounded border border-base-300" />
                                    ) : (
                                        <span className="w-10 h-10 rounded border border-base-300 bg-base-200 grid place-items-center">
                                            <FileText size={16} />
                                        </span>
                                    )}
                                    <span className="link link-primary text-xs">{panDocumentKind === "pdf" ? "PAN PDF" : "PAN doc"}</span>
                                </a>
                            ) : (
                                <span className="text-xs opacity-50">PAN doc —</span>
                            )}
                            {u.aadhar_document_url ? (
                                <a href={u.aadhar_document_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1" title="View Aadhar">
                                    {aadharDocumentKind === "image" ? (
                                        <img src={u.aadhar_document_url} alt="Aadhar" className="w-10 h-10 object-cover rounded border border-base-300" />
                                    ) : (
                                        <span className="w-10 h-10 rounded border border-base-300 bg-base-200 grid place-items-center">
                                            <FileText size={16} />
                                        </span>
                                    )}
                                    <span className="link link-primary text-xs">{aadharDocumentKind === "pdf" ? "Aadhar PDF" : "Aadhar doc"}</span>
                                </a>
                            ) : (
                                <span className="text-xs opacity-50">Aadhar doc —</span>
                            )}
                            {kycDocumentUrl ? (
                                <a href={kycDocumentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1" title="View KYC document">
                                    {kycDocumentKind === "image" ? (
                                        <img src={kycDocumentUrl} alt="KYC" className="w-10 h-10 object-cover rounded border border-base-300" />
                                    ) : (
                                        <span className="w-10 h-10 rounded border border-base-300 bg-base-200 grid place-items-center">
                                            <FileText size={16} />
                                        </span>
                                    )}
                                    <span className="link link-primary text-xs">{kycDocumentKind === "pdf" ? "KYC PDF" : "KYC doc"}</span>
                                </a>
                            ) : (
                                <span className="text-xs opacity-50">KYC doc —</span>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    setKycFile(null);
                                    setIsKycUploadModalOpen(true);
                                }}
                                className="btn btn-ghost btn-xs gap-1"
                                title={kycDocumentUrl ? "Replace KYC document" : "Upload KYC document"}
                            >
                                <Upload size={12} />
                                {kycDocumentUrl ? "Replace KYC" : "Upload KYC"}
                            </button>
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
                                name={`broker-login-secret-${profile.id}`}
                                autoComplete="off"
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
                                type="text"
                                name={`broker-access-token-${profile.id}`}
                                autoComplete="off"
                                spellCheck={false}
                                inputMode="text"
                                placeholder={`Enter ${profile.broker_name} access token`}
                                className="input input-bordered w-full font-mono text-sm"
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
                                        : "Provide the broker access token directly"}
                                </span>
                            </label>
                            {brokerLoggedIn ? (
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-sm mt-2"
                                    onClick={handleLoadCurrentBrokerToken}
                                    disabled={isFetchingBrokerToken || isSettingBrokerToken}
                                >
                                    {isFetchingBrokerToken ? (
                                        <span className="loading loading-spinner loading-sm" />
                                    ) : (
                                        "Load current token"
                                    )}
                                </button>
                            ) : null}
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

            {isKycUploadModalOpen && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">
                            {kycDocumentUrl ? "Replace KYC document" : "Upload KYC document"}
                        </h3>
                        <div className="form-control w-full mb-4">
                            <label className="label">
                                <span className="label-text">Document file (PDF or image)</span>
                            </label>
                            <input
                                type="file"
                                accept="application/pdf,image/*"
                                className="file-input file-input-bordered w-full"
                                onChange={(e) => setKycFile(e.target.files?.[0] ?? null)}
                                disabled={isUploadingKyc}
                            />
                            <label className="label">
                                <span className="label-text-alt text-base-content/60">
                                    Uploaded for {profile.user.email}. Replaces any existing KYC document.
                                </span>
                            </label>
                        </div>
                        <div className="modal-action">
                            <button
                                type="button"
                                className="btn"
                                onClick={() => {
                                    setIsKycUploadModalOpen(false);
                                    setKycFile(null);
                                }}
                                disabled={isUploadingKyc}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleUploadKyc}
                                disabled={isUploadingKyc || !kycFile}
                            >
                                {isUploadingKyc ? <span className="loading loading-spinner"></span> : "Upload"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

}
