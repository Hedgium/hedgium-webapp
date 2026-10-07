import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { StrategyBuilder, BuilderLeg } from '@/types/builder';
import { ChevronDown, Edit2, Trash2, RotateCw, Plus, Mail, MessageCircle, LineChart } from 'lucide-react';
import BuilderLegItem from './BuilderLegItem';
import { formatDateTimeMinutes } from '@/utils/formatDate';

const BuilderSpreadChartsModal = dynamic(
    () => import('./BuilderSpreadChartsModal'),
    { ssr: false, loading: () => null },
);

interface BuilderItemProps {
    builder: StrategyBuilder;
    onEdit: (builder: StrategyBuilder) => void;
    onDelete: (builderId: number) => void;
    onAddLeg: (builderId: number) => void;
    onEditLeg: (leg: BuilderLeg) => void;
    onDeleteLeg: (legId: number) => void;
    onRefreshStatus: (builderId: number) => void;
    onSendPnlEmails?: (builderId: number) => Promise<void>;
    onSendPnlWhatsapp?: (builderId: number) => Promise<void>;
    /** Client variant hides PnL staff actions. */
    variant?: "admin" | "client";
}

function formatSpotMap(spot: Record<string, number> | null | undefined): string | null {
    if (!spot || typeof spot !== 'object') return null;
    const parts = Object.entries(spot)
        .filter(([, v]) => v != null && Number.isFinite(Number(v)))
        .map(([sym, v]) => `${sym} ${Number(v).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`);
    return parts.length ? parts.join(' · ') : null;
}

export default function BuilderItem({
    builder,
    onEdit,
    onDelete,
    onAddLeg,
    onEditLeg,
    onDeleteLeg,
    onRefreshStatus,
    onSendPnlEmails,
    onSendPnlWhatsapp,
    variant = "admin",
}: BuilderItemProps) {
    const isClient = variant === "client";
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showSpreadCharts, setShowSpreadCharts] = useState(false);
    const [legsOpen, setLegsOpen] = useState(true);
    const [isSendingPnlEmails, setIsSendingPnlEmails] = useState(false);
    const [isSendingPnlWhatsapp, setIsSendingPnlWhatsapp] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await onRefreshStatus(builder.id);
        setIsRefreshing(false);
    };

    const handleSendPnlEmails = async () => {
        if (!onSendPnlEmails) return;
        if (!confirm(`Send PnL emails to all clients for "${builder.name}"?`)) {
            return;
        }
        setIsSendingPnlEmails(true);
        try {
            await onSendPnlEmails(builder.id);
        } finally {
            setIsSendingPnlEmails(false);
        }
    };

    const handleSendPnlWhatsapp = async () => {
        if (!onSendPnlWhatsapp) return;
        if (!confirm(`Send PnL WhatsApp to all clients for "${builder.name}"?`)) {
            return;
        }
        setIsSendingPnlWhatsapp(true);
        try {
            await onSendPnlWhatsapp(builder.id);
        } finally {
            setIsSendingPnlWhatsapp(false);
        }
    };

    const legs = [...(builder.builder_legs ?? [])].sort(
        (a, b) => a.leg_index - b.leg_index,
    );
    const spotLabel = formatSpotMap(builder.spot_by_underlying);

    return (
        <div className="bg-base-100/80 rounded-xl p-4 mb-6 border border-base-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 pb-4 border-b border-base-200">
                <div>
                    <h3 className="text-xl font-semibold text-primary flex items-center gap-2">
                        {builder.name}
                        <span className={`text-sm px-2 py-0.5 rounded-full border ${builder.status === 'ACTIVE' ? 'border-success text-success' :
                            builder.status === 'INACTIVE' ? 'border-error text-error' : 'border-base-content/40 text-base-content/60'
                            }`}>
                            {builder.status}
                        </span>
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-2 text-base text-base-content/60">
                        <span>Exch: <span className="">{builder?.exchange}</span></span>
                        <span>Entry WS: <span className="">{builder?.entry_ws}%</span></span>
                        <span>Trigger WS: <span className="">{builder?.trigger_ws ?? 0}%</span></span>
                        <span>Exit WS: <span className="">{builder?.exit_ws}%</span></span>
                        <span>Calc WS: <span className="">{builder?.calculated_ws != null ? Number(builder.calculated_ws).toFixed(2) : "—"}%, at {formatDateTimeMinutes(builder?.updated_at)}</span></span>
                        {spotLabel && (
                            <span>Spot: <span className="text-base-content/80">{spotLabel}</span></span>
                        )}
                        {!isClient && (
                            <span>
                                Created by:{" "}
                                <span className="text-base-content/80">
                                    {builder.created_by_username
                                        ? builder.created_by_username
                                        : builder.created_by_id
                                          ? `User #${builder.created_by_id}`
                                          : "Staff"}
                                </span>
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center space-x-2 mt-4 md:mt-0">
                    {!isClient && (
                        <button
                            type="button"
                            onClick={() => setShowSpreadCharts(true)}
                            className="btn btn-ghost btn-sm"
                            title="Spread charts"
                        >
                            <LineChart size={18} />
                        </button>
                    )}
                    {!isClient && builder.status === 'EXITED' && onSendPnlEmails && onSendPnlWhatsapp && (
                        <>
                            <button
                                type="button"
                                onClick={handleSendPnlEmails}
                                disabled={isSendingPnlEmails}
                                className="btn btn-sm btn-ghost primary gap-1"
                                title="Send PnL Emails"
                            >
                                {isSendingPnlEmails ? (
                                    <span className="loading loading-spinner loading-xs" />
                                ) : (
                                    <Mail size={16} />
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={handleSendPnlWhatsapp}
                                disabled={isSendingPnlWhatsapp}
                                className="btn btn-sm btn-ghost primary gap-1"
                                title="Send PnL WhatsApp"
                            >
                                {isSendingPnlWhatsapp ? (
                                    <span className="loading loading-spinner loading-xs" />
                                ) : (
                                    <MessageCircle size={16} />
                                )}
                            </button>
                        </>
                    )}
                    <button
                        onClick={handleRefresh}
                        className={`btn btn-ghost btn-sm ${isRefreshing ? 'animate-spin' : ''}`}
                        title="Refresh Status"
                    >
                        <RotateCw size={18} />
                    </button>
                    <button
                        onClick={() => onEdit(builder)}
                        className="btn btn-ghost btn-sm text-blue-400"
                        title="Edit Builder"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button
                        onClick={() => onDelete(builder.id)}
                        className="btn btn-ghost btn-sm text-red-400"
                        title="Delete Builder"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            <div>
                <div className="flex justify-between items-center mb-2 gap-2">
                    <button
                        type="button"
                        onClick={() => setLegsOpen((open) => !open)}
                        className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-base-content/60 uppercase tracking-wider"
                    >
                        <ChevronDown
                            className={`h-4 w-4 shrink-0 opacity-50 transition-transform ${legsOpen ? "rotate-180" : ""}`}
                        />
                        <span>Builder Legs ({legs.length})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => onAddLeg(builder.id)}
                        className="btn btn-xs btn-outline btn-primary gap-1 shrink-0"
                    >
                        <Plus size={14} /> Add Leg
                    </button>
                </div>
                {legsOpen && (
                    legs.length > 0 ? (
                        <div className="space-y-2">
                            {legs.map((leg, index) => (
                                <BuilderLegItem
                                    key={leg.id ?? `leg-${builder.id}-${index}`}
                                    leg={leg}
                                    onEdit={onEditLeg}
                                    onDelete={onDeleteLeg}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-4 bg-base-200/50 rounded-lg text-base-content/60 text-base italic">
                            No legs configured yet.
                        </div>
                    )
                )}
            </div>
            {showSpreadCharts && (
                <BuilderSpreadChartsModal
                    builderId={builder.id}
                    builderName={builder.name}
                    triggerWs={builder.trigger_ws}
                    onClose={() => setShowSpreadCharts(false)}
                />
            )}
        </div>
    );
}
