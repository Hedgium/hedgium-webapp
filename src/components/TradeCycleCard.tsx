// components/TradeCycleCard.tsx
"use client";

import React, { JSX, useState } from "react";
import { Icon } from "@iconify/react";
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

  const latestAdjustment = tradeCycle.adjustments[0]; // latest adjustment
  const legs = latestAdjustment?.legs ?? [];

  const statusMap: Record<string, JSX.Element> = {
    NEW: <Icon icon="lucide:clock" width={14} className="text-warning" />,
    PENDING: <Icon icon="lucide:clock" width={14} className="text-warning" />,
    COMPLETED: <Icon icon="lucide:check-circle" width={14} className="text-success" />,
    STOPPED: <Icon icon="lucide:x-circle" width={14} className="text-error" />,
  };

  return (
    <div className="card bg-base-100 snap-start shrink-0 w-[85%] sm:w-[60%] md:w-[50%] shadow-md mb-6 flex flex-col">
      <div className="card-body p-4 flex flex-col flex-1">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="card-title text-lg">{tradeCycle.name}</h3>
            <div className="flex gap-2 items-center mt-1">
              <span className="badge badge-outline badge-info gap-1">
                {statusMap[tradeCycle.state] ?? <Icon icon="lucide:clock" width={14} />}
                {tradeCycle.state}
              </span>
              
              <span className="badge badge-outline badge-dash">{tradeCycle.sub_state}</span>
              
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Created: {new Date(tradeCycle.created_at).toLocaleDateString()}
          </div>
        </div>

        {/* Legs */}
        <h4 className="font-semibold mb-2">Legs</h4>
        <div className="space-y-2">
          {legs.slice(0, expanded ? legs.length : 4).map((leg) => (
            <div
              key={leg.id}
              className="flex items-center justify-between bg-base-200 px-3 py-2 rounded-lg text-sm"
            >
              <span
                className={`font-semibold ${
                  leg.action === "BUY" ? "text-success" : "text-error"
                }`}
              >
                {leg.action}
              </span>
              <span className="flex-1 text-gray-600 ml-3 truncate">
                {leg.instrument}
              </span>
              <span className="text-gray-500">Qty {leg.quantity}</span>
              <span className="ml-2">₹{leg.price}</span>
              {leg.status === "PENDING" ? (
                <Icon icon="lucide:clock" width={14} className="ml-2 text-warning" />
              ) : (
                <Icon icon="lucide:check-circle" width={14} className="ml-2 text-success" />
              )}
            </div>
          ))}
        </div>

        {/* Expand toggle */}
        {legs.length > 4 && (
          <button
            className="btn btn-ghost btn-xs mt-2 self-start"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <Icon icon="lucide:chevron-up" width={14} className="mr-1" />
                Show Less
              </>
            ) : (
              <>
                <Icon icon="lucide:chevron-down" width={14} className="mr-1" />
                Show All {legs.length}
              </>
            )}
          </button>
        )}

        {/* Spacer pushes actions down */}
        <div className="flex-1"></div>

        {/* Actions */}
        <div className="card-actions justify-end mt-4">
        { tradeCycle.state != "NEW" &&
          <Link
            href={`/hedgium/positions/${tradeCycle.id}`}
            className="btn btn-outline btn-sm"
          >
            View Positions
          </Link>
        }
        </div>
      </div>
    </div>
  );
};

export default TradeCycleCard;
