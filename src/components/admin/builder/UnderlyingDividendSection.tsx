"use client";

import React, { useEffect, useMemo, useState } from "react";
import { authFetch } from "@/utils/api";
import useAlert from "@/hooks/useAlert";
import type { UnderlyingDividend } from "@/types/market";

interface UnderlyingDividendSectionProps {
    symbols: string[];
}

type RowState = UnderlyingDividend & { saving?: boolean };

export default function UnderlyingDividendSection({ symbols }: UnderlyingDividendSectionProps) {
    const alert = useAlert();
    const uniqueSymbols = useMemo(
        () => [...new Set(symbols.map((s) => s.trim().toUpperCase()).filter(Boolean))].sort(),
        [symbols],
    );

    const [rows, setRows] = useState<RowState[]>([]);
    const [loading, setLoading] = useState(false);

    const symbolsKey = uniqueSymbols.join(",");

    useEffect(() => {
        let cancelled = false;

        async function load() {
            if (!uniqueSymbols.length) {
                setRows([]);
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const res = await authFetch(
                    `market/underlying-dividends/?symbols=${encodeURIComponent(symbolsKey)}`,
                );
                const data = await res.json();
                if (cancelled) return;
                if (!res.ok) {
                    alert.error(data.detail || "Failed to load dividend settings");
                    return;
                }
                const list: UnderlyingDividend[] = data.dividends || [];
                const bySym = Object.fromEntries(list.map((d) => [d.symbol.toUpperCase(), d]));
                setRows(
                    uniqueSymbols.map((sym) => {
                        const d = bySym[sym];
                        return (
                            d || {
                                symbol: sym,
                                dividend_active: false,
                                dividend_amount: null,
                                ex_dividend_date: null,
                            }
                        );
                    }),
                );
            } catch {
                if (!cancelled) {
                    alert.error("Failed to load dividend settings");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        load();
        return () => {
            cancelled = true;
        };
        // alert is intentionally omitted — useAlert() returns a new object each render.
    }, [symbolsKey]);

    const updateRow = (symbol: string, patch: Partial<RowState>) => {
        setRows((prev) =>
            prev.map((r) => (r.symbol === symbol ? { ...r, ...patch } : r)),
        );
    };

    const saveRow = async (row: RowState) => {
        if (row.dividend_active) {
            if (row.dividend_amount == null || row.dividend_amount <= 0) {
                alert.error(`${row.symbol}: dividend amount required when active`);
                return;
            }
            if (!row.ex_dividend_date) {
                alert.error(`${row.symbol}: ex-dividend date required when active`);
                return;
            }
        }

        updateRow(row.symbol, { saving: true });
        try {
            const res = await authFetch(
                `market/underlying-dividends/${encodeURIComponent(row.symbol)}/`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        dividend_active: row.dividend_active,
                        dividend_amount: row.dividend_active ? row.dividend_amount : null,
                        ex_dividend_date: row.dividend_active ? row.ex_dividend_date : null,
                    }),
                },
            );
            const data = await res.json();
            if (!res.ok) {
                alert.error(data.detail || `Failed to save ${row.symbol}`);
                return;
            }
            updateRow(row.symbol, { ...data, saving: false });
            alert.success(`${row.symbol} dividend saved`);
        } catch {
            alert.error(`Failed to save ${row.symbol}`);
            updateRow(row.symbol, { saving: false });
        }
    };

    if (!uniqueSymbols.length) {
        return (
            <p className="text-sm text-base-content/60">
                Add legs with underlying symbols to configure dividends.
            </p>
        );
    }

    return (
        <div className="form-control md:col-span-2">
            <label className="label py-0">
                <span className="label-text text-sm font-medium text-base-content/80">
                    Underlying dividends (Greeks)
                </span>
            </label>
            <p className="text-xs text-base-content/60 mb-2">
                Global per stock — applies to all builders. Options expiring after ex-date use
                forward minus dividend for Greeks.
            </p>
            {loading ? (
                <span className="loading loading-spinner loading-sm" />
            ) : (
                <div className="overflow-x-auto">
                    <table className="table table-sm">
                        <thead>
                            <tr>
                                <th>Symbol</th>
                                <th>Active</th>
                                <th>Amount (₹)</th>
                                <th>Ex-date</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.symbol}>
                                    <td className="font-mono text-sm">{row.symbol}</td>
                                    <td>
                                        <input
                                            type="checkbox"
                                            className="toggle toggle-sm"
                                            checked={row.dividend_active}
                                            onChange={(e) =>
                                                updateRow(row.symbol, {
                                                    dividend_active: e.target.checked,
                                                })
                                            }
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            className="input input-bordered input-sm w-24"
                                            disabled={!row.dividend_active}
                                            value={row.dividend_amount ?? ""}
                                            onChange={(e) =>
                                                updateRow(row.symbol, {
                                                    dividend_amount: e.target.value
                                                        ? Number(e.target.value)
                                                        : null,
                                                })
                                            }
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="date"
                                            className="input input-bordered input-sm"
                                            disabled={!row.dividend_active}
                                            value={row.ex_dividend_date ?? ""}
                                            onChange={(e) =>
                                                updateRow(row.symbol, {
                                                    ex_dividend_date: e.target.value || null,
                                                })
                                            }
                                        />
                                    </td>
                                    <td>
                                        <button
                                            type="button"
                                            className="btn btn-xs btn-primary"
                                            disabled={row.saving}
                                            onClick={() => saveRow(row)}
                                        >
                                            {row.saving ? "…" : "Save"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
