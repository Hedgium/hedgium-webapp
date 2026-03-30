"use client";

import React, { JSX, useState, useEffect } from "react";
import {
  Clock,
  CheckCircle,
  XCircle,
  ChevronUp,
  ChevronDown,
  Lock,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { authFetch } from "@/utils/api";
import { formatMoneyIN } from "@/utils/formatNumber";
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

interface TradeCycleInput {
  id: number;
  name: string;
  description: string;
  state: string;
  sub_state: string;
  created_at: string;
  adjustments?: unknown[];
}

interface Props {
  tradeCycle: TradeCycleInput;
  isActive: boolean;
  isSandbox?: boolean;
}

function stateStyles(state: string): { pill: string; icon: JSX.Element } {
  switch (state) {
    case "ADJUSTED":
      return {
        pill: "border-success/30 bg-success/10 text-success",
        icon: <CheckCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />,
      };
    case "CLOSED":
      return {
        pill: "border-error/30 bg-error/10 text-error",
        icon: <XCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />,
      };
    case "LOCKED":
      return {
        pill: "border-base-content/15 bg-base-200/80 text-base-content/50",
        icon: <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />,
      };
    case "NEW":
    case "ACTIVATED":
    case "PENDING":
      return {
        pill: "border-warning/35 bg-warning/10 text-warning",
        icon: <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />,
      };
    default:
      return {
        pill: "border-base-300/80 bg-base-200/50 text-base-content/80",
        icon: <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />,
      };
  }
}

const TradeCycleCard: React.FC<Props> = ({ tradeCycle, isActive, isSandbox }) => {
  const [expanded, setExpanded] = useState(false);
  const alert = useAlert();

  const [cycle, setCycle] = useState<TradeCycleInput>(tradeCycle);

  useEffect(() => {
    setCycle(tradeCycle);
  }, [tradeCycle]);

  const latestAdjustment = (cycle.adjustments ?? [])[0] as { legs?: Leg[] } | undefined;
  const legs: Leg[] = latestAdjustment?.legs ?? [];
  const isLocked = cycle.state === "LOCKED";
  const { pill: statePillClass, icon: stateIcon } = stateStyles(cycle.state);

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
    <article
      className={`group relative flex flex-col overflow-hidden rounded-2xl bg-base-100/80  transition-all duration-200 ${
        isActive ? " hover:border-primary/25" : ""
      } hover:-translate-y-0.5 ${isLocked ? "opacity-[0.92]" : ""}`}
    >


      <div className="flex flex-1 flex-col p-4 md:p-4">
        {/* Header */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 ">
            <h3 className="text-lg font-semibold leading-snug tracking-tight text-base-content md:text-xl">
              {cycle.name}
            </h3>
            {cycle.description ? (
              <p className="line-clamp-2 text-sm leading-relaxed text-base-content/55">{cycle.description}</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statePillClass}`}
              >
                {stateIcon}
                {cycle.state}
              </span>
              {cycle.sub_state ? (
                <span className="inline-flex max-w-full truncate rounded-full border border-base-300/60 bg-base-200/40 px-2.5 py-0.5 text-xs font-medium text-base-content/70">
                  {cycle.sub_state}
                </span>
              ) : null}
            </div>
          </div>
          <div className="shrink-0 text-right text-[11px] tabular-nums text-base-content/45 sm:pt-0.5">
            <div>#{cycle.id}</div>
            <div className="mt-0.5">{new Date(cycle.created_at).toLocaleDateString()}</div>
          </div>
        </div>

        {isLocked && (
          <div className="rounded-xl border border-dashed border-base-300/80 bg-base-200/35 px-4 py-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-base-300/60 bg-base-100/60 shadow-inner">
              <Lock className="h-6 w-6 text-base-content/35" aria-hidden />
            </div>
            <h4 className="text-base font-semibold text-base-content">Strategy locked</h4>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-base-content/65">
              This strategy is not available in your current plan.
            </p>
            <div className="mx-auto mt-5 flex max-w-xs flex-col gap-2">
              <Link href="/hedgium/settings" className="btn btn-primary btn-sm gap-2 rounded-full">
                <ExternalLink className="h-4 w-4" aria-hidden />
                Upgrade account
              </Link>
              <a href="mailto:support@hedgium.com" className="btn btn-ghost btn-sm rounded-full">
                Contact Hedgium
              </a>
            </div>
          </div>
        )}

        {!isLocked && (
          <>
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold tracking-[0.18em] text-base-content/45">
                LEGS
              </span>
              {legs.length > 0 ? (
                <span className="text-xs tabular-nums text-base-content/40">{legs.length} total</span>
              ) : null}
            </div>

            <div className="space-y-2">
              {legs.slice(0, expanded ? legs.length : 4).map((leg) => (
                <div
                  key={leg.id}
                  className="flex flex-col gap-2 rounded-xl border border-base-300/50 bg-base-200/35 px-3 py-2.5 transition-colors group-hover:border-base-300/70 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span
                      className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-bold tracking-wide ${
                        leg.action === "BUY"
                          ? "bg-success/15 text-success"
                          : "bg-error/15 text-error"
                      }`}
                    >
                      {leg.action}
                    </span>
                    <span className="truncate text-sm font-medium text-base-content/85">{leg.instrument}</span>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs tabular-nums text-base-content/60 sm:justify-end">
                    <span>Qty {leg.quantity}</span>
                    <span className="font-medium text-base-content/80">{formatMoneyIN(leg.price)}</span>
                    {leg.status === "PENDING" ? (
                      <Clock className="h-3.5 w-3.5 text-warning" aria-label="Pending" />
                    ) : (
                      <CheckCircle className="h-3.5 w-3.5 text-success" aria-label="Done" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {legs.length > 4 && (
              <button
                type="button"
                className="btn btn-ghost btn-xs mt-3 gap-1 self-start rounded-full px-2 font-medium normal-case text-base-content/70 hover:bg-base-200/80 hover:text-base-content"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5" aria-hidden />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                    Show all {legs.length} legs
                  </>
                )}
              </button>
            )}
          </>
        )}

        <div className="flex-1 min-h-2" />

        {!isLocked && (
          <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-base-300/50 pt-4">
            {cycle.state !== "NEW" && (
              <Link
                href={isSandbox ? "/sandbox/positions" : "/hedgium/positions"}
                className="btn btn-primary btn-sm gap-1.5 rounded-full px-5 shadow-sm shadow-primary/15"
              >
                View positions
                <ArrowRight className="h-3.5 w-3.5 opacity-90" aria-hidden />
              </Link>
            )}

            {cycle.state === "NEW" && !isSandbox && (
              <button
                type="button"
                onClick={activateTradeCycle}
                className="btn btn-outline btn-primary btn-sm rounded-full border-primary/40 px-5"
              >
                Activate
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
};

export default TradeCycleCard;
