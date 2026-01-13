"use client";

import React from "react";

export interface UnmappedOrder {
  id: number;
  instrument: string;
  action: string;
  quantity: number;
  price: number | null;
  status: string;
  order_type: string;
}

interface UnmappedOrdersTableProps {
  orders: UnmappedOrder[];
  variant?: "card" | "table";
  className?: string;
  showLoadMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
}

export default function UnmappedOrdersTable({
  orders,
  variant = "card",
  className = "",
  showLoadMore = false,
  onLoadMore,
  loadingMore = false,
}: UnmappedOrdersTableProps) {
  const getStatusColor = (status: string) => {
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
  };

  if (orders.length === 0) {
    return null;
  }

  if (variant === "card") {
    return (
      <div className={`mt-3 pt-3 border-t border-base-300 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-500 uppercase">
            Unmapped Orders
          </h4>
          <span className="badge badge-sm badge-warning">{orders.length}</span>
        </div>
        <div className="space-y-2">
          {orders.map((ord) => {
            const isBuy = ord.action === "BUY";

            return (
              <div
                key={ord.id}
                className="bg-base-200 p-2 rounded text-sm flex justify-between items-center"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{ord.instrument}</span>
                  <span
                    className={`badge badge-sm ${
                      isBuy ? "badge-success" : "badge-error"
                    }`}
                  >
                    {ord.action}
                  </span>
                </div>
                <div className="text-gray-500">
                  {ord.quantity} @ ₹{ord.price} • {ord.status}
                </div>
              </div>
            );
          })}
        </div>
        {showLoadMore && (
          <button
            className="btn btn-ghost btn-sm mt-2 self-start"
            onClick={onLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? <>Loading...</> : <>Load More Orders</>}
          </button>
        )}
      </div>
    );
  }

  // Table variant
  return (
    <div className={className}>
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
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.instrument}</td>
                <td>
                  <span
                    className={
                      order.action === "BUY" ? "text-green-500" : "text-red-500"
                    }
                  >
                    {order.action}
                  </span>
                </td>
                <td>{order.quantity}</td>
                <td>
                  {order.price ? `₹${order.price.toFixed(2)}` : "Market"}
                </td>
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
  );
}
