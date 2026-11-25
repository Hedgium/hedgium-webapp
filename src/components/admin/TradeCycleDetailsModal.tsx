"use client";

import { useState, useEffect, useCallback, useMemo, type FormEvent } from "react";
import dynamic from "next/dynamic";
import { authFetch } from "@/utils/api";
import type { LucideIcon } from "lucide-react";
import {
    X,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Edit2,
    Wallet,
    ClipboardList,
    Database,
    BarChart3,
} from "lucide-react";
import useAlert from "@/hooks/useAlert";
import PositionsTable, { Position } from "../positions/PositionsTable";
import UnmappedOrdersTable, { UnmappedOrder } from "../positions/UnmappedOrdersTable";
import PositionsSummary from "../positions/PositionsSummary";
import TradeCycleDetailsModalSkeleton from "@/components/skeletons/TradeCycleDetailsModalSkeleton";
import { formatMoneyIN } from "@/utils/formatNumber";
import {
    exitAllPositions,
    placePositionOrder,
    type PositionOrderIntent,
} from "@/services/tradeCycles";
import { modifyOrder, cancelOrder } from "@/services/liveTradingActions";
import type { LivePosition } from "@/types/positions";

const MarketDepthModal = dynamic(() => import("@/components/market/MarketDepthModal"), {
    ssr: false,
});

type CycleDetailsTab = "positions" | "orders" | "stored";

const CYCLE_TAB_CONFIG: {
    id: CycleDetailsTab;
    label: string;
    shortLabel: string;
    icon: LucideIcon;
}[] = [
    { id: "positions", label: "Live positions", shortLabel: "Pos", icon: Wallet },
    { id: "orders", label: "Live orders", shortLabel: "Ord", icon: ClipboardList },
    { id: "stored", label: "All positions", shortLabel: "All", icon: Database },
];

interface TradeCycleDetails {
    trade_cycle: {
        id: number;
        profile_id?: number;
        strategy_id?: number | null;
        exchange?: string | null;
        broker_name?: string | null;
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
        pnl_total: number;
        realised_total: number;
        unrealised_total: number;
        total_buy_qty: number;
        total_sell_qty: number;
    } | null;
    underlyings?: UnderlyingMarket[];
}

interface UnderlyingMarket {
    symbol: string;
    spot: number | null;
    strike_step: number | null;
    atm: number | null;
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

interface LiveOrder {
    order_id: string;
    exchange_order_id?: string;
    status: string;
    order_timestamp?: string;
    exchange: string;
    tradingsymbol: string;
    instrument_token?: number;
    order_type: string;
    transaction_type: string;
    product: string;
    quantity: number;
    price: number;
    trigger_price?: number;
    filled_quantity: number;
    pending_quantity: number;
    average_price?: number;
}

interface ModifyOrderFormData {
    quantity: string;
    price: string;
    tradingsymbol: string;
    exchange: string;
}

interface TradeCycleDetailsModalProps {
    tradeCycleId: number;
    tradeCycle?: { id: number; profile_id?: number } | null;
    onClose: () => void;
}

const TERMINAL_ORDER_STATUSES = new Set([
    "COMPLETE",
    "FILLED",
    "CANCELLED",
    "CANCELED",
    "REJECTED",
]);

function isOpenLiveOrder(order: LiveOrder): boolean {
    return !TERMINAL_ORDER_STATUSES.has((order.status || "").toUpperCase());
}

function liveApiError(data: unknown, fallback: string): string {
    if (!data || typeof data !== "object") return fallback;
    const payload = data as Record<string, unknown>;
    for (const key of ["message", "error_message", "detail"]) {
        const value = payload[key];
        if (typeof value !== "string") continue;
        const text = value.trim();
        if (text && text.toLowerCase() !== "success" && text.toLowerCase() !== "ok") {
            return text;
        }
    }
    return fallback;
}

function underlyingsSortedLongestFirst(
    underlyings: UnderlyingMarket[] | undefined
): string[] {
    return [...(underlyings || [])]
        .map((u) => (u.symbol || "").trim().toUpperCase())
        .filter(Boolean)
        .sort((a, b) => b.length - a.length);
}

function symbolMatchesUnderlyings(
    tradingsymbol: string,
    underlyingsSorted: string[]
): boolean {
    const symbol = (tradingsymbol || "").trim().toUpperCase();
    if (!symbol || underlyingsSorted.length === 0) return false;
    return underlyingsSorted.some((u) => symbol.startsWith(u));
}

function orderBelongsToCycle(
    tradingsymbol: string,
    instruments: Set<string>,
    underlyingsSorted: string[]
): boolean {
    const symbol = (tradingsymbol || "").trim().toUpperCase();
    if (!symbol) return false;
    if (instruments.has(symbol)) return true;
    return symbolMatchesUnderlyings(symbol, underlyingsSorted);
}

/** Live broker rows filtered by strategy underlying, enriched with stored cycle metadata for actions. */
function mergeLivePositionsWithStored(
    live: LivePosition[],
    stored: Position[],
    underlyingsSorted: string[]
): Position[] {
    const byInst = new Map(
        stored.map((p) => [(p.instrument || "").trim().toUpperCase(), p] as const)
    );

    return live
        .filter((lp) => {
            if (underlyingsSorted.length > 0) {
                return symbolMatchesUnderlyings(lp.tradingsymbol, underlyingsSorted);
            }
            // Fallback when market underlyings are unavailable: keep mapped cycle instruments only.
            const key = (lp.tradingsymbol || "").trim().toUpperCase();
            return Boolean(key) && byInst.has(key);
        })
        .map((lp) => {
            const key = (lp.tradingsymbol || "").trim().toUpperCase();
            const s = byInst.get(key);
            const qty = lp.quantity ?? 0;
            const avg = lp.average_price ?? 0;
            const realised = lp.realised_total ?? lp.realised ?? 0;
            const unrealised = lp.unrealised_total ?? lp.unrealised ?? 0;
            const pnl = lp.pnl ?? realised + unrealised;

            return {
                id: s?.id ?? 0,
                instrument: lp.tradingsymbol,
                exchange: lp.exchange ?? s?.exchange ?? null,
                lot_size: s?.lot_size && s.lot_size > 0 ? s.lot_size : 1,
                buy_quantity: lp.buy_quantity ?? s?.buy_quantity ?? 0,
                sell_quantity: lp.sell_quantity ?? s?.sell_quantity ?? 0,
                average_buy_price:
                    s?.average_buy_price && s.average_buy_price > 0
                        ? s.average_buy_price
                        : qty > 0
                          ? avg
                          : 0,
                average_sell_price:
                    s?.average_sell_price && s.average_sell_price > 0
                        ? s.average_sell_price
                        : qty < 0
                          ? avg
                          : 0,
                quantity: qty,
                realised_total: realised,
                unrealised_total: unrealised,
                pnl,
                last_price: lp.last_price ?? s?.last_price ?? null,
                expiry: s?.expiry ?? null,
                strike: s?.strike ?? null,
                option_type: s?.option_type ?? null,
                greek_delta: s?.greek_delta,
                greek_gamma: s?.greek_gamma,
                greek_theta: s?.greek_theta,
                greek_vega: s?.greek_vega,
                greek_updated_at: s?.greek_updated_at,
                greek_source: s?.greek_source,
                greek_spot: s?.greek_spot,
            } satisfies Position;
        });
}

function positionOrderTitle(intent: PositionOrderIntent): string {
    if (intent === "buy") return "Buy";
    if (intent === "sell") return "Sell";
    if (intent === "increase") return "Increase position";
    if (intent === "decrease") return "Decrease position";
    return "Exit position";
}

function isOpeningIntent(intent: PositionOrderIntent): boolean {
    return intent === "buy" || intent === "sell" || intent === "increase";
}

function defaultPositionOrderQty(pos: Position, intent: PositionOrderIntent): number {
    const absQty = Math.abs(pos.quantity);
    const lot = pos.lot_size && pos.lot_size > 0 ? pos.lot_size : 1;
    if (intent === "exit") return absQty;
    if (intent === "decrease") return Math.min(lot, absQty);
    return lot;
}

function positionOrderAction(pos: Position, intent: PositionOrderIntent): "BUY" | "SELL" {
    if (intent === "buy") return "BUY";
    if (intent === "sell") return "SELL";
    if (pos.quantity > 0) {
        return intent === "increase" ? "BUY" : "SELL";
    }
    return intent === "increase" ? "SELL" : "BUY";
}

function formatMarketNumber(value: number | null | undefined): string {
    if (value == null || !Number.isFinite(Number(value))) return "—";
    const n = Number(value);
    return n.toLocaleString("en-IN", {
        maximumFractionDigits: Number.isInteger(n) ? 0 : 2,
    });
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
    const [refreshingStored, setRefreshingStored] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<CycleDetailsTab>("positions");

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
    const [exitPosition, setExitPosition] = useState<Position | null>(null);
    const [exitIntent, setExitIntent] = useState<PositionOrderIntent>("exit");
    const [exitQuantity, setExitQuantity] = useState("");
    const [exitingPosition, setExitingPosition] = useState(false);
    const [exitingAll, setExitingAll] = useState(false);

    const [livePositionsRaw, setLivePositionsRaw] = useState<LivePosition[]>([]);
    /** True until the first live-positions fetch for this open finishes (avoids empty-table flash). */
    const [loadingLivePositions, setLoadingLivePositions] = useState(true);
    const [livePositionsError, setLivePositionsError] = useState<string | null>(null);

    const [liveOrders, setLiveOrders] = useState<LiveOrder[]>([]);
    const [loadingLiveOrders, setLoadingLiveOrders] = useState(false);
    const [liveOrdersError, setLiveOrdersError] = useState<string | null>(null);
    const [selectedLiveOrder, setSelectedLiveOrder] = useState<LiveOrder | null>(null);
    const [showModifyOrderForm, setShowModifyOrderForm] = useState(false);
    const [modifyingOrder, setModifyingOrder] = useState(false);
    const [modifyForm, setModifyForm] = useState<ModifyOrderFormData>({
        quantity: "",
        price: "",
        tradingsymbol: "",
        exchange: "",
    });
    const [showDepthModal, setShowDepthModal] = useState(false);
    const [depthSymbol, setDepthSymbol] = useState("");
    const [depthExchange, setDepthExchange] = useState("");

    const alert = useAlert();

    const profileId = tradeCycle?.profile_id ?? data?.trade_cycle?.profile_id;

    async function fetchDetails(options?: {
        /** When true, update data in place without modal-wide skeleton. */
        silent?: boolean;
    }): Promise<TradeCycleDetails | null> {
        const silent = options?.silent === true;
        try {
            if (!silent) {
                setLoading(true);
            }
            setError(null);

            const res = await authFetch(
                `trade-cycles/${tradeCycleId}/details/?load_all=true&with_market=true`
            );
            if (!res.ok) {
                throw new Error("Failed to fetch trade cycle details");
            }

            const result = (await res.json()) as TradeCycleDetails;
            setData(result);
            return result;
        } catch {
            alert.error("Error fetching trade cycle details:");
            return null;
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    }

    const fetchLivePositions = useCallback(
        async (resolvedProfileId?: number) => {
            const pid =
                resolvedProfileId ?? tradeCycle?.profile_id ?? data?.trade_cycle?.profile_id;
            if (!pid) {
                setLivePositionsRaw([]);
                setLoadingLivePositions(false);
                return;
            }

            setLoadingLivePositions(true);
            setLivePositionsError(null);
            try {
                const response = await authFetch(`positions/live/positions/${pid}/`);
                const body = await response.json();
                if (body.status !== "success") {
                    throw new Error(liveApiError(body, "Failed to fetch live positions"));
                }
                const rows: LivePosition[] = Array.isArray(body.data?.net) ? body.data.net : [];
                setLivePositionsRaw(rows);
            } catch (err) {
                console.error("Error fetching live positions:", err);
                setLivePositionsRaw([]);
                setLivePositionsError(
                    err instanceof Error ? err.message : "Failed to fetch live positions"
                );
            } finally {
                setLoadingLivePositions(false);
            }
        },
        [tradeCycle?.profile_id, data?.trade_cycle?.profile_id]
    );

    const fetchLiveOrders = useCallback(
        async (details: TradeCycleDetails | null, resolvedProfileId?: number) => {
            const pid = resolvedProfileId ?? tradeCycle?.profile_id ?? details?.trade_cycle?.profile_id;
            if (!pid || !details) {
                setLiveOrders([]);
                return;
            }

            const instruments = new Set(
                (details.positions || [])
                    .map((p) => (p.instrument || "").trim().toUpperCase())
                    .filter(Boolean)
            );
            const underlyingsSorted = underlyingsSortedLongestFirst(details.underlyings);

            setLoadingLiveOrders(true);
            setLiveOrdersError(null);
            try {
                const response = await authFetch(`orders/live/orders/${pid}/`);
                const body = await response.json();
                if (body.status !== "success") {
                    throw new Error(liveApiError(body, "Failed to fetch live orders"));
                }
                const rows: LiveOrder[] = Array.isArray(body.data) ? body.data : [];
                const filtered = rows.filter((order) =>
                    orderBelongsToCycle(order.tradingsymbol, instruments, underlyingsSorted)
                );
                filtered.sort((a, b) => {
                    const aOpen = isOpenLiveOrder(a) ? 0 : 1;
                    const bOpen = isOpenLiveOrder(b) ? 0 : 1;
                    if (aOpen !== bOpen) return aOpen - bOpen;
                    return 0;
                });
                setLiveOrders(filtered);
            } catch (err) {
                console.error("Error fetching live orders:", err);
                setLiveOrders([]);
                setLiveOrdersError(
                    err instanceof Error ? err.message : "Failed to fetch live orders"
                );
            } finally {
                setLoadingLiveOrders(false);
            }
        },
        [tradeCycle?.profile_id]
    );

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
        if (!pos.id) {
            alert.error(
                "No stored Hedgium position for this instrument yet. Actions need a mapped cycle position."
            );
            return;
        }
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

    function openExitForPosition(pos: Position, intent: PositionOrderIntent = "exit") {
        if (!pos.id) {
            alert.error(
                "No stored Hedgium position for this instrument yet. Actions need a mapped cycle position."
            );
            return;
        }
        setExitPosition(pos);
        setExitIntent(intent);
        setExitQuantity(String(defaultPositionOrderQty(pos, intent)));
    }

    function closeExitForm() {
        setExitPosition(null);
        setExitQuantity("");
        setExitIntent("exit");
    }

    async function handleExitAll() {
        const openCount = displayPositions.filter((pos) => pos.quantity !== 0).length;
        if (openCount < 1) {
            alert.error("No open live positions to exit");
            return;
        }
        const label = openCount === 1 ? "1 open live position" : `${openCount} open live positions`;
        if (
            !window.confirm(
                `Exit ${label}? This sends LIMIT orders split into value batches.`
            )
        ) {
            return;
        }

        setExitingAll(true);
        try {
            const { ok, data: body } = await exitAllPositions(tradeCycleId);
            const detail =
                typeof body.detail === "string" ? body.detail : "Failed to exit positions";
            if (ok && body.status === "success") {
                alert.success(detail);
                const next = await fetchDetails();
                const pid = profileId ?? next?.trade_cycle?.profile_id;
                await Promise.all([fetchLivePositions(pid), fetchLiveOrders(next, pid)]);
            } else {
                alert.error(detail);
            }
        } catch (err) {
            alert.error(err instanceof Error ? err.message : "Failed to exit positions");
        } finally {
            setExitingAll(false);
        }
    }

    async function handleExitPosition(e: FormEvent) {
        e.preventDefault();
        if (!exitPosition) return;

        const opening = exitIntent === "buy" || exitIntent === "sell";
        if (exitPosition.quantity === 0 && !opening) {
            alert.error("Cannot adjust a flat position");
            return;
        }

        const absNet = Math.abs(exitPosition.quantity);
        const parsedQty = parseInt(exitQuantity, 10);
        if (!Number.isFinite(parsedQty) || parsedQty < 1) {
            alert.error("Quantity must be at least 1");
            return;
        }
        if (!opening && exitIntent !== "increase" && parsedQty > absNet) {
            alert.error(`Quantity cannot exceed open size ${absNet}`);
            return;
        }

        const lot = exitPosition.lot_size && exitPosition.lot_size > 0 ? exitPosition.lot_size : 1;
        if (lot > 1 && parsedQty % lot !== 0) {
            alert.error(`Quantity must be a multiple of lot size ${lot}`);
            return;
        }

        setExitingPosition(true);
        try {
            const { ok, data } = await placePositionOrder(tradeCycleId, {
                position_id: exitPosition.id,
                intent: exitIntent,
                quantity: parsedQty,
            });
            const detail =
                typeof data.detail === "string" ? data.detail : "Failed to place position order";
            if (ok && data.status === "success") {
                alert.success(detail);
                closeExitForm();
                const next = await fetchDetails();
                const pid = profileId ?? next?.trade_cycle?.profile_id;
                await Promise.all([
                    fetchLivePositions(pid),
                    fetchLiveOrders(next, pid),
                ]);
            } else {
                alert.error(detail);
            }
        } catch (error) {
            console.error("Error placing position order:", error);
            alert.error(error instanceof Error ? error.message : "Error placing position order");
        } finally {
            setExitingPosition(false);
        }
    }

    async function refreshLiveData() {
        try {
            setRefreshing(true);
            setError(null);

            const pid = tradeCycle?.profile_id ?? data?.trade_cycle?.profile_id;
            if (!pid) {
                throw new Error("Missing profile id for this trade cycle");
            }

            await Promise.all([
                fetchLivePositions(pid),
                fetchLiveOrders(data, pid),
            ]);
        } catch (err) {
            console.error("Error refreshing live positions:", err);
            alert.error(err instanceof Error ? err.message : "Failed to refresh live positions");
        } finally {
            setRefreshing(false);
        }
    }

    async function refreshStoredPnl(resolvedProfileId?: number) {
        try {
            setRefreshingStored(true);
            setError(null);

            const pid =
                resolvedProfileId ??
                tradeCycle?.profile_id ??
                data?.trade_cycle?.profile_id;
            if (!pid) {
                throw new Error("Missing profile id for this trade cycle");
            }

            const res = await authFetch(`positions/pnl/refresh/trades/async/${pid}/`, {
                method: "POST",
            });
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

            await fetchDetails({ silent: true });
        } catch (err) {
            console.error("Error refreshing positions:", err);
            alert.error(err instanceof Error ? err.message : "Failed to refresh positions");
        } finally {
            setRefreshingStored(false);
        }
    }

    function openDepth(symbol: string, exchange?: string) {
        setDepthSymbol(symbol.trim());
        setDepthExchange((exchange || "").trim());
        setShowDepthModal(true);
    }

    function openModifyForm(order: LiveOrder) {
        setSelectedLiveOrder(order);
        setModifyForm({
            quantity: String(order.quantity ?? ""),
            price: order.price != null ? String(order.price) : "",
            tradingsymbol: order.tradingsymbol,
            exchange: order.exchange,
        });
        setShowModifyOrderForm(true);
    }

    function closeModifyForm() {
        setShowModifyOrderForm(false);
        setSelectedLiveOrder(null);
    }

    async function handleModifyOrder(e: FormEvent) {
        e.preventDefault();
        if (!selectedLiveOrder || !profileId) return;

        const parsedQuantity = parseInt(modifyForm.quantity, 10);
        const parsedPrice = parseFloat(modifyForm.price);

        if (!Number.isFinite(parsedQuantity) || parsedQuantity < 1) {
            alert.error("Quantity must be at least 1");
            return;
        }
        if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
            alert.error("Price must be a non-negative number");
            return;
        }

        setModifyingOrder(true);
        try {
            const { data: body } = await modifyOrder(profileId, selectedLiveOrder.order_id, {
                quantity: parsedQuantity,
                price: parsedPrice,
                tradingsymbol: modifyForm.tradingsymbol,
                exchange: modifyForm.exchange,
            });

            if (body.status === "success") {
                alert.success("Order modified successfully");
                closeModifyForm();
                await fetchLiveOrders(data, profileId);
            } else {
                alert.error(liveApiError(body, "Failed to modify order"));
            }
        } catch (error) {
            console.error("Error modifying order:", error);
            alert.error(liveApiError(error, "Error modifying order"));
        } finally {
            setModifyingOrder(false);
        }
    }

    async function handleCancelOrder(orderId: string) {
        if (!profileId) return;
        if (!confirm("Are you sure you want to cancel this order?")) return;

        try {
            const { ok, data: body } = await cancelOrder(profileId, orderId);
            if (body.status === "success" || ok) {
                alert.success("Order cancelled successfully");
                await fetchLiveOrders(data, profileId);
            } else {
                alert.error(liveApiError(body, "Failed to cancel order"));
            }
        } catch (error) {
            console.error("Error cancelling order:", error);
            alert.error(liveApiError(error, "Error cancelling order"));
        }
    }

    useEffect(() => {
        setActiveTab("positions");
        setData(null);
        setLoading(true);
        setLoadingLivePositions(true);
        setLivePositionsRaw([]);
        setLiveOrders([]);
        let cancelled = false;
        (async () => {
            const knownProfileId = tradeCycle?.profile_id;
            // Overlap broker live fetch with details when profile id is already known.
            const [next] = await Promise.all([
                fetchDetails(),
                knownProfileId ? fetchLivePositions(knownProfileId) : Promise.resolve(),
            ]);
            if (cancelled) return;
            const pid = next?.trade_cycle?.profile_id ?? knownProfileId;
            if (!knownProfileId) {
                await fetchLivePositions(pid);
            }
            await fetchLiveOrders(next, pid);
            if (cancelled) return;
            // Same as before: kick off broker→DB PnL refresh on open.
            if (pid) {
                void refreshStoredPnl(pid);
            }
        })();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when cycle changes
    }, [tradeCycleId]);

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.key !== "Escape") return;
            if (showModifyOrderForm) {
                closeModifyForm();
            } else if (exitPosition) {
                closeExitForm();
            } else if (tradesPanel) {
                closeTradesPanel();
            } else {
                onClose();
            }
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [exitPosition, tradesPanel, showModifyOrderForm, onClose]);

    const tradesTotalPages = Math.max(1, Math.ceil(tradesCount / tradesPageSize));
    const underlyings = data?.underlyings ?? [];
    const underlyingsSorted = useMemo(
        () => underlyingsSortedLongestFirst(data?.underlyings),
        [data?.underlyings]
    );
    const displayPositions = useMemo(
        () =>
            mergeLivePositionsWithStored(
                livePositionsRaw,
                data?.positions ?? [],
                underlyingsSorted
            ),
        [livePositionsRaw, data?.positions, underlyingsSorted]
    );
    const openLivePositionCount = useMemo(
        () => displayPositions.filter((pos) => pos.quantity !== 0).length,
        [displayPositions]
    );
    const openLiveOrderCount = useMemo(
        () => liveOrders.filter(isOpenLiveOrder).length,
        [liveOrders]
    );

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
                    {!loading && underlyings.length > 0 ? (
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-base-content/70">
                            {underlyings.map((row) => (
                                <p key={row.symbol} className="tabular-nums">
                                    {underlyings.length > 1 ? (
                                        <span className="font-medium text-base-content/80">{row.symbol} </span>
                                    ) : null}
                                    Spot {formatMarketNumber(row.spot)}
                                    <span className="px-1.5 text-base-content/30">·</span>
                                    Strike step {formatMarketNumber(row.strike_step)}
                                    <span className="px-1.5 text-base-content/30">·</span>
                                    ATM {formatMarketNumber(row.atm)}
                                </p>
                            ))}
                        </div>
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
                {loading && !data && <TradeCycleDetailsModalSkeleton />}

                {error && (
                    <div className="alert alert-error mb-4">
                        <span>{error}</span>
                    </div>
                )}

                {!loading && data && (
                    <>
                        <div className="mb-4">
                            <div
                                role="tablist"
                                aria-label="Trade cycle data"
                                className="flex w-full gap-1 rounded-xl border border-base-300/70 bg-base-200/50 p-0.5 sm:p-1"
                            >
                                {CYCLE_TAB_CONFIG.map(({ id, label, shortLabel, icon: Icon }) => {
                                    const isActive = activeTab === id;
                                    const count =
                                        id === "positions"
                                            ? displayPositions.length
                                            : id === "orders"
                                              ? openLiveOrderCount > 0
                                                ? openLiveOrderCount
                                                : liveOrders.length
                                              : data.positions.length;
                                    return (
                                        <button
                                            key={id}
                                            type="button"
                                            role="tab"
                                            aria-selected={isActive}
                                            aria-controls={`cycle-panel-${id}`}
                                            id={`cycle-tab-${id}`}
                                            onClick={() => setActiveTab(id)}
                                            className={`flex min-h-11 min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-200 sm:flex-row sm:gap-1.5 sm:px-2 ${
                                                isActive
                                                    ? "bg-base-100 text-base-content ring-1 ring-base-300/60"
                                                    : "text-base-content/50 hover:bg-base-100/35 hover:text-base-content/90"
                                            }`}
                                        >
                                            <Icon
                                                className={`size-[18px] shrink-0 transition-colors sm:size-5 ${
                                                    isActive ? "text-primary" : "text-base-content/45"
                                                }`}
                                                strokeWidth={isActive ? 2.25 : 2}
                                                aria-hidden
                                            />
                                            <span className="max-w-full truncate text-[11px] font-semibold tracking-tight sm:text-sm">
                                                <span className="sm:hidden">{shortLabel}</span>
                                                <span className="hidden sm:inline">{label}</span>
                                            </span>
                                            <span
                                                className={`rounded-full px-1.5 py-px text-[10px] font-bold tabular-nums sm:px-2 sm:py-0.5 sm:text-xs ${
                                                    isActive
                                                        ? "bg-primary/12 text-primary"
                                                        : "bg-base-300/35 text-base-content/65"
                                                }`}
                                            >
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div
                            role="tabpanel"
                            id={`cycle-panel-${activeTab}`}
                            aria-labelledby={`cycle-tab-${activeTab}`}
                        >
                            {activeTab === "positions" && (
                                <div>
                                    <div className="mb-3 flex items-center justify-end gap-2">
                                        <span className="badge badge-outline badge-sm">
                                            {displayPositions.length}{" "}
                                            {displayPositions.length === 1 ? "position" : "positions"}
                                        </span>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline btn-error"
                                            title="Exit every open live position in value batches"
                                            disabled={
                                                exitingAll ||
                                                loadingLivePositions ||
                                                openLivePositionCount < 1
                                            }
                                            onClick={() => void handleExitAll()}
                                        >
                                            {exitingAll ? (
                                                <span className="loading loading-spinner loading-xs" />
                                            ) : (
                                                "Exit all"
                                            )}
                                        </button>
                                        <button
                                            onClick={() => void refreshLiveData()}
                                            disabled={
                                                refreshing || loadingLivePositions || !profileId
                                            }
                                            className="btn btn-sm btn-ghost"
                                            title="Refresh live positions"
                                            type="button"
                                        >
                                            <RefreshCw
                                                size={16}
                                                className={
                                                    refreshing || loadingLivePositions
                                                        ? "animate-spin"
                                                        : ""
                                                }
                                            />
                                        </button>
                                    </div>

                                    {livePositionsError ? (
                                        <div className="alert alert-error mb-3">
                                            <span>{livePositionsError}</span>
                                        </div>
                                    ) : null}

                                    {loadingLivePositions && displayPositions.length === 0 ? (
                                        <div className="flex justify-center py-8">
                                            <span className="loading loading-spinner loading-md" />
                                        </div>
                                    ) : (
                                        <div className="mb-4 rounded-lg border border-base-300">
                                            <PositionsTable
                                                positions={displayPositions}
                                                showAdminTradesAction={true}
                                                showAdminExitAction={true}
                                                showGreeks={true}
                                                groupByExpiry={true}
                                                showPnl={false}
                                                onAdminViewTrades={openTradesForPosition}
                                                onAdminPositionOrder={openExitForPosition}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === "orders" && (
                                <div>
                                    <div className="mb-3 flex items-center justify-end gap-2">
                                        <span className="badge badge-outline badge-sm">
                                            {openLiveOrderCount} open / {liveOrders.length} total
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => void fetchLiveOrders(data, profileId)}
                                            disabled={loadingLiveOrders || !profileId}
                                            className="btn btn-sm btn-ghost"
                                            title="Refresh live orders"
                                        >
                                            <RefreshCw
                                                size={16}
                                                className={loadingLiveOrders ? "animate-spin" : ""}
                                            />
                                        </button>
                                    </div>

                                    {liveOrdersError ? (
                                        <div className="alert alert-error mb-3">
                                            <span>{liveOrdersError}</span>
                                        </div>
                                    ) : null}

                                    {loadingLiveOrders ? (
                                        <div className="flex justify-center py-8">
                                            <span className="loading loading-spinner loading-md" />
                                        </div>
                                    ) : liveOrders.length === 0 ? (
                                        <p className="py-6 text-center text-sm text-base-content/60">
                                            No live orders for this cycle.
                                        </p>
                                    ) : (
                                        <div className="overflow-x-auto rounded-lg border border-base-300">
                                            <table className="table table-zebra w-full text-sm">
                                                <thead>
                                                    <tr className="text-xs uppercase text-base-content/60">
                                                        <th>Order ID</th>
                                                        <th>Instrument</th>
                                                        <th>Type</th>
                                                        <th>Side</th>
                                                        <th>Qty</th>
                                                        <th>Price</th>
                                                        <th>Filled</th>
                                                        <th>Pending</th>
                                                        <th>Status</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {liveOrders.map((order) => {
                                                        const open = isOpenLiveOrder(order);
                                                        return (
                                                            <tr key={order.order_id}>
                                                                <td className="font-mono text-xs">
                                                                    {order.order_id}
                                                                </td>
                                                                <td className="font-medium">
                                                                    {order.tradingsymbol}
                                                                </td>
                                                                <td>{order.order_type}</td>
                                                                <td>
                                                                    <span
                                                                        className={
                                                                            order.transaction_type === "BUY"
                                                                                ? "text-emerald-600 dark:text-emerald-400"
                                                                                : "text-red-600 dark:text-red-400"
                                                                        }
                                                                    >
                                                                        {order.transaction_type}
                                                                    </span>
                                                                </td>
                                                                <td>{order.quantity}</td>
                                                                <td>{formatMoneyIN(order.price)}</td>
                                                                <td>{order.filled_quantity}</td>
                                                                <td>{order.pending_quantity}</td>
                                                                <td>
                                                                    <span
                                                                        className={`badge badge-sm ${
                                                                            ["COMPLETE", "FILLED"].includes(
                                                                                (order.status || "").toUpperCase()
                                                                            )
                                                                                ? "badge-success"
                                                                                : [
                                                                                        "CANCELLED",
                                                                                        "CANCELED",
                                                                                        "REJECTED",
                                                                                    ].includes(
                                                                                        (
                                                                                            order.status || ""
                                                                                        ).toUpperCase()
                                                                                    )
                                                                                  ? "badge-error"
                                                                                  : "badge-warning"
                                                                        }`}
                                                                    >
                                                                        {order.status}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    {open ? (
                                                                        <div className="flex gap-1">
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-ghost btn-xs"
                                                                                title="See depth"
                                                                                aria-label={`See depth for ${order.tradingsymbol}`}
                                                                                onClick={() =>
                                                                                    openDepth(
                                                                                        order.tradingsymbol,
                                                                                        order.exchange
                                                                                    )
                                                                                }
                                                                            >
                                                                                <BarChart3 size={14} />
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-ghost btn-xs"
                                                                                title="Modify order"
                                                                                onClick={() =>
                                                                                    openModifyForm(order)
                                                                                }
                                                                            >
                                                                                <Edit2 size={14} />
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-ghost btn-xs text-red-500"
                                                                                title="Cancel order"
                                                                                onClick={() =>
                                                                                    void handleCancelOrder(
                                                                                        order.order_id
                                                                                    )
                                                                                }
                                                                            >
                                                                                <X size={14} />
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-xs text-base-content/40">
                                                                            —
                                                                        </span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === "stored" && (
                                <div>
                                    <div className="mb-3 flex items-center justify-end gap-2">
                                        <span className="badge badge-outline badge-sm">
                                            {data.positions.length}{" "}
                                            {data.positions.length === 1 ? "position" : "positions"}
                                        </span>
                                        <button
                                            onClick={() => void refreshStoredPnl()}
                                            disabled={refreshingStored || !profileId}
                                            className="btn btn-sm btn-ghost"
                                            title="Refresh stored positions / PnL"
                                            type="button"
                                        >
                                            <RefreshCw
                                                size={16}
                                                className={refreshingStored ? "animate-spin" : ""}
                                            />
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
                                            showAdminTradesAction={true}
                                            showAdminExitAction={true}
                                            showGreeks={true}
                                            groupByExpiry={true}
                                            onAdminViewTrades={openTradesForPosition}
                                            onAdminPositionOrder={openExitForPosition}
                                        />
                                    </div>

                                    <UnmappedOrdersTable
                                        orders={data.unmapped_orders}
                                        variant="table"
                                    />
                                </div>
                            )}
                        </div>
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

            {showDepthModal && (
                <MarketDepthModal
                    open={showDepthModal}
                    onClose={() => setShowDepthModal(false)}
                    initialSymbol={depthSymbol}
                    initialExchange={depthExchange}
                />
            )}

            {showModifyOrderForm && selectedLiveOrder && (
                <div
                    className="modal modal-open z-[1100]"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modify-live-order-title"
                >
                    <div className="modal-box">
                        <h3 id="modify-live-order-title" className="mb-4 text-lg font-bold">
                            Modify order
                        </h3>
                        <form onSubmit={handleModifyOrder}>
                            <div className="mb-4 space-y-1 text-sm text-base-content/70">
                                <p>Order ID: {selectedLiveOrder.order_id}</p>
                                <p>Instrument: {selectedLiveOrder.tradingsymbol}</p>
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-xs mt-1.5 gap-1"
                                    onClick={() =>
                                        openDepth(
                                            selectedLiveOrder.tradingsymbol,
                                            selectedLiveOrder.exchange
                                        )
                                    }
                                >
                                    <BarChart3 size={14} />
                                    See depth
                                </button>
                            </div>

                            <div className="form-control mb-4">
                                <label className="label" htmlFor="modify-order-quantity">
                                    <span className="label-text">Quantity</span>
                                </label>
                                <input
                                    id="modify-order-quantity"
                                    type="number"
                                    inputMode="numeric"
                                    className="input input-bordered w-full"
                                    value={modifyForm.quantity}
                                    onChange={(e) =>
                                        setModifyForm({
                                            ...modifyForm,
                                            quantity: e.target.value,
                                        })
                                    }
                                    min={1}
                                    required
                                />
                            </div>

                            <div className="form-control mb-4">
                                <label className="label" htmlFor="modify-order-price">
                                    <span className="label-text">Price</span>
                                </label>
                                <input
                                    id="modify-order-price"
                                    type="number"
                                    step="0.01"
                                    inputMode="decimal"
                                    className="input input-bordered w-full"
                                    value={modifyForm.price}
                                    onChange={(e) =>
                                        setModifyForm({
                                            ...modifyForm,
                                            price: e.target.value,
                                        })
                                    }
                                    min={0}
                                    required
                                />
                            </div>

                            <div className="modal-action">
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={closeModifyForm}
                                    disabled={modifyingOrder}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={modifyingOrder}>
                                    {modifyingOrder ? (
                                        <span className="loading loading-spinner" />
                                    ) : (
                                        "Modify order"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {exitPosition &&
            (exitPosition.quantity !== 0 || exitIntent === "buy" || exitIntent === "sell") && (
                <div className="modal modal-open z-[1100]" role="dialog" aria-modal="true" aria-labelledby="exit-position-title">
                    <div className="modal-box">
                        <h3 id="exit-position-title" className="mb-4 text-lg font-bold">
                            {positionOrderTitle(exitIntent)}
                        </h3>
                        <form onSubmit={handleExitPosition}>
                            <div className="mb-4 space-y-1 text-sm text-base-content/70">
                                <p>Instrument: {exitPosition.instrument}</p>
                                <p>Current Quantity: {exitPosition.quantity}</p>
                                <p>Action: {positionOrderAction(exitPosition, exitIntent)}</p>
                            </div>

                            <div className="form-control mb-4">
                                <label className="label" htmlFor="exit-quantity">
                                    <span className="label-text">Quantity</span>
                                </label>
                                <input
                                    id="exit-quantity"
                                    type="number"
                                    inputMode="numeric"
                                    className="input input-bordered w-full"
                                    value={exitQuantity}
                                    onChange={(e) => setExitQuantity(e.target.value)}
                                    min={exitPosition.lot_size && exitPosition.lot_size > 1 ? exitPosition.lot_size : 1}
                                    step={exitPosition.lot_size && exitPosition.lot_size > 1 ? exitPosition.lot_size : 1}
                                    max={isOpeningIntent(exitIntent) ? undefined : Math.abs(exitPosition.quantity)}
                                    required
                                />
                                <label className="label">
                                    <span className="text-xs text-base-content/60">
                                        {isOpeningIntent(exitIntent)
                                            ? exitPosition.lot_size && exitPosition.lot_size > 1
                                                ? `Lot size ${exitPosition.lot_size}`
                                                : "Units to add"
                                            : `Max: ${Math.abs(exitPosition.quantity)} units`}
                                    </span>
                                </label>
                            </div>

                            <p className="mb-4 text-xs text-base-content/60">
                                LIMIT at best bid/offer. Open orders follow the standard modify-price loop until filled.
                            </p>

                            <div className="modal-action">
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={closeExitForm}
                                    disabled={exitingPosition}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={
                                        exitingPosition ||
                                        !Number.isFinite(parseInt(exitQuantity, 10)) ||
                                        parseInt(exitQuantity, 10) <= 0
                                    }
                                >
                                    {exitingPosition ? (
                                        <span className="loading loading-spinner"></span>
                                    ) : exitIntent === "buy" ? (
                                        "Place buy order"
                                    ) : exitIntent === "sell" ? (
                                        "Place sell order"
                                    ) : exitIntent === "increase" ? (
                                        "Place increase order"
                                    ) : exitIntent === "decrease" ? (
                                        "Place decrease order"
                                    ) : parseInt(exitQuantity, 10) === Math.abs(exitPosition.quantity) ? (
                                        "Exit full position"
                                    ) : (
                                        "Exit partial position"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
