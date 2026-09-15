"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import useAlert from "@/hooks/useAlert";
import {
  FAR_ADJUSTMENT_ACTIONS,
  NEAR_ADJUSTMENT_ACTIONS,
  fetchStrategyBookExpiries,
  formatBookExpiryDate,
  proposeStrategyAdjustment,
  type BookExpiry,
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

function keepOrDefault(current: string | null, next: string | null, rows: BookExpiry[]): string | null {
  if (current && rows.some((row) => row.expiry === current)) return current;
  return next;
}

function ColumnExpiry({
  label,
  showSelect,
  displayIso,
  value,
  options,
  onChange,
}: {
  label: string;
  showSelect: boolean;
  displayIso: string | null;
  value: string | null;
  options: BookExpiry[];
  onChange: (expiry: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ?? displayIso;

  return (
    <li className="menu-title">
      <span className="flex w-full items-center justify-between gap-2">
        <span>{label}</span>
        {showSelect ? (
          <span className="relative">
            <button
              type="button"
              className="btn btn-ghost btn-xs h-7 min-h-7 gap-1 px-2 font-normal normal-case tracking-normal text-base-content"
              aria-label={`${label} expiry`}
              aria-expanded={open}
              aria-haspopup="listbox"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setOpen((current) => !current)}
            >
              <span className="tabular-nums">
                {selected ? formatBookExpiryDate(selected) : "Expiry"}
              </span>
              <ChevronDown className="size-3 opacity-70" />
            </button>
            {open && (
              <ul
                role="listbox"
                className="absolute right-0 top-full z-[60] mt-0.5 min-w-[8rem] rounded-box border border-base-300 bg-base-100 py-1"
              >
                {options.map((item) => {
                  const isSelected = item.expiry === value;
                  return (
                    <li key={item.expiry} role="option" aria-selected={isSelected}>
                      <button
                        type="button"
                        className={`w-full px-2.5 py-1 text-left text-xs font-normal normal-case tracking-normal tabular-nums ${
                          isSelected ? "bg-primary/15 text-primary" : "hover:bg-base-200"
                        }`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          onChange(item.expiry);
                          setOpen(false);
                        }}
                      >
                        {formatBookExpiryDate(item.expiry)}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </span>
        ) : displayIso ? (
          <span className="font-normal normal-case tracking-normal tabular-nums text-base-content/70">
            {formatBookExpiryDate(displayIso)}
          </span>
        ) : null}
      </span>
    </li>
  );
}

export default function AdjustmentTriggerMenu({
  strategyId,
  onManual,
  onProposed,
}: {
  strategyId: number;
  onManual: (expiry?: string) => void;
  onProposed: (values: ManualAdjustmentInitialValues) => void;
}) {
  const alert = useAlert();
  const [pendingAction, setPendingAction] = useState<ProposeAdjustmentAction | null>(
    null
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [bookExpiries, setBookExpiries] = useState<BookExpiry[]>([]);
  const [nearExpiry, setNearExpiry] = useState<string | null>(null);
  const [farExpiry, setFarExpiry] = useState<string | null>(null);
  const showExpirySelect = bookExpiries.length > 2;
  const nearDate = bookExpiries[0]?.expiry ?? null;
  const farDate = bookExpiries.length
    ? bookExpiries[bookExpiries.length - 1].expiry
    : null;

  useEffect(() => {
    let cancelled = false;
    void fetchStrategyBookExpiries(strategyId).then((rows) => {
      if (cancelled) return;
      const first = rows[0]?.expiry ?? null;
      const last = rows.length ? rows[rows.length - 1].expiry : null;
      setBookExpiries(rows);
      setNearExpiry((current) => keepOrDefault(current, first, rows));
      setFarExpiry((current) => keepOrDefault(current, last, rows));
    });
    return () => {
      cancelled = true;
    };
  }, [strategyId]);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      setMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  function expiryForAction(action: ProposeAdjustmentAction): string | null {
    if (!showExpirySelect) return null;
    return action.startsWith("far_") ? farExpiry : nearExpiry;
  }

  async function handleTrigger(action: ProposeAdjustmentAction) {
    if (pendingAction) return;
    setPendingAction(action);
    const expiry = expiryForAction(action);
    try {
      const result = await proposeStrategyAdjustment(strategyId, action, expiry);
      if (result.ok === false) {
        alert.error(result.message);
        return;
      }
      if (!result.data.legs?.length) {
        alert.error("No legs proposed for this trigger");
        return;
      }
      for (const warning of result.data.meta?.warnings ?? []) {
        alert.warning(warning);
      }
      const legs = mapProposedLegs(result.data.legs);
      setMenuOpen(false);
      onProposed({
        heading: "Add adjustment",
        title: result.data.title ?? "",
        notes: result.data.notes ?? "",
        autoTrade: result.data.auto_trade ?? false,
        exchange: legs[0]?.exchange ?? "NFO",
        expiry: expiry ?? undefined,
        legs,
      });
    } catch {
      alert.error("Error proposing adjustment");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div
      ref={menuRef}
      className={`dropdown dropdown-end ${menuOpen ? "dropdown-open" : ""}`}
    >
      <button
        type="button"
        className="btn btn-ghost btn-sm gap-1.5 text-primary hover:bg-primary/10"
        disabled={pendingAction != null}
        aria-expanded={menuOpen}
        aria-haspopup="true"
        onClick={() => setMenuOpen((open) => !open)}
      >
        {pendingAction ? (
          <span className="loading loading-spinner size-4" />
        ) : (
          <Plus className="size-4" />
        )}
        Adjustment
        <ChevronDown className="size-3.5 opacity-70" />
      </button>
      <div className="dropdown-content z-50 mt-1 w-[34rem] rounded-box border border-base-300/70 bg-base-100 p-2">
        <ul className="menu p-0">
          <li>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onManual();
              }}
            >
              Manual adjustment
            </button>
          </li>
        </ul>
        <div className="mt-1 grid grid-cols-2 gap-x-1">
          <ul className="menu p-0">
            <ColumnExpiry
              label="Near leg"
              showSelect={showExpirySelect}
              displayIso={nearDate}
              value={nearExpiry}
              options={bookExpiries}
              onChange={setNearExpiry}
            />
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
            <ColumnExpiry
              label="Far leg"
              showSelect={showExpirySelect}
              displayIso={farDate}
              value={farExpiry}
              options={bookExpiries}
              onChange={setFarExpiry}
            />
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
