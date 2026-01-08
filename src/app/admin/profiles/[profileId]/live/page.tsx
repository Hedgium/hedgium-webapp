"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { authFetch } from "@/utils/api";
import useAlert from "@/hooks/useAlert";
import { ArrowLeft, RefreshCw, Plus, Edit2, X } from "lucide-react";
import { LivePosition } from "@/components/LivePositionsModal";
import { Profile } from "@/types/profile";

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

export default function LivePositionsPage() {
  const params = useParams();
  const router = useRouter();
  const profileId = params.profileId as string;
  const alert = useAlert();

  const [positions, setPositions] = useState<LivePosition[]>([]);
  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [loadingPositions, setLoadingPositions] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [showPlaceOrderForm, setShowPlaceOrderForm] = useState(false);
  const [showModifyOrderForm, setShowModifyOrderForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<LiveOrder | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [modifyingOrder, setModifyingOrder] = useState(false);

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

      console.log(data);

      if (data.status === "success") {
        setPositions(data.data?.net || []);
      } else {
        alert.error("Failed to fetch live positions");
      }
    } catch (error) {
      console.error("Error fetching live positions:", error);
      alert.error("Error fetching live positions");
    } finally {
      setLoadingPositions(false);
    }
  }, [profileId, alert]);

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const response = await authFetch(`orders/live/orders/${profileId}/`);
      const data = await response.json();

      if (data.status === "success") {
        setOrders(data.data || []);
      } else {
        alert.error("Failed to fetch live orders");
      }
    } catch (error) {
      console.error("Error fetching live orders:", error);
      alert.error("Error fetching live orders");
    } finally {
      setLoadingOrders(false);
    }
  }, [profileId, alert]);

  useEffect(() => {
    fetchProfile();
    fetchPositions();
    fetchOrders();
  }, [fetchProfile, fetchPositions, fetchOrders]);

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

      const response = await authFetch(`orders/live/orders/${profileId}/place/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

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

      const response = await authFetch(
        `orders/live/orders/${profileId}/modify/${selectedOrder.order_id}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (data.status === "success") {
        alert.success("Order modified successfully");
        setShowModifyOrderForm(false);
        setSelectedOrder(null);
        fetchOrders();
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
      const response = await authFetch(
        `orders/live/orders/${profileId}/cancel/${orderId}/`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();
      console.log(data);

      if (data.status === "success" || response.ok) {
        alert.success("Order cancelled successfully");
        fetchOrders();
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

  return (
    <div className="p-6 bg-base-200 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="btn btn-ghost btn-sm"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Live Positions & Orders</h1>
              {profile && (
                <p className="text-sm text-gray-400">
                  {profile.user?.email} - {profile.broker_name}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchPositions}
              disabled={loadingPositions}
              className="btn btn-outline btn-sm"
            >
              <RefreshCw
                size={16}
                className={loadingPositions ? "animate-spin" : ""}
              />
              Refresh Positions
            </button>
            <button
              onClick={fetchOrders}
              disabled={loadingOrders}
              className="btn btn-outline btn-sm"
            >
              <RefreshCw
                size={16}
                className={loadingOrders ? "animate-spin" : ""}
              />
              Refresh Orders
            </button>
            <button
              onClick={() => setShowPlaceOrderForm(true)}
              className="btn btn-primary btn-sm"
            >
              <Plus size={16} />
              Place Order
            </button>
          </div>
        </div>

        {/* Live Positions Section */}
        <div className="bg-base-100 rounded-lg p-6 mb-6 shadow">
          <h2 className="text-xl font-semibold mb-4">Live Positions</h2>
          {loadingPositions ? (
            <div className="text-center py-8">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : positions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Instrument</th>
                    <th>Qty</th>
                    <th>Avg Price</th>
                    <th>LTP</th>
                    <th>P&L</th>
                    <th>Day P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((position: LivePosition, index: number) => (
                    <tr key={index}>
                      <td className="font-medium">{position.tradingsymbol}</td>
                      <td>{position.quantity}</td>
                      <td>
                        {position.average_price
                          ? `₹${position.average_price.toFixed(2)}`
                          : "-"}
                      </td>
                      <td>
                        {position.last_price
                          ? `₹${position.last_price.toFixed(2)}`
                          : "-"}
                      </td>
                      <td
                        className={
                          position.pnl && position.pnl >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }
                      >
                        {position.pnl !== undefined
                          ? `₹${position.pnl.toFixed(2)}`
                          : "-"}
                      </td>
                      <td
                        className={
                          position.day_pnl && position.day_pnl >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }
                      >
                        {position.day_pnl !== undefined
                          ? `₹${position.day_pnl.toFixed(2)}`
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-400 py-8">No positions found</p>
          )}
        </div>

        {/* Live Orders Section */}
        <div className="bg-base-100 rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">Live Orders</h2>
          {loadingOrders ? (
            <div className="text-center py-8">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Order ID</th>
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
                      <td className="font-medium">{order.tradingsymbol}</td>
                      <td>{order.order_type}</td>
                      <td>
                        <span
                          className={
                            order.transaction_type === "BUY"
                              ? "text-green-400"
                              : "text-red-400"
                          }
                        >
                          {order.transaction_type}
                        </span>
                      </td>
                      <td>{order.quantity}</td>
                      <td>₹{order.price.toFixed(2)}</td>
                      <td>{order.filled_quantity}</td>
                      <td>{order.pending_quantity}</td>
                      <td>
                        <span
                          className={`badge ${
                            order.status === "COMPLETE" ||
                            order.status === "FILLED"
                              ? "badge-success"
                              : order.status === "CANCELLED" ||
                                order.status === "REJECTED"
                              ? "badge-error"
                              : "badge-warning"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          {order.status !== "COMPLETE" &&
                            order.status !== "FILLED" &&
                            order.status !== "CANCELED" &&
                            order.status !== "REJECTED" && (
                              <>
                                <button
                                  onClick={() => openModifyForm(order)}
                                  className="btn btn-ghost btn-xs"
                                  title="Modify Order"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
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
            <p className="text-center text-gray-400 py-8">No orders found</p>
          )}
        </div>
      </div>

      {/* Place Order Modal */}
      {showPlaceOrderForm && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Place New Order</h3>
            <form onSubmit={handlePlaceOrder}>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Exchange</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={orderForm.exchange}
                  onChange={(e) =>
                    setOrderForm({ ...orderForm, exchange: e.target.value })
                  }
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
                  onChange={(e) =>
                    setOrderForm({ ...orderForm, tradingsymbol: e.target.value })
                  }
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
                  onChange={(e) =>
                    setOrderForm({ ...orderForm, order_type: e.target.value })
                  }
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
                  onChange={(e) =>
                    setOrderForm({ ...orderForm, product: e.target.value })
                  }
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
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={placingOrder}
                >
                  {placingOrder ? (
                    <span className="loading loading-spinner"></span>
                  ) : (
                    "Place Order"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modify Order Modal */}
      {showModifyOrderForm && selectedOrder && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Modify Order</h3>
            <form onSubmit={handleModifyOrder}>
              <div className="mb-4">
                <p className="text-sm text-gray-400">
                  Order ID: {selectedOrder.order_id}
                </p>
                <p className="text-sm text-gray-400">
                  Instrument: {selectedOrder.tradingsymbol}
                </p>
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
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={modifyingOrder}
                >
                  {modifyingOrder ? (
                    <span className="loading loading-spinner"></span>
                  ) : (
                    "Modify Order"
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
