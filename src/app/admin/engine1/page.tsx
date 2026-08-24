"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AsyncSelect from "react-select/async";
import type { StylesConfig } from "react-select";
import { Pencil, PieChart, Plus, Save, Trash2, X } from "lucide-react";
import useAlert from "@/hooks/useAlert";
import { authFetch } from "@/utils/api";
import {
  createEngine1AssetClass,
  deleteEngine1AssetClass,
  fetchEngine1Grid,
  fetchEngine1Instruments,
  saveEngine1ClassInstruments,
  saveEngine1Grid,
} from "@/services/engine1";
import {
  ENGINE1_HOLDING_PERIOD_LABELS,
  ENGINE1_HOLDING_PERIODS,
  ENGINE1_RISK_LABELS,
  ENGINE1_RISKS,
  type Engine1AssetClass,
  type Engine1GridCell,
  type Engine1HoldingPeriod,
  type Engine1InstrumentDraft,
  type Engine1Risk,
} from "@/types/engine1";

const PERCENT_TOLERANCE = 0.01;

type SearchOption = {
  label: string;
  value: string;
  exchange: string;
};

type InstrumentSearchResult = {
  tradingsymbol: string;
  name: string;
  exchange: string;
};

const reactSelectStyles: StylesConfig<SearchOption, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: 36,
    backgroundColor: "var(--color-base-100)",
    borderColor: state.isFocused ? "var(--color-primary)" : "var(--color-base-300)",
    boxShadow: state.isFocused ? "0 0 0 1px var(--color-primary)" : "none",
    "&:hover": { borderColor: "var(--color-base-content)" },
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: "var(--color-base-100)",
    border: "1px solid var(--color-base-300)",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "var(--color-primary)"
      : state.isFocused
        ? "var(--color-base-200)"
        : "transparent",
    color: state.isSelected ? "var(--color-primary-content)" : "var(--color-base-content)",
  }),
  singleValue: (base) => ({ ...base, color: "var(--color-base-content)" }),
  input: (base) => ({ ...base, color: "var(--color-base-content)" }),
  placeholder: (base) => ({
    ...base,
    color: "color-mix(in oklch, var(--color-base-content) 45%, transparent)",
  }),
  menuPortal: (base) => ({ ...base, zIndex: 60 }),
};

function cellKey(risk: string, period: string, classId: number): string {
  return `${risk}|${period}|${classId}`;
}

function roundPct(n: number): number {
  return Math.round(n * 100) / 100;
}

export default function AdminEngine1Page() {
  const alert = useAlert();
  const alertRef = useRef(alert);
  alertRef.current = alert;

  const [loading, setLoading] = useState(true);
  const [savingGrid, setSavingGrid] = useState(false);
  const [savingInstruments, setSavingInstruments] = useState(false);
  const [cashReservePct, setCashReservePct] = useState(10);
  const [assetClasses, setAssetClasses] = useState<Engine1AssetClass[]>([]);
  const [percentMap, setPercentMap] = useState<Record<string, string>>({});
  const [riskTab, setRiskTab] = useState<Engine1Risk>("HIGH");
  const [newClassName, setNewClassName] = useState("");
  const [addingClass, setAddingClass] = useState(false);

  const [instrumentClassId, setInstrumentClassId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Engine1InstrumentDraft[]>([]);
  const [addSymbol, setAddSymbol] = useState<SearchOption | null>(null);
  const [addWeight, setAddWeight] = useState("0");
  const [editingSymbolIndex, setEditingSymbolIndex] = useState<number | null>(null);

  const loadGrid = useCallback(async () => {
    setLoading(true);
    try {
      const grid = await fetchEngine1Grid();
      setCashReservePct(grid.cash_reserve_pct);
      setAssetClasses(grid.asset_classes);
      const next: Record<string, string> = {};
      for (const cell of grid.cells) {
        next[cellKey(cell.risk, cell.holding_period, cell.asset_class_id)] = String(cell.percent);
      }
      setPercentMap(next);
      setInstrumentClassId((prev) => {
        if (prev && grid.asset_classes.some((c) => c.id === prev)) return prev;
        return grid.asset_classes[0]?.id ?? null;
      });
      setEditingSymbolIndex(null);
    } catch (e) {
      alertRef.current.error(e instanceof Error ? e.message : "Failed to load Engine 1 config");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadInstruments = useCallback(async (classId: number) => {
    try {
      const rows = await fetchEngine1Instruments(classId);
      setDrafts(
        rows.map((row) => ({
          id: row.id,
          tradingsymbol: row.tradingsymbol,
          exchange: row.exchange,
          weight_in_class: row.weight_in_class,
          is_active: row.is_active,
          sort_order: row.sort_order,
        }))
      );
      setEditingSymbolIndex(null);
    } catch (e) {
      alertRef.current.error(e instanceof Error ? e.message : "Failed to load instruments");
    }
  }, []);

  useEffect(() => {
    loadGrid();
  }, [loadGrid]);

  useEffect(() => {
    if (instrumentClassId != null) {
      loadInstruments(instrumentClassId);
    } else {
      setDrafts([]);
    }
  }, [instrumentClassId, loadInstruments]);

  const columnSums = useMemo(() => {
    const sums: Record<Engine1HoldingPeriod, number> = {
      LT_1Y: 0,
      Y1_2: 0,
      Y3_PLUS: 0,
    };
    for (const period of ENGINE1_HOLDING_PERIODS) {
      sums[period] = assetClasses.reduce((acc, ac) => {
        const raw = percentMap[cellKey(riskTab, period, ac.id)];
        const n = Number(raw);
        return acc + (Number.isFinite(n) ? n : 0);
      }, 0);
    }
    return sums;
  }, [assetClasses, percentMap, riskTab]);

  const instrumentWeightSum = drafts
    .filter((d) => d.is_active)
    .reduce((acc, d) => acc + Number(d.weight_in_class || 0), 0);

  const setCellPercent = (period: Engine1HoldingPeriod, classId: number, value: string) => {
    setPercentMap((prev) => ({
      ...prev,
      [cellKey(riskTab, period, classId)]: value,
    }));
  };

  const handleSaveGrid = async () => {
    const cells: Pick<Engine1GridCell, "risk" | "holding_period" | "asset_class_id" | "percent">[] =
      [];
    for (const risk of ENGINE1_RISKS) {
      for (const period of ENGINE1_HOLDING_PERIODS) {
        for (const ac of assetClasses) {
          const raw = percentMap[cellKey(risk, period, ac.id)];
          const n = Number(raw);
          if (!Number.isFinite(n)) {
            alert.error(`Invalid percent for ${ac.name} / ${ENGINE1_RISK_LABELS[risk]}`);
            return;
          }
          cells.push({
            risk,
            holding_period: period,
            asset_class_id: ac.id,
            percent: roundPct(n),
          });
        }
      }
    }
    setSavingGrid(true);
    try {
      const grid = await saveEngine1Grid(cells);
      setCashReservePct(grid.cash_reserve_pct);
      setAssetClasses(grid.asset_classes);
      const next: Record<string, string> = {};
      for (const cell of grid.cells) {
        next[cellKey(cell.risk, cell.holding_period, cell.asset_class_id)] = String(cell.percent);
      }
      setPercentMap(next);
      alert.success("Allocation grid saved");
    } catch (e) {
      alert.error(e instanceof Error ? e.message : "Failed to save grid");
    } finally {
      setSavingGrid(false);
    }
  };

  const handleAddClass = async () => {
    const name = newClassName.trim();
    if (!name) return;
    setAddingClass(true);
    try {
      await createEngine1AssetClass(name);
      setNewClassName("");
      await loadGrid();
      alert.success("Asset class added — set percents so each column sums to 100%");
    } catch (e) {
      alert.error(e instanceof Error ? e.message : "Failed to add asset class");
    } finally {
      setAddingClass(false);
    }
  };

  const handleDeleteClass = async (item: Engine1AssetClass) => {
    if (!confirm(`Delete asset class "${item.name}" and its instruments?`)) return;
    try {
      await deleteEngine1AssetClass(item.id);
      await loadGrid();
      alert.success("Asset class deleted");
    } catch (e) {
      alert.error(e instanceof Error ? e.message : "Failed to delete asset class");
    }
  };

  const loadSymbolOptions = async (inputValue: string): Promise<SearchOption[]> => {
    if (!inputValue.trim()) return [];
    try {
      const res = await authFetch(
        `market/instruments/search/?instrument_type=EQ&q=${encodeURIComponent(inputValue.trim())}`
      );
      if (!res.ok) return [];
      const data = (await res.json()) as InstrumentSearchResult[];
      return data.map((item) => ({
        label: `${item.tradingsymbol} — ${item.name} (${item.exchange})`,
        value: item.tradingsymbol,
        exchange: item.exchange,
      }));
    } catch {
      return [];
    }
  };

  const handleAddDraftInstrument = () => {
    if (!addSymbol) {
      alert.error("Select an instrument");
      return;
    }
    const weight = Number(addWeight);
    if (!Number.isFinite(weight) || weight < 0) {
      alert.error("Weight must be 0 or greater");
      return;
    }
    if (
      drafts.some(
        (d) =>
          d.tradingsymbol === addSymbol.value &&
          d.exchange === addSymbol.exchange
      )
    ) {
      alert.error("Instrument already in this class");
      return;
    }
    const maxOrder = drafts.reduce((m, d) => Math.max(m, d.sort_order || 0), 0);
    setDrafts((prev) => [
      ...prev,
      {
        tradingsymbol: addSymbol.value,
        exchange: addSymbol.exchange,
        weight_in_class: roundPct(weight),
        is_active: true,
        sort_order: maxOrder + 10,
      },
    ]);
    setAddSymbol(null);
    setAddWeight("0");
  };

  const applySymbolToDraft = (index: number, opt: SearchOption) => {
    if (
      drafts.some(
        (d, i) =>
          i !== index && d.tradingsymbol === opt.value && d.exchange === opt.exchange
      )
    ) {
      alert.error("Instrument already in this class");
      return;
    }
    setDrafts((prev) =>
      prev.map((d, i) =>
        i === index ? { ...d, tradingsymbol: opt.value, exchange: opt.exchange } : d
      )
    );
    setEditingSymbolIndex(null);
  };

  const handleSaveInstruments = async () => {
    if (instrumentClassId == null) return;
    setSavingInstruments(true);
    try {
      const saved = await saveEngine1ClassInstruments(instrumentClassId, drafts);
      setDrafts(
        saved.map((row) => ({
          id: row.id,
          tradingsymbol: row.tradingsymbol,
          exchange: row.exchange,
          weight_in_class: row.weight_in_class,
          is_active: row.is_active,
          sort_order: row.sort_order,
        }))
      );
      setEditingSymbolIndex(null);
      alert.success("Instruments saved");
    } catch (e) {
      alert.error(e instanceof Error ? e.message : "Failed to save instruments");
    } finally {
      setSavingInstruments(false);
    }
  };

  const selectedClass = assetClasses.find((c) => c.id === instrumentClassId) ?? null;

  return (
    <div className="p-6 max-w-7xl mx-auto lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <PieChart className="size-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Engine 1 allocation</h1>
            <p className="text-sm text-base-content/70">
              Asset-class grid by risk and holding period, plus ETF/instrument mix.
              Cash reserve {cashReservePct}% is taken from gross allocation at execute time.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border border-base-300 bg-base-100 p-12 text-center text-base-content/60">
          Loading Engine 1 config...
        </div>
      ) : (
        <div className="space-y-8">
          <section className="rounded-lg border border-base-300 bg-base-100 p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Allocation grid</h2>
              <button
                type="button"
                className="btn btn-primary btn-sm gap-2"
                onClick={handleSaveGrid}
                disabled={savingGrid}
              >
                {savingGrid ? <span className="loading loading-spinner loading-xs" /> : <Save size={14} />}
                Save grid
              </button>
            </div>

            <div role="tablist" className="tabs tabs-boxed tabs-sm mb-4 w-fit">
              {ENGINE1_RISKS.map((risk) => (
                <button
                  key={risk}
                  type="button"
                  role="tab"
                  className={`tab ${riskTab === risk ? "tab-active" : ""}`}
                  onClick={() => setRiskTab(risk)}
                >
                  {ENGINE1_RISK_LABELS[risk]}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr className="bg-base-200">
                    <th>Asset class</th>
                    {ENGINE1_HOLDING_PERIODS.map((period) => (
                      <th key={period} className="text-right">
                        {ENGINE1_HOLDING_PERIOD_LABELS[period]}
                      </th>
                    ))}
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {assetClasses.map((ac) => (
                    <tr key={ac.id}>
                      <td className="font-medium">{ac.name}</td>
                      {ENGINE1_HOLDING_PERIODS.map((period) => (
                        <td key={period}>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            className="input input-bordered input-sm h-8 w-24 text-right ml-auto"
                            value={percentMap[cellKey(riskTab, period, ac.id)] ?? "0"}
                            onChange={(e) => setCellPercent(period, ac.id, e.target.value)}
                            aria-label={`${ac.name} ${ENGINE1_HOLDING_PERIOD_LABELS[period]} percent`}
                          />
                        </td>
                      ))}
                      <td>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs text-error"
                          onClick={() => handleDeleteClass(ac)}
                          title="Delete asset class"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="font-semibold">Total</td>
                    {ENGINE1_HOLDING_PERIODS.map((period) => {
                      const sum = columnSums[period];
                      const ok = Math.abs(sum - 100) <= PERCENT_TOLERANCE;
                      return (
                        <td
                          key={period}
                          className={`text-right font-semibold tabular-nums ${ok ? "" : "text-error"}`}
                        >
                          {roundPct(sum).toFixed(2)}%
                        </td>
                      );
                    })}
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap items-end gap-2">
              <label className="form-control">
                <span className="label-text mb-1 text-sm">New asset class</span>
                <input
                  type="text"
                  className="input input-bordered input-sm h-9 w-56"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="e.g. Crypto"
                />
              </label>
              <button
                type="button"
                className="btn btn-outline btn-sm h-9 gap-1"
                onClick={handleAddClass}
                disabled={addingClass || !newClassName.trim()}
              >
                <Plus size={14} />
                Add class
              </button>
            </div>
          </section>

          <section className="rounded-lg border border-base-300 bg-base-100 p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Instruments</h2>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="select select-bordered select-sm h-9 w-48"
                  value={instrumentClassId ?? ""}
                  onChange={(e) => {
                    setEditingSymbolIndex(null);
                    setInstrumentClassId(Number(e.target.value) || null);
                  }}
                  aria-label="Filter instruments by asset class"
                >
                  {assetClasses.map((ac) => (
                    <option key={ac.id} value={ac.id}>
                      {ac.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-primary btn-sm gap-2"
                  onClick={handleSaveInstruments}
                  disabled={savingInstruments || instrumentClassId == null}
                >
                  {savingInstruments ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <Save size={14} />
                  )}
                  Save instruments
                </button>
              </div>
            </div>

            {selectedClass && (
              <p
                className={`mb-3 text-sm ${
                  Math.abs(instrumentWeightSum - 100) <= PERCENT_TOLERANCE
                    ? "text-base-content/60"
                    : "text-error"
                }`}
              >
                Active weights in {selectedClass.name}: {roundPct(instrumentWeightSum).toFixed(2)}%
                (must equal 100% when the class has a non-zero grid allocation)
              </p>
            )}

            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr className="bg-base-200">
                    <th>Symbol</th>
                    <th>Exchange</th>
                    <th className="text-right">Weight %</th>
                    <th>Active</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {drafts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-base-content/60">
                        No instruments in this class.
                      </td>
                    </tr>
                  ) : (
                    drafts.map((row, index) => (
                      <tr key={`${row.id ?? "new"}-${row.tradingsymbol}-${index}`}>
                        <td className="min-w-56">
                          {editingSymbolIndex === index ? (
                            <div className="flex items-center gap-1">
                              <div className="min-w-0 flex-1">
                                <AsyncSelect<SearchOption, false>
                                  autoFocus
                                  cacheOptions
                                  defaultOptions={false}
                                  loadOptions={loadSymbolOptions}
                                  value={{
                                    label: `${row.tradingsymbol} (${row.exchange})`,
                                    value: row.tradingsymbol,
                                    exchange: row.exchange,
                                  }}
                                  onChange={(opt) => {
                                    if (opt) applySymbolToDraft(index, opt);
                                  }}
                                  placeholder="Search NSE symbol..."
                                  styles={reactSelectStyles}
                                  classNamePrefix="engine1-symbol-edit"
                                  menuPortalTarget={
                                    typeof document !== "undefined" ? document.body : undefined
                                  }
                                  menuPosition="fixed"
                                />
                              </div>
                              <button
                                type="button"
                                className="btn btn-ghost btn-xs"
                                onClick={() => setEditingSymbolIndex(null)}
                                title="Cancel symbol edit"
                                aria-label={`Cancel edit ${row.tradingsymbol}`}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{row.tradingsymbol}</span>
                              <button
                                type="button"
                                className="btn btn-ghost btn-xs"
                                onClick={() => setEditingSymbolIndex(index)}
                                title="Edit symbol"
                                aria-label={`Edit symbol ${row.tradingsymbol}`}
                              >
                                <Pencil size={14} />
                              </button>
                            </div>
                          )}
                        </td>
                        <td>{row.exchange}</td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            className="input input-bordered input-sm h-8 w-24 text-right ml-auto"
                            value={row.weight_in_class}
                            onChange={(e) => {
                              const n = Number(e.target.value);
                              setDrafts((prev) =>
                                prev.map((d, i) =>
                                  i === index
                                    ? { ...d, weight_in_class: Number.isFinite(n) ? n : 0 }
                                    : d
                                )
                              );
                            }}
                            aria-label={`${row.tradingsymbol} weight`}
                          />
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm"
                            checked={row.is_active}
                            onChange={(e) =>
                              setDrafts((prev) =>
                                prev.map((d, i) =>
                                  i === index ? { ...d, is_active: e.target.checked } : d
                                )
                              )
                            }
                            aria-label={`${row.tradingsymbol} active`}
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs text-error"
                            onClick={() => {
                              setDrafts((prev) => prev.filter((_, i) => i !== index));
                              setEditingSymbolIndex((current) => {
                                if (current == null || current === index) return null;
                                return current > index ? current - 1 : current;
                              });
                            }}
                            title="Remove from class"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 grid grid-cols-1 items-end gap-2 sm:grid-cols-[1fr_8rem_auto]">
              <label className="form-control">
                <span className="label-text mb-1 text-sm">Add instrument</span>
                <AsyncSelect<SearchOption, false>
                  cacheOptions
                  defaultOptions={false}
                  loadOptions={loadSymbolOptions}
                  value={addSymbol}
                  onChange={(opt) => setAddSymbol(opt)}
                  placeholder="Search NSE symbol..."
                  styles={reactSelectStyles}
                  classNamePrefix="engine1-symbol"
                />
              </label>
              <label className="form-control">
                <span className="label-text mb-1 text-sm">Weight %</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className="input input-bordered input-sm h-9"
                  value={addWeight}
                  onChange={(e) => setAddWeight(e.target.value)}
                />
              </label>
              <button
                type="button"
                className="btn btn-outline btn-sm h-9 gap-1"
                onClick={handleAddDraftInstrument}
              >
                <Plus size={14} />
                Add
              </button>
            </div>
            <p className="mt-2 text-xs text-base-content/50">
              Changes are local until you click Save instruments. Reduce other weights so the
              class still sums to 100%.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
