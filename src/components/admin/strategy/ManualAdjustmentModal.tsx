"use client";

import { useState } from "react";
import { X, Plus, Trash2, Pencil, Check } from "lucide-react";
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
    const alert = useAlert();
    const formOpen = addingLeg || editingIndex !== null;

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
        const qty = Number(draft.quantity);
        if (!Number.isFinite(qty) || qty <= 0) {
            alert.error("Quantity must be a positive number.");
            return;
        }
        const hasPrice = draft.price !== null && draft.price !== undefined && draft.price !== 0;
        const price = hasPrice ? Number(draft.price) : null;
        if (hasPrice && (!Number.isFinite(price) || (price ?? 0) <= 0)) {
            alert.error("Price must be empty (MARKET) or a positive number.");
            return;
        }
        const instrument = draft.instrument.trim();
        if (!instrument) {
            alert.error("Instrument is required.");
            return;
        }
        setLegs((prev) =>
            prev.map((leg, i) =>
                i === editingIndex
                    ? {
                          ...draft,
                          instrument,
                          quantity: qty,
                          price,
                          order_type: hasPrice ? "LIMIT" : "MARKET",
                          action: draft.action === "SELL" ? "SELL" : "BUY",
                          leg_index: leg.leg_index,
                      }
                    : leg
            )
        );
        cancelEdit();
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
                            <option value="NFO_BFO">NFO + BFO (mixed)</option>
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
                                        <th>Qty</th>
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
                                                {isEditing ? (
                                                    <input
                                                        className="input input-bordered input-xs w-56 font-mono"
                                                        value={draft.instrument}
                                                        onChange={(e) =>
                                                            setDraft({ ...draft, instrument: e.target.value })
                                                        }
                                                    />
                                                ) : (
                                                    leg.instrument
                                                )}
                                            </td>
                                            <td>
                                                {isEditing ? (
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        className="input input-bordered input-xs w-20"
                                                        value={draft.quantity}
                                                        onChange={(e) =>
                                                            setDraft({
                                                                ...draft,
                                                                quantity: Number(e.target.value),
                                                            })
                                                        }
                                                    />
                                                ) : (
                                                    leg.quantity
                                                )}
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
