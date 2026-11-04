"use client";

import { useEffect, useRef, useState } from "react";
import { X, Plus, Minus, Trash2, Pencil, Check } from "lucide-react";
import { authFetch } from "@/utils/api";
import LegForm from "@/components/admin/builder/LegForm";
import { BuilderLegCreate, BuilderLegUpdate } from "@/types/builder";
import useAlert from "@/hooks/useAlert";

export interface AdjustmentLeg {
    leg_index: number;
    action: string;
    instrument: string;
    quantity: number;
    price: number | null;
    order_type: string;
    exchange: string;
    lot_size: number;
    token: string;
}

export interface ManualAdjustmentInitialValues {
    title?: string;
    notes?: string;
    autoTrade?: boolean;
    exchange?: string;
    legs?: AdjustmentLeg[];
    expiry?: string;
    heading?: string;
    requireEntrySpread?: boolean;
}

interface Props {
    strategyId: number;
    initialValues?: ManualAdjustmentInitialValues;
    onClose: () => void;
    onSuccess: () => void;
}

function formatExpiry(dateStr: string): string {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const year = date.getFullYear().toString().slice(-2);
    const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
    const day = date.getDate().toString().padStart(2, "0");
    return `${year} ${month} ${day}`;
}

interface ParsedInstrument {
    symbol: string;
    expiry: string;
    strike: number;
    optionType: "CE" | "PE";
    period: string | null;
}

function formatStrike(strike: number): string {
    if (!Number.isFinite(strike)) return "";
    const text = String(strike);
    if (!text.includes(".")) return text;
    return text.replace(/0+$/, "").replace(/\.$/, "");
}

function decimalPlaces(value: number): number {
    const text = String(value);
    const dot = text.indexOf(".");
    return dot === -1 ? 0 : text.length - dot - 1;
}

function addStrike(strike: number, step: number, direction: 1 | -1): number | null {
    const places = Math.min(6, Math.max(decimalPlaces(strike), decimalPlaces(step)));
    const factor = 10 ** places;
    const next = (Math.round(strike * factor) + direction * Math.round(step * factor)) / factor;
    if (!Number.isFinite(next) || next <= 0) return null;
    return next;
}

function parseInstrument(instrument: string): ParsedInstrument | null {
    const parts = instrument.split(",").map((part) => part.trim());
    if (parts.length !== 4 && parts.length !== 5) return null;
    const [symbol, expiry, strikeText, optionRaw, period] = parts;
    const strike = Number(strikeText);
    const optionType = optionRaw?.toUpperCase();
    if (!symbol || !expiry || !Number.isFinite(strike) || (optionType !== "CE" && optionType !== "PE")) {
        return null;
    }
    return {
        symbol,
        expiry,
        strike,
        optionType,
        period: period ? period.toUpperCase() : null,
    };
}

function buildInstrument(parsed: ParsedInstrument, strike: number, optionType: string): string {
    const core = `${parsed.symbol},${parsed.expiry},${formatStrike(strike)},${optionType}`;
    return parsed.period ? `${core},${parsed.period}` : core;
}

function lotSizeOf(leg: AdjustmentLeg): number {
    return leg.lot_size > 0 ? leg.lot_size : 1;
}

function displayedLots(leg: AdjustmentLeg): number {
    const lots = leg.quantity / lotSizeOf(leg);
    return Number.isInteger(lots) ? lots : Math.round(lots * 100) / 100;
}

interface QuoteLevel {
    price?: number;
}

interface QuoteRow {
    last_price?: number;
    instrument_token?: number;
    depth?: {
        buy?: QuoteLevel[];
        sell?: QuoteLevel[];
    };
}

function positivePrice(value: unknown): number | null {
    const price = Number(value);
    return Number.isFinite(price) && price > 0 ? price : null;
}

/** BUY joins the bid, SELL joins the offer. Falls back to last price. */
function limitPriceFromQuote(quote: QuoteRow | null, action: string): number | null {
    if (!quote) return null;
    const levels = action === "SELL" ? quote.depth?.sell : quote.depth?.buy;
    return positivePrice(levels?.[0]?.price) ?? positivePrice(quote.last_price);
}

async function quoteForToken(token: string): Promise<QuoteRow | null> {
    const res = await authFetch("market/quotes/", {}, { instruments: token });
    if (!res.ok) return null;
    const body = await res.json();
    const data = body?.data as Record<string, QuoteRow | undefined> | undefined;
    if (!data) return null;
    if (data[token]) return data[token] ?? null;
    const tokenNum = Number(token);
    if (!Number.isFinite(tokenNum)) return null;
    if (data[String(tokenNum)]) return data[String(tokenNum)] ?? null;
    return (
        Object.values(data).find((row) => row != null && Number(row.instrument_token) === tokenNum) ??
        null
    );
}

export default function ManualAdjustmentModal({
    strategyId,
    initialValues,
    onClose,
    onSuccess,
}: Props) {
    const heading =
        initialValues?.heading ??
        ((initialValues?.legs?.length ?? 0) > 0 ? "Duplicate Adjustment" : "Add Manual Adjustment");
    const [title, setTitle] = useState(initialValues?.title ?? "");
    const [notes, setNotes] = useState(initialValues?.notes ?? "");
    const [autoTrade, setAutoTrade] = useState(initialValues?.autoTrade ?? false);
    const [requireEntrySpread, setRequireEntrySpread] = useState(
        initialValues?.requireEntrySpread === true
    );
    const [exchange, setExchange] = useState(initialValues?.exchange ?? "NFO");
    const [legs, setLegs] = useState<AdjustmentLeg[]>(initialValues?.legs ?? []);
    const [addingLeg, setAddingLeg] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [draft, setDraft] = useState<AdjustmentLeg | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [strikeSteps, setStrikeSteps] = useState<Record<string, number | null>>({});
    const [resolving, setResolving] = useState<Record<number, boolean>>({});
    const strikeStepRequested = useRef<Set<string>>(new Set());
    const resolvingRef = useRef<Set<number>>(new Set());
    const mountedRef = useRef(true);
    const alert = useAlert();
    const formOpen = addingLeg || editingIndex !== null;

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        const symbols = new Set<string>();
        for (const leg of legs) {
            const parsed = parseInstrument(leg.instrument);
            if (parsed) symbols.add(parsed.symbol);
        }
        for (const symbol of symbols) {
            if (strikeStepRequested.current.has(symbol)) continue;
            strikeStepRequested.current.add(symbol);
            void (async () => {
                let step: number | null = null;
                try {
                    const res = await authFetch(`market/get/${encodeURIComponent(symbol)}`);
                    if (res.ok) {
                        const data = await res.json();
                        const parsedStep = Number(data.strike_step);
                        if (Number.isFinite(parsedStep) && parsedStep > 0) step = parsedStep;
                    }
                } catch {
                    step = null;
                }
                if (mountedRef.current) {
                    setStrikeSteps((prev) => ({ ...prev, [symbol]: step }));
                }
            })();
        }
    }, [legs]);

    function handleLegAdd(data: BuilderLegCreate | BuilderLegUpdate) {
        const d = data as BuilderLegCreate;
        const expiryStr = d.expiry ? formatExpiry(d.expiry) : "";
        const instrument = `${d.symbol},${expiryStr},${d.strike},${d.option_type}`;
        const legExchange = d.exchange || exchange;
        const hasPrice = d.price !== null && d.price !== undefined && d.price !== 0;

        const leg: AdjustmentLeg = {
            leg_index: legs.length + 1,
            action: d.action,
            instrument,
            quantity: d.quantity,
            price: hasPrice ? d.price : null,
            order_type: hasPrice ? "LIMIT" : "MARKET",
            exchange: legExchange,
            lot_size: d.lot_size,
            token: d.token || "",
        };

        setLegs((prev) => [...prev, leg]);
        setAddingLeg(false);
    }

    function startEdit(index: number) {
        setAddingLeg(false);
        setEditingIndex(index);
        setDraft({ ...legs[index] });
    }

    function cancelEdit() {
        setEditingIndex(null);
        setDraft(null);
    }

    function saveEdit() {
        if (editingIndex === null || !draft) return;
        const hasPrice = draft.price !== null && draft.price !== undefined && draft.price !== 0;
        const price = hasPrice ? Number(draft.price) : null;
        if (hasPrice && (!Number.isFinite(price) || (price ?? 0) <= 0)) {
            alert.error("Price must be empty (MARKET) or a positive number.");
            return;
        }
        const parsed = parseInstrument(draft.instrument);
        const instrument = parsed ? draft.instrument : draft.instrument.trim();
        if (!instrument) {
            alert.error("Instrument is required.");
            return;
        }
        setLegs((prev) =>
            prev.map((leg, i) =>
                i === editingIndex
                    ? {
                          ...leg,
                          instrument: parsed ? leg.instrument : instrument,
                          price,
                          order_type: hasPrice ? "LIMIT" : "MARKET",
                          action: draft.action === "SELL" ? "SELL" : "BUY",
                      }
                    : leg
            )
        );
        cancelEdit();
    }

    function setLots(index: number, lots: number) {
        const nextLots = Math.max(1, Math.round(lots));
        setLegs((prev) =>
            prev.map((leg, i) =>
                i === index ? { ...leg, quantity: nextLots * lotSizeOf(leg) } : leg
            )
        );
    }

    async function retargetLeg(index: number, nextStrike: number, nextOption: "CE" | "PE") {
        if (resolvingRef.current.has(index)) return;
        const leg = legs[index];
        if (!leg) return;
        const parsed = parseInstrument(leg.instrument);
        if (!parsed) return;
        if (parsed.strike === nextStrike && parsed.optionType === nextOption) return;

        resolvingRef.current.add(index);
        setResolving((prev) => ({ ...prev, [index]: true }));
        try {
            const exchange = leg.exchange || "NFO";
            const res = await authFetch(
                "market/instruments/validate?security=" +
                    encodeURIComponent(parsed.symbol) +
                    "&date=" +
                    encodeURIComponent(parsed.expiry) +
                    "&strike=" +
                    encodeURIComponent(formatStrike(nextStrike)) +
                    "&option=" +
                    nextOption +
                    "&exchange=" +
                    encodeURIComponent(exchange)
            );
            const data = await res.json();
            if (!res.ok || !data?.exists) {
                alert.error(data?.message || "That contract is not listed.");
                return;
            }
            const apiLot = Number(data.lot_size);
            const lot = Number.isFinite(apiLot) && apiLot > 0 ? apiLot : lotSizeOf(leg);
            const lots = Math.max(1, Math.round(leg.quantity / lotSizeOf(leg)));
            const listedStrike = Number(data.strike);
            const strike = Number.isFinite(listedStrike) ? listedStrike : nextStrike;
            const token =
                data.instrument_token != null && data.instrument_token !== ""
                    ? String(data.instrument_token)
                    : leg.token;
            const action = editingIndex === index && draft ? draft.action : leg.action;
            let quoted: number | null = null;
            try {
                quoted = limitPriceFromQuote(await quoteForToken(token), action);
            } catch {
                // Strike change still stands if the quote is unavailable.
            }
            const price = quoted ?? leg.price;
            const orderType = quoted != null ? "LIMIT" : leg.order_type;
            setLegs((prev) =>
                prev.map((row, i) =>
                    i === index
                        ? {
                              ...row,
                              instrument: buildInstrument(parsed, strike, nextOption),
                              token,
                              lot_size: lot,
                              quantity: lots * lot,
                              price,
                              order_type: orderType,
                          }
                        : row
                )
            );
            if (editingIndex === index && quoted != null) {
                setDraft((current) =>
                    current ? { ...current, price: quoted, order_type: "LIMIT" } : current
                );
            }
        } catch {
            alert.error("Could not validate the contract.");
        } finally {
            resolvingRef.current.delete(index);
            setResolving((prev) => ({ ...prev, [index]: false }));
        }
    }

    function removeLeg(index: number) {
        setLegs((prev) => {
            const updated = prev.filter((_, i) => i !== index);
            return updated.map((l, i) => ({ ...l, leg_index: i + 1 }));
        });
        setEditingIndex((current) => {
            if (current === null) return null;
            if (current === index) {
                setDraft(null);
                return null;
            }
            return current > index ? current - 1 : current;
        });
    }

    async function handleSubmit() {
        if (legs.length === 0) {
            alert.error("Please add at least one leg before submitting.");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                title: title || null,
                notes: notes || null,
                is_active: true,
                auto_trade: autoTrade,
                require_entry_spread: requireEntrySpread,
                legs,
            };

            const res = await authFetch(`strategies/${strategyId}/push-allocate-adjustment/`, {
                method: "POST",
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                alert.error(data?.detail || "Failed to create adjustment");
                return;
            }

            // The API returns a message when an active adjustment already exists
            if (data?.message) {
                alert.error(data.message);
                return;
            }

            alert.success("Manual adjustment created successfully");
            onSuccess();
            onClose();
        } catch {
            alert.error("Error submitting adjustment");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="modal modal-open">
            <div className="modal-box w-11/12 max-w-5xl max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-xl">
                        {heading}
                    </h3>
                    <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
                        <X size={18} />
                    </button>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="form-control">
                        <label className="label"><span className="label-text">Title</span></label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Roll adjustment"
                            className="input input-bordered w-full"
                        />
                    </div>

                    <div className="form-control">
                        <label className="label"><span className="label-text">Exchange</span></label>
                        <select
                            value={exchange}
                            onChange={(e) => { setExchange(e.target.value); setAddingLeg(false); }}
                            className="select select-bordered w-full"
                            disabled={formOpen}
                        >
                            <option value="NFO">NFO</option>
                            <option value="BFO">BFO</option>
                            <option value="MCX">MCX</option>
                            <option value="NCO">NCO</option>
                            <option value="NFO_BFO">NFO + BFO (mixed)</option>
                            <option value="MCX_NCO">MCX + NCO (mixed)</option>
                        </select>
                    </div>

                    <div className="form-control">
                        <label className="label cursor-pointer gap-3 justify-start">
                            <span className="label-text">Auto Trade</span>
                            <input
                                type="checkbox"
                                checked={autoTrade}
                                onChange={(e) => setAutoTrade(e.target.checked)}
                                className="toggle toggle-primary"
                            />
                        </label>
                    </div>

                    <div className="form-control">
                        <label
                            className="label cursor-pointer gap-3 justify-start"
                            title="Wait for the builder entry spread condition before placing each batch"
                        >
                            <span className="label-text">Require entry spread</span>
                            <input
                                type="checkbox"
                                checked={requireEntrySpread}
                                onChange={(e) => setRequireEntrySpread(e.target.checked)}
                                className="toggle toggle-primary"
                            />
                        </label>
                    </div>
                </div>

                <div className="divider my-2" />

                {/* Legs section */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-base">
                            Legs
                            {legs.length > 0 && (
                                <span className="ml-2 badge badge-neutral badge-sm">{legs.length}</span>
                            )}
                        </h4>
                        {!formOpen && (
                            <button
                                className="btn btn-sm btn-outline gap-1"
                                onClick={() => setAddingLeg(true)}
                            >
                                <Plus size={14} /> Add Leg
                            </button>
                        )}
                    </div>

                    {/* Legs table */}
                    {legs.length > 0 && (
                        <div className="overflow-x-auto rounded-lg border border-base-300 mb-4">
                            <table className="table table-sm">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Action</th>
                                        <th>Instrument</th>
                                        <th>Lots</th>
                                        <th>Price</th>
                                        <th>Order</th>
                                        <th>Exch</th>
                                        <th />
                                    </tr>
                                </thead>
                                <tbody>
                                    {legs.map((leg, i) => {
                                        const isEditing = editingIndex === i && draft !== null;
                                        return (
                                        <tr key={i} className={isEditing ? "bg-primary/5" : undefined}>
                                            <td className="font-mono">{leg.leg_index}</td>
                                            <td>
                                                {isEditing ? (
                                                    <select
                                                        className="select select-bordered select-xs w-[5.5rem]"
                                                        value={draft.action}
                                                        onChange={(e) =>
                                                            setDraft({ ...draft, action: e.target.value })
                                                        }
                                                    >
                                                        <option value="BUY">BUY</option>
                                                        <option value="SELL">SELL</option>
                                                    </select>
                                                ) : (
                                                    <span className={`badge badge-sm ${leg.action === "BUY" ? "badge-success" : "badge-error"}`}>
                                                        {leg.action}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="font-mono text-xs">
                                                {(() => {
                                                    const parsed = parseInstrument(leg.instrument);
                                                    if (!parsed) {
                                                        return isEditing ? (
                                                            <input
                                                                className="input input-bordered input-xs w-56 font-mono"
                                                                value={draft.instrument}
                                                                onChange={(e) =>
                                                                    setDraft({ ...draft, instrument: e.target.value })
                                                                }
                                                            />
                                                        ) : (
                                                            leg.instrument
                                                        );
                                                    }
                                                    const step = strikeSteps[parsed.symbol];
                                                    const stepKnown = typeof step === "number";
                                                    const rowBusy = resolving[i] === true;
                                                    const stepTitle = rowBusy
                                                        ? "Checking contract"
                                                        : stepKnown
                                                          ? `Move strike by ${step}`
                                                          : step === null
                                                            ? `No strike step for ${parsed.symbol}`
                                                            : "Loading strike step";
                                                    return (
                                                        <div className="flex min-w-64 flex-col gap-1">
                                                            <span className="text-[10px] text-base-content/60">
                                                                {parsed.symbol}
                                                                {stepKnown ? ` · step ${step}` : step === undefined ? " · step …" : ""}
                                                                {` · ${parsed.expiry}`}
                                                            </span>
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-ghost btn-xs btn-square"
                                                                    aria-label="Decrease strike"
                                                                    title={stepTitle}
                                                                    disabled={!stepKnown || rowBusy || submitting}
                                                                    onClick={() => {
                                                                        if (typeof step !== "number") return;
                                                                        const next = addStrike(parsed.strike, step, -1);
                                                                        if (next != null) void retargetLeg(i, next, parsed.optionType);
                                                                    }}
                                                                >
                                                                    <Minus size={12} />
                                                                </button>
                                                                <span className="min-w-16 text-center tabular-nums">
                                                                    {formatStrike(parsed.strike)} {parsed.optionType}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-ghost btn-xs btn-square"
                                                                    aria-label="Increase strike"
                                                                    title={stepTitle}
                                                                    disabled={!stepKnown || rowBusy || submitting}
                                                                    onClick={() => {
                                                                        if (typeof step !== "number") return;
                                                                        const next = addStrike(parsed.strike, step, 1);
                                                                        if (next != null) void retargetLeg(i, next, parsed.optionType);
                                                                    }}
                                                                >
                                                                    <Plus size={12} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td>
                                                {(() => {
                                                    const lots = displayedLots(leg);
                                                    const lot = lotSizeOf(leg);
                                                    const rowBusy = resolving[i] === true;
                                                    return (
                                                        <div className="flex flex-col gap-0.5">
                                                            <div className="flex items-center gap-0.5">
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-ghost btn-xs btn-square"
                                                                    aria-label="Remove one lot"
                                                                    disabled={lots <= 1 || rowBusy || submitting}
                                                                    onClick={() => setLots(i, lots - 1)}
                                                                >
                                                                    <Minus size={12} />
                                                                </button>
                                                                <input
                                                                    type="number"
                                                                    min={1}
                                                                    step={1}
                                                                    aria-label="Lots"
                                                                    className="input input-bordered input-xs w-14 text-center tabular-nums"
                                                                    value={lots}
                                                                    disabled={rowBusy || submitting}
                                                                    onChange={(e) => {
                                                                        const next = Number(e.target.value);
                                                                        if (!Number.isFinite(next) || next < 1) return;
                                                                        setLots(i, next);
                                                                    }}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-ghost btn-xs btn-square"
                                                                    aria-label="Add one lot"
                                                                    title={`Add ${lot} quantity`}
                                                                    disabled={rowBusy || submitting}
                                                                    onClick={() => setLots(i, lots + 1)}
                                                                >
                                                                    <Plus size={12} />
                                                                </button>
                                                            </div>
                                                            <span className="text-[10px] text-base-content/50 tabular-nums">
                                                                qty {leg.quantity}
                                                            </span>
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td>
                                                {isEditing ? (
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        step="0.05"
                                                        className="input input-bordered input-xs w-24"
                                                        placeholder="MKT"
                                                        value={draft.price ?? ""}
                                                        onChange={(e) =>
                                                            setDraft({
                                                                ...draft,
                                                                price:
                                                                    e.target.value === ""
                                                                        ? null
                                                                        : Number(e.target.value),
                                                            })
                                                        }
                                                    />
                                                ) : (
                                                    leg.price ?? "—"
                                                )}
                                            </td>
                                            <td>
                                                <span className="badge badge-outline badge-xs">
                                                    {isEditing
                                                        ? draft.price
                                                            ? "LIMIT"
                                                            : "MARKET"
                                                        : leg.order_type}
                                                </span>
                                            </td>
                                            <td className="text-xs">{leg.exchange}</td>
                                            <td>
                                                <div className="flex items-center gap-0.5">
                                                    {isEditing ? (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={saveEdit}
                                                                className="btn btn-ghost btn-xs text-success"
                                                                title="Save leg"
                                                            >
                                                                <Check size={12} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={cancelEdit}
                                                                className="btn btn-ghost btn-xs"
                                                                title="Cancel edit"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => startEdit(i)}
                                                            className="btn btn-ghost btn-xs"
                                                            title="Edit leg"
                                                            disabled={formOpen}
                                                        >
                                                            <Pencil size={12} />
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeLeg(i)}
                                                        className="btn btn-ghost btn-xs text-error"
                                                        title="Remove leg"
                                                        disabled={isEditing}
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Inline LegForm */}
                    {addingLeg && (
                        <div className="border border-base-300 rounded-xl p-4 bg-base-200 mb-4">
                            <p className="text-sm font-semibold mb-3 opacity-70">
                                Leg {legs.length + 1}
                            </p>
                            <LegForm
                                builderId={0}
                                exchange={exchange}
                                defaultExpiry={initialValues?.expiry}
                                onSubmit={handleLegAdd}
                                onCancel={() => setAddingLeg(false)}
                            />
                        </div>
                    )}

                    {legs.length === 0 && !addingLeg && (
                        <p className="text-sm opacity-40 text-center py-6">
                            No legs added yet — click &ldquo;Add Leg&rdquo; to start.
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="modal-action mt-4 pt-4 border-t border-base-300">
                    <button onClick={onClose} className="btn btn-ghost" disabled={submitting}>
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || legs.length === 0 || formOpen}
                        className="btn btn-primary"
                    >
                        {submitting
                            ? <span className="loading loading-spinner loading-sm" />
                            : "Submit Adjustment"
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}
