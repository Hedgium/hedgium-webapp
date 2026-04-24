"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "@/utils/api";
import { formatMoneyIN } from "@/utils/formatNumber";
import { placeOrder, modifyOrder, cancelOrder } from "@/services/liveTradingActions";
import useAlert from "@/hooks/useAlert";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  RefreshCw,
  Plus,
  Edit2,
  X,
  LogOut,
  TrendingUp,
  TrendingDown,
  Wallet,
  ClipboardList,
  ArrowRightLeft,
} from "lucide-react";
import { Profile } from "@/types/profile";
import { LivePosition } from "@/types/positions";

function formatDateTimeCell(value: string | Date | null | undefined): string {
  if (value == null || value === "") return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
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

/** Broker trade book row (normalized across integrations). */
interface LiveTrade {
  trade_id?: string;
  order_id?: string;
  exchange_order_id?: string;
  exchange?: string;
  tradingsymbol?: string;
  instrument_token?: number;
  product?: string;
  average_price?: number;
  quantity?: number;
  transaction_type?: string;
  fill_timestamp?: string;
  order_timestamp?: string;
  exchange_timestamp?: string;
}

type LivePanelTab = "positions" | "orders" | "trades";

const LIVE_TAB_CONFIG: {
  id: LivePanelTab;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}[] = [
  { id: "positions", label: "Positions", shortLabel: "Pos", icon: Wallet },
  { id: "orders", label: "Orders", shortLabel: "Ord", icon: ClipboardList },
  { id: "trades", label: "Trades", shortLabel: "Trd", icon: ArrowRightLeft },
];

interface OrderFormData {
  exchange: string;
  tradingsymbol: string;
  transaction_type: string;
  quantity: number;
  order_type: string;
  product: string;
  price: number;
}

interface ModifyOrderFormData {
  quantity: number;
  price: number;
  tradingsymbol: string;
  exchange: string;
}

export type ProfileLiveTradingPanelVariant = "page" | "embedded";

export interface ProfileLiveTradingPanelProps {
  profileId: string;
  variant: ProfileLiveTradingPanelVariant;
}

export default function ProfileLiveTradingPanel({ profileId, variant }: ProfileLiveTradingPanelProps) {
  const router = useRouter();
  const alert = useAlert();

  const [activeTab, setActiveTab] = useState<LivePanelTab>("positions");
  const [positions, setPositions] = useState<LivePosition[]>([]);
  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [trades, setTrades] = useState<LiveTrade[]>([]);
  const [loadingPositions, setLoadingPositions] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingTrades, setLoadingTrades] = useState(false);
  /** When live positions were last fetched (shown when broker does not send per-row time). */
  const [positionsFetchedAt, setPositionsFetchedAt] = useState<string | null>(null);
  /** When live orders were last fetched (fallback when order has no timestamp). */
  const [ordersFetchedAt, setOrdersFetchedAt] = useState<string | null>(null);
  /** When live trades were last fetched (fallback when trade has no fill time). */
  const [tradesFetchedAt, setTradesFetchedAt] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [showPlaceOrderForm, setShowPlaceOrderForm] = useState(false);
  const [showModifyOrderForm, setShowModifyOrderForm] = useState(false);
  const [showExitPositionForm, setShowExitPositionForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<LiveOrder | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<LivePosition | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [modifyingOrder, setModifyingOrder] = useState(false);
  const [exitingPosition, setExitingPosition] = useState(false);
  const [exitQuantity, setExitQuantity] = useState<number>(0);

  const [orderForm, setOrderForm] = useState<OrderFormData>({
    exchange: "NSE",
    tradingsymbol: "",
    transaction_type: "BUY",
    quantity: 1,
    order_type: "MARKET",
    product: "CNC",
    price: 0,
  });

  const [modifyForm, setModifyForm] = useState<ModifyOrderFormData>({
    quantity: 0,
    price: 0,
    tradingsymbol: "",
    exchange: "",
  });

  const fetchProfile = useCallback(async () => {
    try {
      const response = await authFetch(`profiles/${profileId}/`);
      const data = await response.json();
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  }, [profileId]);

  const fetchPositions = useCallback(async () => {
    setLoadingPositions(true);
    try {
      const response = await authFetch(`positions/live/positions/${profileId}/`);
      const data = await response.json();

      if (data.status === "success") {
        setPositions(data.data?.net || []);
        setPositionsFetchedAt(new Date().toISOString());
      } else {
        alert.error("Failed to fetch live positions");
      }
    } catch (error) {
      console.error("Error fetching live positions:", error);
      alert.error("Error fetching live positions");
    } finally {
      setLoadingPositions(false);
    }
  }, [profileId]);

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const response = await authFetch(`orders/live/orders/${profileId}/`);
      const data = await response.json();

      if (data.status === "success") {
        setOrders(data.data || []);
        setOrdersFetchedAt(new Date().toISOString());
      } else {
        alert.error("Failed to fetch live orders");
      }
    } catch (error) {
      console.error("Error fetching live orders:", error);
      alert.error("Error fetching live orders");
    } finally {
      setLoadingOrders(false);
    }
  }, [profileId]);

  const fetchTrades = useCallback(async () => {
    setLoadingTrades(true);
    try {
      const response = await authFetch(`orders/live/trades/${profileId}/`);
      const data = await response.json();

      if (data.status === "success") {
        setTrades(Array.isArray(data.data) ? data.data : []);
        setTradesFetchedAt(new Date().toISOString());
      } else {
        alert.error(data.message || "Failed to fetch live trades");
      }
    } catch (error) {
      console.error("Error fetching live trades:", error);
      alert.error("Error fetching live trades");
    } finally {
      setLoadingTrades(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchProfile();
    fetchPositions();
    fetchOrders();
    fetchTrades();
  }, [fetchProfile, fetchPositions, fetchOrders, fetchTrades]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlacingOrder(true);
    try {
      const payload = {
        exchange: orderForm.exchange,
        tradingsymbol: orderForm.tradingsymbol,
        transaction_type: orderForm.transaction_type,
        quantity: orderForm.quantity,
        order_type: orderForm.order_type,
        product: orderForm.product,
        price: orderForm.order_type === "MARKET" ? 0 : orderForm.price,
      };

      const { data } = await placeOrder(profileId, payload);

      if (data.status === "success") {
        alert.success("Order placed successfully");
        setShowPlaceOrderForm(false);
        setOrderForm({
          exchange: "NSE",
          tradingsymbol: "",
          transaction_type: "BUY",
          quantity: 1,
          order_type: "MARKET",
          product: "CNC",
          price: 0,
        });
        fetchOrders();
        fetchTrades();
      } else {
        alert.error(data.message || "Failed to place order");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      alert.error("Error placing order");
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleModifyOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setModifyingOrder(true);
    try {
      const payload = {
        quantity: modifyForm.quantity,
        price: modifyForm.price,
        tradingsymbol: modifyForm.tradingsymbol,
        exchange: modifyForm.exchange,
      };

      const { data } = await modifyOrder(profileId, selectedOrder.order_id, payload);

      if (data.status === "success") {
        alert.success("Order modified successfully");
        setShowModifyOrderForm(false);
        setSelectedOrder(null);
        fetchOrders();
        fetchTrades();
      } else {
        alert.error(data.message || "Failed to modify order");
      }
    } catch (error) {
      console.error("Error modifying order:", error);
      alert.error("Error modifying order");
    } finally {
      setModifyingOrder(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;

    try {
      const { ok, data } = await cancelOrder(profileId, orderId);

      if (data.status === "success" || ok) {
        alert.success("Order cancelled successfully");
        fetchOrders();
        fetchTrades();
      } else {
        alert.error(data.message || "Failed to cancel order");
      }
    } catch (error) {
      console.log("Error cancelling order:", error);
      alert.error("Error cancelling order");
    }
  };

  const openModifyForm = (order: LiveOrder) => {
    setSelectedOrder(order);
    setModifyForm({
      quantity: order.quantity,
      price: order.price,
      tradingsymbol: order.tradingsymbol,
      exchange: order.exchange,
    });
    setShowModifyOrderForm(true);
  };

  const handleExitPosition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPosition) return;

    if (selectedPosition.quantity === 0) {
      alert.error("Cannot exit position with zero quantity");
      return;
    }

    setExitingPosition(true);
    try {
      const exitAction = selectedPosition.quantity > 0 ? "SELL" : "BUY";
      const exitQty = Math.abs(exitQuantity);
      const exchange = selectedPosition.exchange || "NSE";

      const payload = {
        exchange: exchange,
        tradingsymbol: selectedPosition.tradingsymbol,
        transaction_type: exitAction,
        quantity: exitQty,
        order_type: "MARKET",
        product: exchange === "NSE" || exchange === "BSE" ? "CNC" : "NRML",
        price: 0,
      };

      const { data } = await placeOrder(profileId, payload);

      if (data.status === "success") {
        alert.success(
          exitQty === Math.abs(selectedPosition.quantity)
            ? "Position exited successfully"
            : `Partial exit of ${exitQty} units completed`
        );
        setShowExitPositionForm(false);
        setSelectedPosition(null);
        setExitQuantity(0);
        fetchPositions();
        fetchOrders();
        fetchTrades();
      } else {
        alert.error(data.message || "Failed to exit position");
      }
    } catch (error) {
      console.error("Error exiting position:", error);
      alert.error("Error exiting position");
    } finally {
      setExitingPosition(false);
    }
  };

  const placeOrderButton = (
    <button
      type="button"
      onClick={() => setShowPlaceOrderForm(true)}
      className="btn btn-primary btn-sm shrink-0"
    >
      <Plus size={16} />
      Place Order
    </button>
  );

  return (
    <>
      {variant === "page" ? (
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => router.back()} className="btn btn-ghost btn-sm">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Live trading</h1>
              {profile && (
                <p className="text-sm text-gray-400">
                  {profile.user?.email} - {profile.broker_name}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">{placeOrderButton}</div>
        </div>
      ) : (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-base-300 pb-4">
          <div className="min-w-0">
            {profile ? (
              <p className="truncate text-sm text-base-content/70">
                {profile.user?.email} — {profile.broker_name}
              </p>
            ) : (
              <p className="text-sm text-base-content/50">Profile #{profileId}</p>
            )}
          </div>
          {placeOrderButton}
        </div>
      )}

      <div className="mb-5">
        <div
          role="tablist"
          aria-label="Live broker data"
          className="flex w-full gap-1 rounded-2xl border border-base-300/70 bg-gradient-to-b from-base-200/80 to-base-200/40 shadow-inner sm:gap-1.5"
        >
          {LIVE_TAB_CONFIG.map(({ id, label, shortLabel, icon: Icon }) => {
            const isActive = activeTab === id;
            const count =
              id === "positions" ? positions.length : id === "orders" ? orders.length : trades.length;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`live-panel-${id}`}
                id={`live-tab-${id}`}
                onClick={() => setActiveTab(id)}
                className={`flex cursor-pointer min-h-[48px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1.5 py-2 outline-none transition-all duration-200 ease-out focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-200 sm:flex-row sm:gap-2.5 sm:px-4 sm:py-2.5 ${
                  isActive
                    ? "bg-base-100 text-base-content shadow-md ring-1 ring-base-300/60 dark:ring-base-content/15"
                    : "text-base-content/50 hover:bg-base-100/35 hover:text-base-content/90 active:scale-[0.98]"
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
        className="mb-6 rounded-lg bg-base-100 p-6"
        role="tabpanel"
        id={`live-panel-${activeTab}`}
        aria-labelledby={`live-tab-${activeTab}`}
      >
        {activeTab === "positions" && (
          <>
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-xl font-semibold">Live positions</h2>
              <div>
                <span className="badge badge-md badge-outline">
                  {positions.length} {positions.length === 1 ? "position" : "positions"}
                </span>
                <button
                  type="button"
                  onClick={fetchPositions}
                  disabled={loadingPositions}
                  className="btn btn-ghost btn-sm"
                  title="Refresh positions"
                >
                  <RefreshCw size={16} className={loadingPositions ? "animate-spin" : ""} />
                </button>
              </div>
            </div>
        {loadingPositions ? (
          <div className="py-8 text-center">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : positions.length > 0 ? (
          <>
            {(() => {
              const totalPnl = positions.reduce((sum, pos) => sum + (pos.pnl || 0), 0);
              const totalRealised = positions.reduce(
                (sum, pos) => sum + (pos.realised || pos.realised_total || 0),
                0
              );
              const totalUnrealised = positions.reduce(
                (sum, pos) => sum + (pos.unrealised_total ?? pos.unrealised ?? 0),
                0
              );
              const totalPnlColor = totalPnl >= 0 ? "text-green-400" : "text-red-400";

              return (
                <div className="mb-4 grid grid-cols-3 gap-4 rounded-lg bg-base-200 p-4">
                  <div className="text-center">
                    <div className="mb-1 text-xs uppercase tracking-wide text-gray-500">Total P&L</div>
                    <div className={`flex items-center justify-center gap-1 text-lg font-bold ${totalPnlColor}`}>
                      {totalPnl >= 0 ? <TrendingUp width={16} /> : <TrendingDown width={16} />}
                      {formatMoneyIN(totalPnl)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="mb-1 text-xs uppercase tracking-wide text-gray-500">Total Realised</div>
                    <div className="text-lg font-semibold">{formatMoneyIN(totalRealised)}</div>
                  </div>
                  <div className="text-center">
                    <div className="mb-1 text-xs uppercase tracking-wide text-gray-500">Total Unrealised</div>
                    <div className="text-lg font-semibold">{formatMoneyIN(totalUnrealised)}</div>
                  </div>
                </div>
              );
            })()}

            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Instrument</th>
                    <th className="whitespace-nowrap">Date & time</th>
                    <th>Qty(B/S)</th>
                    <th>Avg Price</th>
                    <th>LTP</th>
                    <th>P&L</th>
                    <th>Realised</th>
                    <th>Unrealised</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((position: LivePosition, index: number) => (
                    <tr key={index}>
                      <td className="font-medium">{position.tradingsymbol}</td>
                      <td className="whitespace-nowrap text-xs text-base-content/80">
                        {formatDateTimeCell(
                          position.updated_at ??
                            position.last_price_update ??
                            positionsFetchedAt
                        )}
                      </td>
                      <td>
                        {position.quantity} ({position.buy_quantity}/{position.sell_quantity})
                      </td>
                      <td>{position.average_price ? formatMoneyIN(position.average_price) : "-"}</td>
                      <td>{position.last_price ? formatMoneyIN(position.last_price) : "-"}</td>
                      <td
                        className={
                          position.pnl && position.pnl >= 0 ? "text-green-400" : "text-red-400"
                        }
                      >
                        {position.pnl !== undefined ? formatMoneyIN(position.pnl) : "-"}
                      </td>
                      <td>
                        {position.realised !== undefined || position.realised_total !== undefined
                          ? formatMoneyIN(position.realised ?? position.realised_total ?? 0)
                          : "-"}
                      </td>
                      <td>
                        {position.unrealised_total !== undefined || position.unrealised !== undefined
                          ? formatMoneyIN(position.unrealised_total ?? position.unrealised ?? 0)
                          : "-"}
                      </td>
                      <td>
                        {position.quantity !== 0 && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPosition(position);
                                setExitQuantity(Math.abs(position.quantity));
                                setShowExitPositionForm(true);
                              }}
                              className="btn btn-ghost btn-xs"
                              title="Exit Position"
                            >
                              <LogOut size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="py-8 text-center text-gray-400">No positions found</p>
        )}
          </>
        )}

        {activeTab === "orders" && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Live orders</h2>
              <div>
                <span className="badge badge-md badge-outline">
                  {orders.length} {orders.length === 1 ? "order" : "orders"}
                </span>
                <button
                  type="button"
                  onClick={fetchOrders}
                  disabled={loadingOrders}
                  className="btn btn-ghost btn-sm"
                  title="Refresh orders"
                >
                  <RefreshCw size={16} className={loadingOrders ? "animate-spin" : ""} />
                </button>
              </div>
            </div>
        {loadingOrders ? (
          <div className="py-8 text-center">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th className="whitespace-nowrap">Date & time</th>
                  <th>Instrument</th>
                  <th>Type</th>
                  <th>Transaction</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Filled</th>
                  <th>Pending</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order: LiveOrder) => (
                  <tr key={order.order_id}>
                    <td className="font-mono text-xs">{order.order_id}</td>
                    <td className="whitespace-nowrap text-xs text-base-content/80">
                      {formatDateTimeCell(order.order_timestamp ?? ordersFetchedAt)}
                    </td>
                    <td className="font-medium">{order.tradingsymbol}</td>
                    <td>{order.order_type}</td>
                    <td>
                      <span
                        className={
                          order.transaction_type === "BUY" ? "text-green-400" : "text-red-400"
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
                        className={`badge ${
                          ["COMPLETE", "FILLED"].includes((order.status || "").toUpperCase())
                            ? "badge-success"
                            : ["CANCELLED", "CANCELED", "REJECTED"].includes(
                                  (order.status || "").toUpperCase()
                                )
                              ? "badge-error"
                              : "badge-warning"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        {!["COMPLETE", "FILLED", "CANCELED", "CANCELLED", "REJECTED"].includes(
                          (order.status || "").toUpperCase()
                        ) && (
                          <>
                            <button
                              type="button"
                              onClick={() => openModifyForm(order)}
                              className="btn btn-ghost btn-xs"
                              title="Modify Order"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancelOrder(order.order_id)}
                              className="btn btn-ghost btn-xs text-red-400"
                              title="Cancel Order"
                            >
                              <X size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-gray-400">No orders found</p>
        )}
          </>
        )}

        {activeTab === "trades" && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Live trades</h2>
              <div>
                <span className="badge badge-md badge-outline">
                  {trades.length} {trades.length === 1 ? "trade" : "trades"}
                </span>
                <button
                  type="button"
                  onClick={fetchTrades}
                  disabled={loadingTrades}
                  className="btn btn-ghost btn-sm"
                  title="Refresh trades"
                >
                  <RefreshCw size={16} className={loadingTrades ? "animate-spin" : ""} />
                </button>
              </div>
            </div>
            {loadingTrades ? (
              <div className="py-8 text-center">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : trades.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>Trade ID</th>
                      <th className="whitespace-nowrap">Fill time</th>
                      <th>Instrument</th>
                      <th>Exch.</th>
                      <th>Side</th>
                      <th>Qty</th>
                      <th>Avg price</th>
                      <th>Product</th>
                      <th>Order ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((trade: LiveTrade, index: number) => (
                      <tr
                        key={
                          trade.trade_id
                            ? String(trade.trade_id)
                            : `${trade.order_id ?? "o"}-${index}`
                        }
                      >
                        <td className="max-w-[10rem] truncate font-mono text-xs" title={trade.trade_id}>
                          {trade.trade_id ?? "—"}
                        </td>
                        <td className="whitespace-nowrap text-xs text-base-content/80">
                          {formatDateTimeCell(
                            trade.fill_timestamp ??
                              trade.exchange_timestamp ??
                              trade.order_timestamp ??
                              tradesFetchedAt
                          )}
                        </td>
                        <td className="font-medium">{trade.tradingsymbol ?? "—"}</td>
                        <td className="text-xs">{trade.exchange ?? "—"}</td>
                        <td>
                          <span
                            className={
                              (trade.transaction_type || "").toUpperCase() === "BUY"
                                ? "text-green-400"
                                : "text-red-400"
                            }
                          >
                            {trade.transaction_type ?? "—"}
                          </span>
                        </td>
                        <td>{trade.quantity ?? "—"}</td>
                        <td>
                          {trade.average_price != null &&
                          !Number.isNaN(Number(trade.average_price))
                            ? formatMoneyIN(Number(trade.average_price))
                            : "—"}
                        </td>
                        <td className="text-xs">{trade.product ?? "—"}</td>
                        <td className="max-w-[8rem] truncate font-mono text-xs" title={trade.order_id}>
                          {trade.order_id ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-8 text-center text-gray-400">No trades found</p>
            )}
          </>
        )}
      </div>

      {showPlaceOrderForm && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="mb-4 text-lg font-bold">Place New Order</h3>
            <form onSubmit={handlePlaceOrder}>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Exchange</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={orderForm.exchange}
                  onChange={(e) => setOrderForm({ ...orderForm, exchange: e.target.value })}
                  required
                >
                  <option value="NSE">NSE</option>
                  <option value="BSE">BSE</option>
                  <option value="NFO">NFO</option>
                  <option value="MCX">MCX</option>
                </select>
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Trading Symbol</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={orderForm.tradingsymbol}
                  onChange={(e) => setOrderForm({ ...orderForm, tradingsymbol: e.target.value })}
                  placeholder="e.g., INFY, RELIANCE"
                  required
                />
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Transaction Type</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={orderForm.transaction_type}
                  onChange={(e) =>
                    setOrderForm({
                      ...orderForm,
                      transaction_type: e.target.value,
                    })
                  }
                  required
                >
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Order Type</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={orderForm.order_type}
                  onChange={(e) => setOrderForm({ ...orderForm, order_type: e.target.value })}
                  required
                >
                  <option value="MARKET">MARKET</option>
                  <option value="LIMIT">LIMIT</option>
                </select>
              </div>

              {orderForm.order_type === "LIMIT" && (
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Price</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="input input-bordered w-full"
                    value={orderForm.price}
                    onChange={(e) =>
                      setOrderForm({
                        ...orderForm,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>
              )}

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Quantity</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  value={orderForm.quantity}
                  onChange={(e) =>
                    setOrderForm({
                      ...orderForm,
                      quantity: parseInt(e.target.value) || 1,
                    })
                  }
                  min="1"
                  required
                />
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Product</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={orderForm.product}
                  onChange={(e) => setOrderForm({ ...orderForm, product: e.target.value })}
                  required
                >
                  <option value="CNC">CNC</option>
                  <option value="NRML">NRML</option>
                  <option value="MIS">MIS</option>
                </select>
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowPlaceOrderForm(false)}
                  disabled={placingOrder}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={placingOrder}>
                  {placingOrder ? <span className="loading loading-spinner"></span> : "Place Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showExitPositionForm && selectedPosition && selectedPosition.quantity !== 0 && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="mb-4 text-lg font-bold">Exit Position</h3>
            <form onSubmit={handleExitPosition}>
              <div className="mb-4">
                <p className="text-sm text-gray-400">Instrument: {selectedPosition.tradingsymbol}</p>
                <p className="text-sm text-gray-400">Current Quantity: {selectedPosition.quantity}</p>
                <p className="text-sm text-gray-400">
                  Exit Action: {selectedPosition.quantity > 0 ? "SELL" : "BUY"}
                </p>
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Exit Quantity</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  value={exitQuantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    const maxQty = Math.abs(selectedPosition.quantity);
                    setExitQuantity(Math.min(val, maxQty));
                  }}
                  min="1"
                  max={Math.abs(selectedPosition.quantity)}
                  required
                />
                <label className="label">
                  <span className="label-text-alt">Max: {Math.abs(selectedPosition.quantity)} units</span>
                </label>
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Order Type</span>
                </label>
                <select className="select select-bordered w-full" defaultValue="MARKET" disabled>
                  <option value="MARKET">MARKET</option>
                </select>
                <label className="label">
                  <span className="label-text-alt">Exit orders are placed as MARKET orders</span>
                </label>
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setShowExitPositionForm(false);
                    setSelectedPosition(null);
                    setExitQuantity(0);
                  }}
                  disabled={exitingPosition}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={exitingPosition || exitQuantity <= 0}
                >
                  {exitingPosition ? (
                    <span className="loading loading-spinner"></span>
                  ) : exitQuantity === Math.abs(selectedPosition.quantity) ? (
                    "Exit Full Position"
                  ) : (
                    "Exit Partial Position"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModifyOrderForm && selectedOrder && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="mb-4 text-lg font-bold">Modify Order</h3>
            <form onSubmit={handleModifyOrder}>
              <div className="mb-4">
                <p className="text-sm text-gray-400">Order ID: {selectedOrder.order_id}</p>
                <p className="text-sm text-gray-400">Instrument: {selectedOrder.tradingsymbol}</p>
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Quantity</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  value={modifyForm.quantity}
                  onChange={(e) =>
                    setModifyForm({
                      ...modifyForm,
                      quantity: parseInt(e.target.value) || 0,
                    })
                  }
                  min="1"
                  required
                />
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Price</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input input-bordered w-full"
                  value={modifyForm.price}
                  onChange={(e) =>
                    setModifyForm({
                      ...modifyForm,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                  required
                />
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setShowModifyOrderForm(false);
                    setSelectedOrder(null);
                  }}
                  disabled={modifyingOrder}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={modifyingOrder}>
                  {modifyingOrder ? <span className="loading loading-spinner"></span> : "Modify Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
