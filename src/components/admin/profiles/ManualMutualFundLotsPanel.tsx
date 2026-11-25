"use client";

import React, { useCallback, useEffect, useState } from "react";
import AsyncSelect from "react-select/async";
import type { StylesConfig } from "react-select";
import { authFetch } from "@/utils/api";
import { formatMoneyIN } from "@/utils/formatNumber";
import useAlert from "@/hooks/useAlert";
import { Edit2, Plus, Trash2, Upload } from "lucide-react";
import type {
  ManualMutualFundLot,
  MutualFundInstrumentOption,
} from "@/types/mutualFunds";

type SchemeOption = {
  value: number;
  label: string;
  instrument: MutualFundInstrumentOption;
};

const selectStyles: StylesConfig<SchemeOption, false> = {
  control: (base) => ({
    ...base,
    backgroundColor: "var(--color-base-100)",
    borderColor: "var(--color-base-300)",
    minHeight: 40,
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: "var(--color-base-100)",
    zIndex: 60,
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused
      ? "var(--color-base-200)"
      : "var(--color-base-100)",
    color: "var(--color-base-content)",
  }),
  singleValue: (base) => ({
    ...base,
    color: "var(--color-base-content)",
  }),
  input: (base) => ({
    ...base,
    color: "var(--color-base-content)",
  }),
};

function liveApiError(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const payload = data as Record<string, unknown>;
  for (const key of ["message", "error_message", "detail"]) {
    const value = payload[key];
    if (typeof value !== "string") continue;
    const text = value.trim();
    if (text) return text;
  }
  return fallback;
}

function formatNavLabel(instrument: MutualFundInstrumentOption): string {
  if (instrument.last_price == null) return "NAV —";
  const price = formatMoneyIN(Number(instrument.last_price));
  return instrument.last_price_date
    ? `NAV ${price} (${instrument.last_price_date})`
    : `NAV ${price}`;
}

function schemeOptionLabel(instrument: MutualFundInstrumentOption): string {
  return `${instrument.name} (${instrument.tradingsymbol}) · ${formatNavLabel(instrument)}`;
}

export interface ManualMutualFundLotsPanelProps {
  profileId: string;
  onLotsChanged: () => void;
}

export default function ManualMutualFundLotsPanel({
  profileId,
  onLotsChanged,
}: ManualMutualFundLotsPanelProps) {
  const alert = useAlert();
  const [lots, setLots] = useState<ManualMutualFundLot[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [scheme, setScheme] = useState<SchemeOption | null>(null);
  const [purchaseDate, setPurchaseDate] = useState("");
  const [quantity, setQuantity] = useState("");
  const [purchaseNav, setPurchaseNav] = useState("");

  const resetForm = useCallback(() => {
    setEditingId(null);
    setScheme(null);
    setPurchaseDate("");
    setQuantity("");
    setPurchaseNav("");
  }, []);

  const fetchLots = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authFetch(
        `positions/manual-mutual-funds/${profileId}/`
      );
      const data = await response.json();
      if (!response.ok || data.status !== "success") {
        alert.error(liveApiError(data, "Failed to load mutual fund lots"));
        return;
      }
      setLots(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error(error);
      alert.error("Failed to load mutual fund lots");
    } finally {
      setLoading(false);
    }
    // useAlert() returns a new object every render — omit from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  useEffect(() => {
    void fetchLots();
  }, [fetchLots]);

  const loadSchemeOptions = useCallback(
    async (inputValue: string): Promise<SchemeOption[]> => {
      const q = inputValue.trim();
      if (q.length < 2) return [];
      const response = await authFetch(
        `market/mutual-funds/?q=${encodeURIComponent(q)}`
      );
      if (!response.ok) return [];
      const rows: MutualFundInstrumentOption[] = await response.json();
      if (!Array.isArray(rows)) return [];
      return rows.map((row) => ({
        value: row.id,
        label: schemeOptionLabel(row),
        instrument: row,
      }));
    },
    []
  );

  const startEdit = (lot: ManualMutualFundLot) => {
    setEditingId(lot.id);
    const instrument: MutualFundInstrumentOption = {
      id: lot.instrument_id,
      tradingsymbol: lot.tradingsymbol,
      name: lot.scheme_name,
      amc: lot.amc,
      last_price: lot.last_price,
      last_price_date: lot.last_price_date,
    };
    setScheme({
      value: lot.instrument_id,
      label: schemeOptionLabel(instrument),
      instrument,
    });
    setPurchaseDate(lot.purchase_date);
    setQuantity(String(lot.quantity));
    setPurchaseNav(String(lot.purchase_nav));
  };

  const saveLot = async () => {
    if (!scheme) {
      alert.error("Select a mutual fund scheme");
      return;
    }
    if (!purchaseDate || !quantity || !purchaseNav) {
      alert.error("Purchase date, quantity, and purchase NAV are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        instrument_id: scheme.value,
        purchase_date: purchaseDate,
        quantity: Number(quantity),
        purchase_nav: Number(purchaseNav),
      };
      const url =
        editingId == null
          ? `positions/manual-mutual-funds/${profileId}/`
          : `positions/manual-mutual-funds/${profileId}/${editingId}/`;
      const response = await authFetch(url, {
        method: editingId == null ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        alert.error(liveApiError(data, "Failed to save lot"));
        return;
      }
      alert.success(editingId == null ? "Lot added" : "Lot updated");
      resetForm();
      await fetchLots();
      onLotsChanged();
    } catch (error) {
      console.error(error);
      alert.error("Failed to save lot");
    } finally {
      setSaving(false);
    }
  };

  const removeLot = async (lotId: number) => {
    if (!window.confirm("Delete this mutual fund lot?")) return;
    try {
      const response = await authFetch(
        `positions/manual-mutual-funds/${profileId}/${lotId}/`,
        { method: "DELETE" }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        alert.error(liveApiError(data, "Failed to delete lot"));
        return;
      }
      alert.success("Lot deleted");
      if (editingId === lotId) resetForm();
      await fetchLots();
      onLotsChanged();
    } catch (error) {
      console.error(error);
      alert.error("Failed to delete lot");
    }
  };

  const uploadCsv = async (file: File | null) => {
    if (!file) return;
    if (
      !window.confirm(
        "Replace all manual mutual fund lots for this profile with the CSV?"
      )
    ) {
      return;
    }
    const form = new FormData();
    form.append("file", file);
    setSaving(true);
    try {
      const response = await authFetch(
        `positions/manual-mutual-funds/${profileId}/upload-csv/`,
        { method: "POST", body: form }
      );
      const data = await response.json();
      if (!response.ok) {
        alert.error(liveApiError(data, "CSV upload failed"));
        return;
      }
      alert.success(data.message || "Lots replaced from CSV");
      resetForm();
      await fetchLots();
      onLotsChanged();
    } catch (error) {
      console.error(error);
      alert.error("CSV upload failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-base-content/70">
          Search by scheme name or ISIN. Holdings mark at the latest AMFI NAV.
        </p>
        <label className="btn btn-outline btn-sm gap-1">
          <Upload size={14} />
          CSV replace
          <input
            type="file"
            accept=".csv,.txt,text/csv"
            className="hidden"
            disabled={saving}
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              event.target.value = "";
              void uploadCsv(file);
            }}
          />
        </label>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="xl:col-span-2">
          <label className="mb-1 block text-xs uppercase tracking-wide text-base-content/60">
            Scheme
          </label>
          <AsyncSelect<SchemeOption, false>
            cacheOptions
            defaultOptions={false}
            loadOptions={loadSchemeOptions}
            value={scheme}
            onChange={(option) => setScheme(option)}
            placeholder="Search name or ISIN…"
            styles={selectStyles}
            classNamePrefix="react-select"
            isDisabled={saving}
            menuPortalTarget={typeof document !== "undefined" ? document.body : null}
            menuPosition="fixed"
            formatOptionLabel={(option, { context }) => {
              const nav = formatNavLabel(option.instrument);
              if (context === "value") {
                return (
                  <span className="truncate">
                    {option.instrument.name}{" "}
                    <span className="text-base-content/60">
                      ({option.instrument.tradingsymbol}) · {nav}
                    </span>
                  </span>
                );
              }
              return (
                <div className="flex items-start justify-between gap-3 py-0.5">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{option.instrument.name}</div>
                    <div className="truncate text-xs text-base-content/60">
                      {option.instrument.tradingsymbol}
                      {option.instrument.amc ? ` · ${option.instrument.amc}` : ""}
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-xs font-medium tabular-nums">
                    {nav}
                  </div>
                </div>
              );
            }}
          />
          {scheme ? (
            <p className="mt-1 text-xs text-base-content/70">
              {formatNavLabel(scheme.instrument)}
            </p>
          ) : null}
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-base-content/60">
            Purchase date
          </label>
          <input
            type="date"
            className="input input-bordered input-sm w-full"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            disabled={saving}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-base-content/60">
            Quantity
          </label>
          <input
            type="number"
            step="any"
            min="0"
            className="input input-bordered input-sm w-full"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            disabled={saving}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-base-content/60">
            Purchase NAV
          </label>
          <input
            type="number"
            step="any"
            min="0"
            className="input input-bordered input-sm w-full"
            value={purchaseNav}
            onChange={(e) => setPurchaseNav(e.target.value)}
            disabled={saving}
          />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-primary btn-sm gap-1"
          onClick={() => void saveLot()}
          disabled={saving}
        >
          {editingId == null ? <Plus size={14} /> : <Edit2 size={14} />}
          {editingId == null ? "Add lot" : "Update lot"}
        </button>
        {editingId != null && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={resetForm}
            disabled={saving}
          >
            Cancel edit
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-4 text-center">
          <span className="loading loading-spinner loading-md" />
        </div>
      ) : lots.length === 0 ? (
        <p className="py-2 text-sm text-base-content/60">No manual lots yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-zebra table-sm w-full">
            <thead>
              <tr>
                <th>Scheme</th>
                <th>ISIN</th>
                <th>Purchase date</th>
                <th>Qty</th>
                <th>Purchase NAV</th>
                <th>NAV</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {lots.map((lot) => (
                <tr key={lot.id}>
                  <td className="font-medium">{lot.scheme_name}</td>
                  <td className="text-xs">{lot.tradingsymbol}</td>
                  <td>{lot.purchase_date}</td>
                  <td>{lot.quantity}</td>
                  <td>{formatMoneyIN(lot.purchase_nav)}</td>
                  <td>
                    {lot.last_price != null ? formatMoneyIN(lot.last_price) : "—"}
                    {lot.last_price_date ? (
                      <span className="ml-1 text-xs text-base-content/60">
                        ({lot.last_price_date})
                      </span>
                    ) : null}
                  </td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        title="Edit"
                        onClick={() => startEdit(lot)}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs text-red-400"
                        title="Delete"
                        onClick={() => void removeLot(lot.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-2 text-xs text-base-content/60">
        CSV columns: tradingsymbol,purchase_date,quantity,purchase_nav
      </p>
    </div>
  );
}
