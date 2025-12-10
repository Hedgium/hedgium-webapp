"use client";

import { useState, useEffect } from "react";
import { authFetch } from "@/utils/api";
import { X, RefreshCw } from "lucide-react";
import useAlert from "@/hooks/useAlert";

interface Order {
    id: number;
    instrument: string;
    action: string;
    quantity: number;
    price: number | null;
    status: string;
    order_type: string;
}

interface Position {
    id: number;
    instrument: string;
    pnl: number;
    average_buy_price: number;
    average_sell_price: number;
    quantity: number;
    buy_quantity: number;
    sell_quantity: number;
    unrealised: number;
    realised_total: number;
    orders: Order[];
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
    unmapped_orders: Order[];
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

            const res = await authFetch(`trade-cycles/${tradeCycleId}/details/`);
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

            const res = await authFetch(`positions/pnl/refresh/${tradeCycleId}/`)
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

    // Get status badge color
    function getStatusColor(status: string) {
        switch (status.toUpperCase()) {
            case "COMPLETE":
            case "EXECUTED":
                return "badge-success";
            case "PENDING":
                return "badge-warning";
            case "FAILED":
            case "REJECTED":
                return "badge-error";
            default:
                return "badge-ghost";
        }
    }

    // Get PnL color
    function getPnLColor(pnl: number) {
        if (pnl > 0) return "text-green-500";
        if (pnl < 0) return "text-red-500";
        return "";
    }

    return (
        <div className="modal modal-open">
            <div className="modal-box w-11/12 max-w-6xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold">Trade Cycle Details</h3>
                    <button
                        onClick={onClose}
                        className="btn btn-ghost btn-sm btn-circle"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Loading State */}
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
                        {/* Trade Cycle Info */}
                        <div className="bg-base-200 rounded-lg p-4 mb-6">
                            <h4 className="text-lg font-semibold mb-2">{data.trade_cycle.name}</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div>
                                    <span className="opacity-70">State:</span>{" "}
                                    <span className="badge badge-primary">{data.trade_cycle.state}</span>
                                </div>
                                <div>
                                    <span className="opacity-70">Sub-State:</span>{" "}
                                    <span className="badge badge-secondary">{data.trade_cycle.sub_state}</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="opacity-70">Description:</span>{" "}
                                    {data.trade_cycle.description || "N/A"}
                                </div>
                            </div>
                        </div>

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

                            {data.positions.length === 0 ? (
                                <div className="text-center py-8 opacity-60">No positions found</div>
                            ) : (
                                <div className="space-y-4">
                                    {data.positions.map((position) => (
                                        <div key={position.id} className="border border-base-300 rounded-lg p-4">
                                            {/* Position Header */}
                                            <div className="flex items-center justify-between mb-3">
                                                <div>
                                                    <h5 className="font-semibold text-lg">{position.instrument}</h5>
                                                    <div className="text-sm opacity-70">
                                                        Qty: {position.quantity} (Buy: {position.buy_quantity}, Sell: {position.sell_quantity})
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`text-xl font-bold ${getPnLColor(position.pnl)}`}>
                                                        ₹{position.pnl.toFixed(2)}
                                                    </div>
                                                    <div className="text-xs opacity-70">
                                                        Unrealised: ₹{position.unrealised.toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Position Details */}
                                            <div className="grid grid-cols-2 gap-2 text-sm mb-3 bg-base-200 rounded p-2">
                                                <div>
                                                    <span className="opacity-70">Avg Buy:</span> ₹{position.average_buy_price.toFixed(2)}
                                                </div>
                                                <div>
                                                    <span className="opacity-70">Avg Sell:</span> ₹{position.average_sell_price.toFixed(2)}
                                                </div>
                                                <div className="col-span-2">
                                                    <span className="opacity-70">Realised Total:</span> ₹{position.realised_total.toFixed(2)}
                                                </div>
                                            </div>

                                            {/* Orders for this Position */}
                                            {position.orders.length > 0 && (
                                                <div>
                                                    <h6 className="font-semibold text-sm mb-2 opacity-80">Orders ({position.orders.length})</h6>
                                                    <div className="overflow-x-auto">
                                                        <table className="table table-xs">
                                                            <thead>
                                                                <tr>
                                                                    <th>Action</th>
                                                                    <th>Qty</th>
                                                                    <th>Price</th>
                                                                    <th>Type</th>
                                                                    <th>Status</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {position.orders.map((order) => (
                                                                    <tr key={order.id}>
                                                                        <td>
                                                                            <span className={order.action === "BUY" ? "text-green-500" : "text-red-500"}>
                                                                                {order.action}
                                                                            </span>
                                                                        </td>
                                                                        <td>{order.quantity}</td>
                                                                        <td>{order.price ? `₹${order.price.toFixed(2)}` : "Market"}</td>
                                                                        <td>{order.order_type}</td>
                                                                        <td>
                                                                            <span className={`badge badge-xs ${getStatusColor(order.status)}`}>
                                                                                {order.status}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Unmapped Orders Section */}
                        {data.unmapped_orders.length > 0 && (
                            <div>
                                <h4 className="text-xl font-semibold mb-3">Unmapped Orders</h4>
                                <div className="overflow-x-auto">
                                    <table className="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Instrument</th>
                                                <th>Action</th>
                                                <th>Qty</th>
                                                <th>Price</th>
                                                <th>Type</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.unmapped_orders.map((order) => (
                                                <tr key={order.id}>
                                                    <td>{order.instrument}</td>
                                                    <td>
                                                        <span className={order.action === "BUY" ? "text-green-500" : "text-red-500"}>
                                                            {order.action}
                                                        </span>
                                                    </td>
                                                    <td>{order.quantity}</td>
                                                    <td>{order.price ? `₹${order.price.toFixed(2)}` : "Market"}</td>
                                                    <td>{order.order_type}</td>
                                                    <td>
                                                        <span className={`badge badge-sm ${getStatusColor(order.status)}`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
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
