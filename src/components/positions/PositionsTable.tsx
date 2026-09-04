"use client";

import React, { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, TrendingUp, TrendingDown, Plus, Minus, LogOut } from "lucide-react";
import { formatMoneyIN } from "@/utils/formatNumber";
import PositionGreeksCell from "@/components/admin/PositionGreeksCell";
import type { PositionGreeksSnapshot } from "@/types/positions";

export interface Position extends PositionGreeksSnapshot {
  id: number;
  instrument: string;
  exchange?: string | null;
  lot_size?: number | null;
  buy_quantity: number;
  average_buy_price: number;
  sell_quantity: number;
  average_sell_price: number;
  quantity: number;
  realised_total: number;
  unrealised_total?: number;
  pnl: number;
  /** Operator or system note (e.g. broker vs trades reconciliation) */
  note?: string | null;
  orders?: Array<{ id: number }>;
  /** Staff-only: OptionChain contract identity. */
  expiry?: string | null;
  strike?: number | string | null;
  option_type?: string | null;
}

export type PositionOrderIntent = "exit" | "increase" | "decrease";

type StrikeSort = "asc" | "desc";

const OTHER_EXPIRY_KEY = "";

interface PositionsTableProps {
  positions: Position[];
  showOrdersCount?: boolean;
  /** Staff-only: show a control to inspect stored trades for this position (admin UI). */
  showAdminTradesAction?: boolean;
  onAdminViewTrades?: (position: Position) => void;
  /** Staff-only: increase / decrease / exit via LIMIT + modify loop (admin UI). */
  showAdminExitAction?: boolean;
  onAdminPositionOrder?: (position: Position, intent: PositionOrderIntent) => void;
  showGreeks?: boolean;
  /** Staff-only: operator/system note (e.g. broker vs trades reconciliation). */
  showNote?: boolean;
  /** Staff-only: section by expiry with a strike sort control. */
  groupByExpiry?: boolean;
  className?: string;
}

function toStrikeNumber(strike: number | string | null | undefined): number | null {
  if (strike == null || strike === "") return null;
  const n = typeof strike === "number" ? strike : Number(strike);
  return Number.isFinite(n) ? n : null;
}

function formatStrike(strike: number | string | null | undefined): string {
  const n = toStrikeNumber(strike);
  if (n == null) return "—";
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function formatExpiryLabel(iso: string): string {
  try {
    return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    });
  } catch {
    return iso;
  }
}

function optionTypeRank(optionType: string | null | undefined): number {
  const u = (optionType || "").toUpperCase();
  if (u === "CE") return 0;
  if (u === "PE") return 1;
  return 2;
}

function compareByStrike(a: Position, b: Position, dir: StrikeSort): number {
  const sa = toStrikeNumber(a.strike);
  const sb = toStrikeNumber(b.strike);
  if (sa == null && sb == null) return 0;
  if (sa == null) return 1;
  if (sb == null) return -1;
  const cmp = sa - sb;
  return dir === "asc" ? cmp : -cmp;
}

function sortGroup(positions: Position[], dir: StrikeSort): Position[] {
  return [...positions].sort((a, b) => {
    const strikeCmp = compareByStrike(a, b, dir);
    if (strikeCmp !== 0) return strikeCmp;
    const typeCmp = optionTypeRank(a.option_type) - optionTypeRank(b.option_type);
    if (typeCmp !== 0) return typeCmp;
    return a.instrument.localeCompare(b.instrument);
  });
}

function groupPositionsByExpiry(
  positions: Position[],
  dir: StrikeSort
): { key: string; expiry: string | null; positions: Position[] }[] {
  const map = new Map<string, Position[]>();
  for (const pos of positions) {
    const key = pos.expiry?.trim() || OTHER_EXPIRY_KEY;
    const list = map.get(key);
    if (list) list.push(pos);
    else map.set(key, [pos]);
  }
  const keys = [...map.keys()].sort((a, b) => {
    if (a === OTHER_EXPIRY_KEY) return 1;
    if (b === OTHER_EXPIRY_KEY) return -1;
    return a.localeCompare(b);
  });
  return keys.map((key) => ({
    key,
    expiry: key === OTHER_EXPIRY_KEY ? null : key,
    positions: sortGroup(map.get(key)!, dir),
  }));
}

function getPnLColor(pnl: number) {
  return pnl >= 0 ? "text-success" : "text-error";
}

function PositionRow({
  pos,
  colSpanFlags,
  onAdminViewTrades,
  onAdminPositionOrder,
}: {
  pos: Position;
  colSpanFlags: {
    showStrike: boolean;
    showGreeks: boolean;
    showNote: boolean;
    showOrdersCount: boolean;
    showActions: boolean;
    showAdminTradesAction: boolean;
    showAdminExitAction: boolean;
  };
  onAdminViewTrades?: (position: Position) => void;
  onAdminPositionOrder?: (position: Position, intent: PositionOrderIntent) => void;
}) {
  const pnlColor = getPnLColor(pos.pnl);
  const unrealisedValue = pos.unrealised_total ?? 0;
  const realisedValue = pos.realised_total ?? 0;

  return (
    <tr className="hover:bg-base-200">
      <td className="font-semibold">{pos.instrument}</td>
      {colSpanFlags.showStrike && (
        <td className="tabular-nums">{formatStrike(pos.strike)}</td>
      )}
      <td>
        {pos.quantity} ({pos.buy_quantity}/{pos.sell_quantity})
      </td>
      <td>
        {pos.average_buy_price ? formatMoneyIN(pos.average_buy_price) : "-"}
      </td>
      <td>
        {pos.average_sell_price ? formatMoneyIN(pos.average_sell_price) : "-"}
      </td>
      <td>{formatMoneyIN(unrealisedValue)}</td>
      <td>{formatMoneyIN(realisedValue)}</td>
      <td className={pnlColor}>
        <div className="flex items-center gap-1 font-semibold">
          {pos.pnl >= 0 ? (
            <TrendingUp width={12} aria-hidden="true" />
          ) : (
            <TrendingDown width={12} aria-hidden="true" />
          )}
          {formatMoneyIN(pos.pnl)}
        </div>
      </td>
      {colSpanFlags.showGreeks && (
        <td>
          <PositionGreeksCell greeks={pos} compact />
        </td>
      )}
      {colSpanFlags.showNote && (
        <td className="max-w-[14rem] truncate text-xs text-base-content/80">
          {pos.note?.trim() ? pos.note.trim() : "—"}
        </td>
      )}
      {colSpanFlags.showOrdersCount && (
        <td className="text-right">{pos.orders?.length ?? 0}</td>
      )}
      {colSpanFlags.showActions && (
        <td className="whitespace-nowrap">
          <div className="flex flex-nowrap items-center gap-1">
            {colSpanFlags.showAdminTradesAction && onAdminViewTrades ? (
              <button
                type="button"
                className="btn btn-xs btn-outline"
                onClick={() => onAdminViewTrades(pos)}
              >
                Trades
              </button>
            ) : null}
            {colSpanFlags.showAdminExitAction &&
            onAdminPositionOrder &&
            pos.quantity !== 0 ? (
              <>
                <button
                  type="button"
                  className="btn btn-xs btn-square btn-outline"
                  title="Increase position"
                  aria-label="Increase position"
                  onClick={() => onAdminPositionOrder(pos, "increase")}
                >
                  <Plus size={14} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="btn btn-xs btn-square btn-outline"
                  title="Decrease position"
                  aria-label="Decrease position"
                  onClick={() => onAdminPositionOrder(pos, "decrease")}
                >
                  <Minus size={14} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="btn btn-xs btn-square btn-outline btn-error"
                  title="Exit position"
                  aria-label="Exit position"
                  onClick={() => onAdminPositionOrder(pos, "exit")}
                >
                  <LogOut size={14} aria-hidden="true" />
                </button>
              </>
            ) : null}
          </div>
        </td>
      )}
    </tr>
  );
}

export default function PositionsTable({
  positions,
  showOrdersCount = false,
  showAdminTradesAction = false,
  onAdminViewTrades,
  showAdminExitAction = false,
  onAdminPositionOrder,
  showGreeks = false,
  showNote = false,
  groupByExpiry = false,
  className = "",
}: PositionsTableProps) {
  const showActions = showAdminTradesAction || showAdminExitAction;
  const [strikeSort, setStrikeSort] = useState<StrikeSort>("asc");
  const [collapsedByExpiry, setCollapsedByExpiry] = useState<Record<string, boolean>>(
    {}
  );

  const grouped = useMemo(
    () => (groupByExpiry ? groupPositionsByExpiry(positions, strikeSort) : null),
    [groupByExpiry, positions, strikeSort]
  );

  const colSpanFlags = {
    showStrike: groupByExpiry,
    showGreeks,
    showNote,
    showOrdersCount,
    showActions,
    showAdminTradesAction,
    showAdminExitAction,
  };

  const columnCount =
    7 +
    (colSpanFlags.showStrike ? 1 : 0) +
    (showGreeks ? 1 : 0) +
    (showNote ? 1 : 0) +
    (showOrdersCount ? 1 : 0) +
    (showActions ? 1 : 0);

  if (positions.length === 0) {
    return (
      <p className="text-sm text-base-content/70 text-center py-3">No positions yet.</p>
    );
  }

  const toggleStrikeSort = () => {
    setStrikeSort((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const toggleExpiryGroup = (key: string) => {
    setCollapsedByExpiry((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const rows = grouped
    ? grouped.flatMap((group) => {
        const groupKey = group.key || "other";
        const collapsed = Boolean(collapsedByExpiry[groupKey]);
        const groupPnl = group.positions.reduce((sum, p) => sum + p.pnl, 0);
        const headerLabel = group.expiry
          ? formatExpiryLabel(group.expiry)
          : "Other";
        const Chevron = collapsed ? ChevronRight : ChevronDown;
        return [
          <tr key={`exp-${groupKey}`} className="bg-base-200/80 hover:bg-base-300/50">
            <th
              scope="colgroup"
              colSpan={columnCount}
              className="py-1.5 text-xs font-semibold normal-case tracking-normal text-base-content/80"
            >
              <button
                type="button"
                className="inline-flex w-full flex-wrap items-center gap-x-2 gap-y-0.5 text-left"
                onClick={() => toggleExpiryGroup(groupKey)}
                aria-expanded={!collapsed}
                aria-label={`${collapsed ? "Expand" : "Collapse"} ${headerLabel} positions`}
              >
                <Chevron className="size-3.5 shrink-0 text-base-content/50" aria-hidden="true" />
                <span>{headerLabel}</span>
                <span className="font-normal text-base-content/50">
                  {group.positions.length}{" "}
                  {group.positions.length === 1 ? "leg" : "legs"}
                </span>
                <span className={`tabular-nums font-medium ${getPnLColor(groupPnl)}`}>
                  {formatMoneyIN(groupPnl)}
                </span>
              </button>
            </th>
          </tr>,
          ...(collapsed
            ? []
            : group.positions.map((pos) => (
                <PositionRow
                  key={pos.id}
                  pos={pos}
                  colSpanFlags={colSpanFlags}
                  onAdminViewTrades={onAdminViewTrades}
                  onAdminPositionOrder={onAdminPositionOrder}
                />
              ))),
        ];
      })
    : positions.map((pos) => (
        <PositionRow
          key={pos.id}
          pos={pos}
          colSpanFlags={colSpanFlags}
          onAdminViewTrades={onAdminViewTrades}
          onAdminPositionOrder={onAdminPositionOrder}
        />
      ));

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="table w-full text-sm">
        <caption className="sr-only">
          {groupByExpiry ? "Open positions grouped by expiry" : "Open positions"}
        </caption>
        <thead>
          <tr className="text-xs text-base-content/80 uppercase">
            <th scope="col">Instrument</th>
            {groupByExpiry && (
              <th scope="col" aria-sort={strikeSort === "asc" ? "ascending" : "descending"}>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 font-semibold uppercase"
                  onClick={toggleStrikeSort}
                  aria-label={`Sort by strike ${strikeSort === "asc" ? "descending" : "ascending"}`}
                  title={
                    strikeSort === "asc"
                      ? "Strike: low to high. Click to reverse."
                      : "Strike: high to low. Click to reverse."
                  }
                >
                  Strike
                  {strikeSort === "asc" ? (
                    <ArrowUp size={12} aria-hidden="true" />
                  ) : (
                    <ArrowDown size={12} aria-hidden="true" />
                  )}
                </button>
              </th>
            )}
            <th scope="col">Qty(B/S)</th>
            <th scope="col">Buy Avg</th>
            <th scope="col">Sell Avg</th>
            <th scope="col">Unrealised</th>
            <th scope="col">Realised</th>
            <th scope="col">PnL</th>
            {showGreeks && <th scope="col">Greeks</th>}
            {showNote && <th scope="col" className="min-w-[8rem] max-w-[14rem]">Note</th>}
            {showOrdersCount && <th scope="col">Orders</th>}
            {showActions && <th scope="col" className="whitespace-nowrap">Actions</th>}
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  );
}
