"use client";

import React, { JSX, useState, useEffect } from "react";
import { Clock, CheckCircle, XCircle, ChevronUp, ChevronDown } from "lucide-react";
import Link from "next/link";
import { authFetch } from "@/utils/api";
import useAlert from "@/hooks/useAlert";

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
  const alert = useAlert();

  // ✅ Mirror props into state
  const [cycle, setCycle] = useState<TradeCycle>(tradeCycle);

  // ✅ Sync if parent updates the prop
  useEffect(() => {
    setCycle(tradeCycle);
  }, [tradeCycle]);

  const latestAdjustment = cycle.adjustments[0];
  const legs = latestAdjustment?.legs ?? [];

  const statusMap: Record<string, JSX.Element> = {
    NEW: <Clock width={14} className="text-warning" />,
    ACTIVATED: <Clock width={14} className="text-warning" />,
    ADJUSTED: <CheckCircle width={14} className="text-success" />,
    CLOSED: <XCircle width={14} className="text-error" />,
  };

  async function activateTradeCycle() {
    const url = `trade-cycles/activate-trade/${cycle.id}/`;

    alert("Trade Cycle Activated", {
      duration: 2000,
    });

    setCycle((prev) => ({
      ...prev,
      state: "ACTIVATED",
    }));
    try {
      const res = await authFetch(url);
      const data = await res.json();
      console.log("Activated:", data);
    } catch (err) {
      console.error("Activation failed:", err);
    }
  }

  return (
    <div className="card bg-base-100 snap-start shrink-0 w-[85%] sm:w-[60%] md:w-[50%] shadow-md mb-6 flex flex-col">
      <div className="card-body p-4 flex flex-col flex-1">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="card-title text-lg">{cycle.name}</h3>
            <div className="flex gap-2 items-center mt-1">
              <span className="badge badge-outline badge-info gap-1">
                {statusMap[cycle.state] ?? <Clock width={14} />}
                {cycle.state}
              </span>
              <span className="badge badge-outline badge-dash">{cycle.sub_state}</span>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Created: {new Date(cycle.created_at).toLocaleDateString()}
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
              <span className="flex-1 text-gray-600 ml-3 truncate">{leg.instrument}</span>
              <span className="text-gray-500">Qty {leg.quantity}</span>
              <span className="ml-2">₹{leg.price}</span>
              {leg.status === "PENDING" ? (
                <Clock width={14} className="ml-2 text-warning" />
              ) : (
                <CheckCircle width={14} className="ml-2 text-success" />
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
                <ChevronUp width={14} className="mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown width={14} className="mr-1" />
                Show All {legs.length}
              </>
            )}
          </button>
        )}

        {/* Spacer pushes actions down */}
        <div className="flex-1"></div>

        {/* Actions */}
        <div className="card-actions justify-end mt-4">
          {cycle.state !== "NEW" && (
            <Link href={`/hedgium/positions/${cycle.id}`} className="btn btn-outline btn-sm">
              View Positions
            </Link>
          )}

          {cycle.state === "NEW" && (
            <button onClick={activateTradeCycle} className="btn btn-outline btn-sm">
              Activate
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TradeCycleCard;