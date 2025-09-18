// components/TradeCycleCard.tsx
"use client";

import React, { JSX, useState } from "react";
import { CheckCircle, Clock, XCircle, ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import Link from "next/link";

interface Leg {
  id: number;
  action: "BUY" | "SELL";
  instrument: string;
  quantity: number;
  price: number;
  order_type: string;
  status: string;
  leg_index: number;
}

interface Adjustment {
  id: number;
  version: number;
  reason: string;
  created_at: string;
  legs: Leg[];
}

interface TradeCycle {
  id: number;
  name: string;
  description: string;
  state: string;
  sub_state: string;
  created_at: string;
  adjustments: Adjustment[];
}

interface Props {
  tradeCycle: TradeCycle;
  isActive: boolean;
}

const TradeCycleCard: React.FC<Props> = ({ tradeCycle, isActive }) => {
  const [expanded, setExpanded] = useState(false);

  const latestAdjustment = tradeCycle.adjustments[0]; // show latest adjustment first
  const legs = latestAdjustment?.legs ?? [];

  const statusMap: Record<string, JSX.Element> = {
    NEW: <Clock size={14} className="text-warning" />,
    PENDING: <Clock size={14} className="text-warning" />,
    COMPLETED: <CheckCircle size={14} className="text-success" />,
    STOPPED: <XCircle size={14} className="text-error" />,
  };

  return (
    <div className="card bg-base-100 shadow-md mb-6 border-l-4 border-l-primary">
      <div className="card-body p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="card-title text-lg">{tradeCycle.name}</h3>
            <div className="flex items-center mt-1">
              <span className="text-sm font-medium bg-base-200 px-2 py-1 rounded-md mr-2">
                {tradeCycle.sub_state}
              </span>
              <span className="badge gap-1">
                {statusMap[tradeCycle.state] ?? <Clock size={14} />}
                {tradeCycle.state}
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-gray-500 mt-1">
              Created: {new Date(tradeCycle.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Legs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {legs.slice(0, 4).map((leg) => (
            <div key={leg.id} className="bg-base-200 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span
                  className={`font-semibold ${
                    leg.action === "BUY" ? "text-success" : "text-error"
                  }`}
                >
                  {leg.action}
                </span>
                {leg.status === "PENDING" ? (
                  <Clock size={14} className="text-warning" />
                ) : (
                  <CheckCircle size={14} className="text-success" />
                )}
              </div>
              <div className="text-xs mt-1">{leg.instrument}</div>
              <div className="text-sm text-gray-500 mt-1">
                Qty: {leg.quantity} | ₹{leg.price}
              </div>
            </div>
          ))}
        </div>

        {/* Expand toggle */}
        {legs.length > 4 && (
          <button
            className="btn btn-ghost btn-sm self-start mb-4"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp size={16} className="mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown size={16} className="mr-1" />
                Show All {legs.length} Legs
              </>
            )}
          </button>
        )}

        {expanded && (
          <div className="bg-base-200 p-4 rounded-lg mb-4">
            <h4 className="font-semibold mb-3">All Legs</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {legs.map((leg) => (
                <div key={leg.id} className="bg-base-100 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span
                      className={`font-semibold ${
                        leg.action === "BUY" ? "text-success" : "text-error"
                      }`}
                    >
                      {leg.action}
                    </span>
                    {leg.status === "PENDING" ? (
                      <Clock size={14} className="text-warning" />
                    ) : (
                      <CheckCircle size={14} className="text-success" />
                    )}
                  </div>
                  <div className="text-sm mt-2">{leg.instrument}</div>
                  <div className="text-sm mt-1">Qty: {leg.quantity}</div>
                  <div className="text-sm mt-1">Price: ₹{leg.price}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="card-actions justify-end">
          {isActive ? (
            <>
              <button className="btn btn-outline btn-error btn-sm">
                Close Trade Cycle
              </button>
              <Link href={`/dashboard/trade-cycle/${tradeCycle.id}`} className="btn btn-primary btn-sm">
                Modify
              </Link>
            </>
          ) : (
            <Link href={`/dashboard/trade-cycle/${tradeCycle.id}`} className="btn btn-outline btn-sm">
              View Details
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default TradeCycleCard;
