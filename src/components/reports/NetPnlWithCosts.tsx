"use client";

import { Info } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatMoneyIN } from "@/utils/formatNumber";

export function e2NetPnl(
  gross: number | null | undefined,
  charges: number | null | undefined
): number | null {
  if (gross == null || Number.isNaN(gross)) return null;
  const c = charges != null && !Number.isNaN(charges) ? charges : 0;
  return gross - c;
}

function signedClass(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "text-base-content/60";
  if (value > 0) return "text-success";
  if (value < 0) return "text-error";
  return "text-base-content/75";
}

function formatAmount(value: number | null | undefined, compact?: boolean): string {
  if (value == null || Number.isNaN(value)) return "—";
  if (compact) return formatMoneyIN(value, { decimals: 0, minDecimals: 0 });
  return formatMoneyIN(value);
}

const PANEL_W = 176; // w-44
const PANEL_H = 64;
const GAP = 4;

export default function NetPnlWithCosts({
  gross,
  charges,
  compact,
  className,
  dropdownLeft,
  dropdownTop,
}: {
  gross: number | null | undefined;
  charges: number | null | undefined;
  compact?: boolean;
  className?: string;
  dropdownLeft?: boolean;
  /** Prefer opening above the trigger (still clamped to the viewport). */
  dropdownTop?: boolean;
}) {
  const net = e2NetPnl(gross, charges);
  const hasBreakdown = gross != null && !Number.isNaN(gross);
  const chargesValue = charges != null && !Number.isNaN(charges) ? charges : 0;

  const btnRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  const updatePosition = useCallback(() => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let left = dropdownLeft ? r.left - PANEL_W - GAP : r.right + GAP;
    let top = dropdownTop ? r.top - PANEL_H - GAP : r.bottom + GAP;
    left = Math.max(8, Math.min(left, window.innerWidth - PANEL_W - 8));
    top = Math.max(8, Math.min(top, window.innerHeight - PANEL_H - 8));
    setCoords({ top, left });
  }, [dropdownLeft, dropdownTop]);

  const clearCloseTimer = () => {
    if (closeTimer.current != null) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const openPanel = () => {
    clearCloseTimer();
    updatePosition();
    setOpen(true);
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  useEffect(() => {
    if (!open) return;
    const onReposition = () => updatePosition();
    window.addEventListener("scroll", onReposition, true);
    window.addEventListener("resize", onReposition);
    return () => {
      window.removeEventListener("scroll", onReposition, true);
      window.removeEventListener("resize", onReposition);
    };
  }, [open, updatePosition]);

  useEffect(() => () => clearCloseTimer(), []);

  return (
    <span
      className={`inline-flex items-center justify-end gap-0.5 tabular-nums ${signedClass(net)} ${className ?? ""}`}
    >
      {formatAmount(net, compact)}
      {hasBreakdown ? (
        <>
          <button
            ref={btnRef}
            type="button"
            className="inline-flex cursor-pointer text-base-content/45 hover:text-base-content/70"
            aria-label="PnL breakdown: gross and other costs"
            aria-expanded={open}
            onMouseEnter={openPanel}
            onMouseLeave={scheduleClose}
            onFocus={openPanel}
            onBlur={scheduleClose}
          >
            <Info className="h-3 w-3" strokeWidth={2.5} aria-hidden />
          </button>
          {open && coords && typeof document !== "undefined"
            ? createPortal(
                <div
                  role="tooltip"
                  style={{ top: coords.top, left: coords.left }}
                  className="fixed z-[200] w-44 rounded-lg border border-base-300 bg-base-100 p-2 text-left text-xs font-normal text-base-content shadow-md"
                  onMouseEnter={openPanel}
                  onMouseLeave={scheduleClose}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-base-content/55">Gross</span>
                    <span className={`tabular-nums ${signedClass(gross)}`}>
                      {formatAmount(gross)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between gap-3">
                    <span className="text-base-content/55">Other costs</span>
                    <span className="tabular-nums text-base-content/80">
                      {formatAmount(chargesValue)}
                    </span>
                  </div>
                </div>,
                document.body
              )
            : null}
        </>
      ) : null}
    </span>
  );
}
