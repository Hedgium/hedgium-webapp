"use client";

import { useState, useEffect, useCallback } from "react";
import { authFetch } from "@/utils/api";
import { X, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import useAlert from "@/hooks/useAlert";
import PositionsTable, { Position } from "../positions/PositionsTable";
import UnmappedOrdersTable, { UnmappedOrder } from "../positions/UnmappedOrdersTable";
import PositionsSummary from "../positions/PositionsSummary";
import TradeCycleDetailsModalSkeleton from "@/components/skeletons/TradeCycleDetailsModalSkeleton";
import { formatMoneyIN } from "@/utils/formatNumber";

interface TradeCycleDetails {
    trade_cycle: {
        id: number;
        profile_id?: number;
        name: string;
        state: string;
        sub_state: string;
        description: string | null;
        created_at: string;
        updated_at: string;
    };
    positions: Position[];
    unmapped_orders: UnmappedOrder[];
    totals?: {
        total_pnl: number;
        realised_total: number;
        unrealised_total: number;
        total_buy_qty: number;
        total_sell_qty: number;
    } | null;
}

interface PositionTradeRow {
    id: number;
    instrument: string;
    transaction_type: string;
    quantity: number;
    average_price: number;
    fill_timestamp: string | null;
    exchange: string | null;
    broker_trade_id: string | null;
    broker_order_id: string | null;
    product: string | null;
}

interface TradeCycleDetailsModalProps {
    tradeCycleId: number;
    tradeCycle?: { id: number; profile_id?: number } | null;
    onClose: () => void;
}

function formatTradeTime(iso: string | null): string {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return iso;
    }
}

export default function TradeCycleDetailsModal({
    tradeCycleId,
    tradeCycle,
    onClose,
}: TradeCycleDetailsModalProps) {
    const [data, setData] = useState<TradeCycleDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [tradesPanel, setTradesPanel] = useState<{
        positionId: number;
        instrument: string;
    } | null>(null);
    const [tradesPage, setTradesPage] = useState(1);
    const [tradesLoading, setTradesLoading] = useState(false);
    const [tradesError, setTradesError] = useState<string | null>(null);
    const [tradesCount, setTradesCount] = useState(0);
    const [tradesResults, setTradesResults] = useState<PositionTradeRow[]>([]);
    const tradesPageSize = 100;

    const alert = useAlert();

    async function fetchDetails() {
        try {
            setLoading(true);
            setError(null);

            const res = await authFetch(`trade-cycles/${tradeCycleId}/details/?load_all=true`);
            if (!res.ok) {
                throw new Error("Failed to fetch trade cycle details");
            }

            const result = await res.json();
            setData(result);
        } catch {
            alert.error("Error fetching trade cycle details:");
        } finally {
            setLoading(false);
        }
    }

    const loadPositionTrades = useCallback(
        async (positionId: number, page: number) => {
            setTradesLoading(true);
            setTradesError(null);
            try {
                const res = await authFetch(
                    "positions/trades/",
                    {},
                    { position_id: positionId, page, page_size: tradesPageSize }
                );
                const body = await res.json();
                if (!res.ok) {
                    throw new Error(body.detail || "Failed to load trades");
                }
                setTradesCount(body.count ?? 0);
                setTradesResults(body.results ?? []);
                setTradesPage(page);
            } catch (e) {
                setTradesError(e instanceof Error ? e.message : "Failed to load trades");
                setTradesResults([]);
                setTradesCount(0);
            } finally {
                setTradesLoading(false);
            }
        },
        [tradesPageSize]
    );

    function openTradesForPosition(pos: Position) {
        setTradesPanel({ positionId: pos.id, instrument: pos.instrument });
        setTradesPage(1);
        void loadPositionTrades(pos.id, 1);
    }

    function closeTradesPanel() {
        setTradesPanel(null);
        setTradesError(null);
        setTradesResults([]);
        setTradesCount(0);
    }

    async function refreshPositions() {
        try {
            setRefreshing(true);
            setError(null);

            const profileId = tradeCycle?.profile_id ?? data?.trade_cycle?.profile_id;
            if (!profileId) {
                throw new Error("Missing profile id for this trade cycle");
            }

            const res = await authFetch(`positions/pnl/refresh/trades/async/${profileId}/`, { method: "POST" });
            const startData = await res.json();

            if (!res.ok) {
                throw new Error(startData.detail || "Failed to refresh positions");
            }

            const taskId = startData.task_id as string | undefined;
            if (!taskId) {
                throw new Error("Refresh task not started");
            }

            const maxAttempts = 30;
            let completed = false;
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                await new Promise((resolve) => setTimeout(resolve, 2000));
                const statusRes = await authFetch(`tasks/status/${taskId}/`);
                const statusData = await statusRes.json();

                if (!statusRes.ok) {
                    throw new Error(statusData.detail || "Failed to check refresh status");
                }

                if (statusData.status === "SUCCESS") {
                    completed = true;
                    break;
                }
                if (statusData.status === "FAILURE") {
                    throw new Error(statusData.result || "Refresh failed");
                }
            }

            if (!completed) {
                alert.success("Refresh running in background");
                return;
            }

            await fetchDetails();
        } catch (err) {
            console.error("Error refreshing positions:", err);
            alert.error(err instanceof Error ? err.message : "Failed to refresh positions");
        } finally {
            setRefreshing(false);
        }
    }

    useEffect(() => {
        fetchDetails();
        refreshPositions();
    }, [tradeCycleId]);

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.key !== "Escape") return;
            if (tradesPanel) {
                closeTradesPanel();
            } else {
                onClose();
            }
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [tradesPanel, onClose]);

    const tradesTotalPages = Math.max(1, Math.ceil(tradesCount / tradesPageSize));

    return (
        <div
            className="fixed inset-0 z-[1000] flex min-h-0 flex-col bg-base-100 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="trade-cycle-details-title"
        >
            <header className="flex shrink-0 items-center justify-between gap-4 border-b border-base-300 px-4 py-3">
                <div className="min-w-0">
                    <h3 id="trade-cycle-details-title" className="truncate text-lg font-semibold">
                        Trade cycle details
                    </h3>
                    {loading ? (
                        <div className="mt-1 h-4 max-w-xs animate-pulse rounded bg-base-300/70" aria-hidden />
                    ) : data?.trade_cycle?.name ? (
                        <p className="truncate text-sm text-base-content/70">{data.trade_cycle.name}</p>
                    ) : null}
                </div>
                <button
                    type="button"
                    className="btn btn-sm btn-ghost btn-square"
                    onClick={onClose}
                    aria-label="Close"
                >
                    <X size={20} />
                </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {loading && <TradeCycleDetailsModalSkeleton />}

                {error && (
                    <div className="alert alert-error mb-4">
                        <span>{error}</span>
                    </div>
                )}

                {!loading && data && (
                    <>
                        <div className="mb-6">
                            <div className="mb-3 flex items-center justify-between">
                                <h4 className="text-xl font-semibold">Positions</h4>
                                <button
                                    onClick={refreshPositions}
                                    disabled={refreshing}
                                    className={`btn btn-sm btn-ghost ${refreshing ? "animate-spin" : ""}`}
                                    title="Refresh Positions"
                                    type="button"
                                >
                                    <RefreshCw size={16} />
                                </button>
                            </div>

                            <PositionsSummary
                                positions={data.positions}
                                totals={data.totals || null}
                                className="mb-4"
                            />

                            <div className="mb-4 rounded-lg border border-base-300">
                                <PositionsTable
                                    positions={data.positions}
                                    showOrdersCount={true}
                                    showAdminTradesAction={true}
                                    onAdminViewTrades={openTradesForPosition}
                                />
                            </div>
                        </div>

                        <UnmappedOrdersTable orders={data.unmapped_orders} variant="table" />
                    </>
                )}
            </div>

            <footer className="flex shrink-0 justify-end border-t border-base-300 px-4 py-3">
                <button type="button" onClick={onClose} className="btn">
                    Close
                </button>
            </footer>

            {tradesPanel ? (
                <div className="absolute inset-0 z-20 flex flex-col bg-base-100">
                    <div className="flex shrink-0 items-center justify-between gap-2 border-b border-base-300 px-4 py-3">
                        <div className="min-w-0">
                            <h4 className="truncate font-semibold">Trades for position</h4>
                            <p className="truncate text-sm text-base-content/70">{tradesPanel.instrument}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="hidden text-xs text-base-content/60 sm:inline">{tradesCount} total</span>
                            <button type="button" className="btn btn-sm" onClick={closeTradesPanel}>
                                Back
                            </button>
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-auto p-4">
                        {tradesError ? (
                            <div className="alert alert-error">
                                <span>{tradesError}</span>
                            </div>
                        ) : null}

                        {tradesLoading ? (
                            <div className="flex justify-center py-12">
                                <span className="loading loading-spinner loading-md"></span>
                            </div>
                        ) : !tradesError && tradesResults.length === 0 ? (
                            <p className="py-8 text-center text-sm text-base-content/60">
                                No stored trades for this position. Run a positions refresh from the broker if you
                                expect fills here.
                            </p>
                        ) : (
                            <div className="overflow-x-auto rounded-lg border border-base-300">
                                <table className="table table-zebra w-full text-sm">
                                    <thead>
                                        <tr className="text-xs uppercase text-base-content/60">
                                            <th>Time</th>
                                            <th>Side</th>
                                            <th>Qty</th>
                                            <th>Avg price</th>
                                            <th>Exchange</th>
                                            <th>Product</th>
                                            <th>Broker trade</th>
                                            <th>Broker order</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tradesResults.map((t) => (
                                            <tr key={t.id}>
                                                <td className="whitespace-nowrap">
                                                    {formatTradeTime(t.fill_timestamp)}
                                                </td>
                                                <td>{t.transaction_type}</td>
                                                <td>{t.quantity}</td>
                                                <td>{formatMoneyIN(t.average_price)}</td>
                                                <td>{t.exchange ?? "—"}</td>
                                                <td>{t.product ?? "—"}</td>
                                                <td className="max-w-[8rem] truncate font-mono text-xs">
                                                    {t.broker_trade_id ?? "—"}
                                                </td>
                                                <td className="max-w-[8rem] truncate font-mono text-xs">
                                                    {t.broker_order_id ?? "—"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {tradesCount > tradesPageSize ? (
                        <div className="flex shrink-0 items-center justify-center gap-4 border-t border-base-300 px-4 py-3">
                            <button
                                type="button"
                                className="btn btn-sm"
                                disabled={tradesPage <= 1 || tradesLoading}
                                onClick={() =>
                                    tradesPanel && void loadPositionTrades(tradesPanel.positionId, tradesPage - 1)
                                }
                            >
                                <ChevronLeft size={16} className="inline" /> Previous
                            </button>
                            <span className="text-sm text-base-content/70">
                                Page {tradesPage} / {tradesTotalPages}
                            </span>
                            <button
                                type="button"
                                className="btn btn-sm"
                                disabled={tradesPage >= tradesTotalPages || tradesLoading}
                                onClick={() =>
                                    tradesPanel && void loadPositionTrades(tradesPanel.positionId, tradesPage + 1)
                                }
                            >
                                Next <ChevronRight size={16} className="inline" />
                            </button>
                        </div>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
