"use client";

import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import useAlert from "@/hooks/useAlert";
import {
  FAR_ADJUSTMENT_ACTIONS,
  NEAR_ADJUSTMENT_ACTIONS,
  proposeStrategyAdjustment,
  type ProposeAdjustmentAction,
  type ProposedAdjustmentLeg,
} from "@/services/adjustments";
import type { ManualAdjustmentInitialValues } from "@/components/admin/strategy/ManualAdjustmentModal";

function mapProposedLegs(legs: ProposedAdjustmentLeg[]): NonNullable<
  ManualAdjustmentInitialValues["legs"]
> {
  return legs.map((leg, i) => ({
    leg_index: leg.leg_index || i + 1,
    action: leg.action,
    instrument: leg.instrument,
    quantity: leg.quantity,
    price: leg.price ?? null,
    order_type: leg.order_type || (leg.price ? "LIMIT" : "MARKET"),
    exchange: leg.exchange || "NFO",
    lot_size: leg.lot_size || 75,
    token: leg.token != null && leg.token !== "" ? String(leg.token) : "",
  }));
}

export default function AdjustmentTriggerMenu({
  strategyId,
  onManual,
  onProposed,
}: {
  strategyId: number;
  onManual: () => void;
  onProposed: (values: ManualAdjustmentInitialValues) => void;
}) {
  const alert = useAlert();
  const [pendingAction, setPendingAction] = useState<ProposeAdjustmentAction | null>(
    null
  );

  async function handleTrigger(action: ProposeAdjustmentAction) {
    if (pendingAction) return;
    setPendingAction(action);
    try {
      const result = await proposeStrategyAdjustment(strategyId, action);
      if (result.ok === false) {
        alert.error(result.message);
        return;
      }
      if (!result.data.legs?.length) {
        alert.error("No legs proposed for this trigger");
        return;
      }
      const legs = mapProposedLegs(result.data.legs);
      onProposed({
        heading: "Add adjustment",
        title: result.data.title ?? "",
        notes: result.data.notes ?? "",
        autoTrade: result.data.auto_trade ?? false,
        exchange: legs[0]?.exchange ?? "NFO",
        legs,
      });
    } catch {
      alert.error("Error proposing adjustment");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="dropdown dropdown-end">
      <button
        type="button"
        tabIndex={0}
        className="btn btn-ghost btn-sm gap-1.5 text-primary hover:bg-primary/10"
        disabled={pendingAction != null}
      >
        {pendingAction ? (
          <span className="loading loading-spinner size-4" />
        ) : (
          <Plus className="size-4" />
        )}
        Adjustment
        <ChevronDown className="size-3.5 opacity-70" />
      </button>
      <div
        tabIndex={0}
        className="dropdown-content z-50 mt-1 w-[32rem] rounded-box border border-base-300/70 bg-base-100 p-2"
      >
        <ul className="menu p-0">
          <li>
            <button type="button" onClick={onManual}>
              Manual adjustment
            </button>
          </li>
        </ul>
        <div className="mt-1 grid grid-cols-2 gap-x-1">
          <ul className="menu p-0">
            <li className="menu-title">
              <span className="w-full text-left">Near leg</span>
            </li>
            {NEAR_ADJUSTMENT_ACTIONS.map((item) => (
              <li key={item.action}>
                <button
                  type="button"
                  disabled={pendingAction != null}
                  onClick={() => void handleTrigger(item.action)}
                >
                  {pendingAction === item.action ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : null}
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
          <ul className="menu p-0">
            <li className="menu-title">
              <span className="w-full text-left">Far leg</span>
            </li>
            {FAR_ADJUSTMENT_ACTIONS.map((item) => (
              <li key={item.action}>
                <button
                  type="button"
                  disabled={pendingAction != null}
                  onClick={() => void handleTrigger(item.action)}
                >
                  {pendingAction === item.action ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : null}
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
