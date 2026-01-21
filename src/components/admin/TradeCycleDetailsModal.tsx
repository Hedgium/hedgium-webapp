"use client";

import { useState, useEffect } from "react";
import { authFetch } from "@/utils/api";
import { X, RefreshCw } from "lucide-react";
import useAlert from "@/hooks/useAlert";
import PositionsTable, { Position } from "../positions/PositionsTable";
import UnmappedOrdersTable, { UnmappedOrder } from "../positions/UnmappedOrdersTable";
import PositionsSummary from "../positions/PositionsSummary";

interface Order {
    id: number;
    instrument: string;
    action: string;
    quantity: number;
    price: number | null;
    status: string;
    order_type: string;
}

interface TradeCycleDetails {
    trade_cycle: {
        id: number;
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
        realised_today: number;
        unrealised_total: number;
        unrealised_today: number;
        unrealised: number;
        total_buy_qty: number;
        total_sell_qty: number;
    } | null;
}

interface TradeCycleDetailsModalProps {
    tradeCycleId: number;
    onClose: () => void;
}

export default function TradeCycleDetailsModal({
    tradeCycleId,
    onClose,
}: TradeCycleDetailsModalProps) {
    const [data, setData] = useState<TradeCycleDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const alert = useAlert();

    // Fetch trade cycle details
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
        } catch (err) {
            // console.error("Error fetching trade cycle details:", err);
            alert.error("Error fetching trade cycle details:");
            // setError(err instanceof Error ? err.message : "Failed to load data");
        } finally {
            setLoading(false);
        }
    }

    // Refresh positions from broker
    async function refreshPositions() {
        try {
            setRefreshing(true);
            setError(null);

            const res = await authFetch(`positions/pnl/refresh/`)
            console.log(await res.json())

            if (!res.ok) {
                // throw new Error("Failed to refresh positions");
                alert.error("Failed to refresh positions");
            }

            // Refetch the details after refresh
            await fetchDetails();
        } catch (err) {
            console.error("Error refreshing positions:", err);
            // setError(err instanceof Error ? err.message : "Failed to refresh positions");
            alert.error(err instanceof Error ? err.message : "Failed to refresh positions");
        } finally {
            setRefreshing(false);
        }
    }

    useEffect(() => {
        fetchDetails();
    }, [tradeCycleId]);


    return (
        <div className="modal modal-open">
            <div className="modal-box w-11/12 max-w-6xl max-h-[90vh] overflow-y-auto">

                {loading && (
                    <div className="flex justify-center items-center py-12">
                        <span className="loading loading-spinner loading-lg"></span>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="alert alert-error mb-4">
                        <span>{error}</span>
                    </div>
                )}

                {/* Content */}
                {!loading && data && (
                    <>
                        {/* Positions Section */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-xl font-semibold">Positions</h4>
                                <button
                                    onClick={refreshPositions}
                                    disabled={refreshing}
                                    className={`btn btn-sm btn-ghost ${refreshing ? "animate-spin" : ""}`}
                                    title="Refresh Positions"
                                >
                                    <RefreshCw size={16} />
                                </button>
                            </div>

                            {/* Totals Summary */}
                            <PositionsSummary 
                                positions={data.positions} 
                                totals={data.totals || null}
                                className="mb-4"
                            />

                            <div className="mb-4 rounded-lg border border-base-300">
                                <PositionsTable
                                    positions={data.positions}
                                    showOrdersCount={true}
                                />
                            </div>
                        </div>

                        {/* Unmapped Orders Section */}
                        <UnmappedOrdersTable
                            orders={data.unmapped_orders}
                            variant="table"
                        />
                    </>
                )}

                {/* Close Button */}
                <div className="modal-action">
                    <button onClick={onClose} className="btn">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
