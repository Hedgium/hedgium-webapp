"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AsyncSelect from "react-select/async";
import {
  Check,
  ChevronDown,
  Pencil,
  RefreshCw,
  Trash2,
  Zap,
} from "lucide-react";
import useAlert from "@/hooks/useAlert";
import { authFetch } from "@/utils/api";
import { formatDateOnly } from "@/utils/formatDate";
import {
  activateTraderBuilder,
  checkTraderBuilder,
  createTraderBuilder,
  deleteTraderBuilder,
  listTraderBuilders,
  listTraderTemplates,
  refreshTraderBuilder,
  updateTraderBuilder,
} from "@/services/trader";
import type { BuilderTab, MarketViewOption } from "@/types/trader";
import type { BuilderLeg, StrategyBuilder, StrategyTemplate } from "@/types/builder";

const VIEW_OPTIONS: { id: MarketViewOption; label: string }[] = [
  { id: "BULLISH", label: "Bullish" },
  { id: "BEARISH", label: "Bearish" },
  { id: "NEUTRAL", label: "Neutral" },
  { id: "OTHER", label: "Other" },
  { id: "CUSTOM", label: "Custom" },
];

type UnderlyingOption = {
  label: string;
  value: string;
  token: string;
  lot_size: number;
};

function calculateAtmStrike(currentPrice: number, strikeStep: number): number {
  if (!strikeStep) return 0;
  return Math.round(currentPrice / strikeStep) * strikeStep;
}

function statusTone(status: string): string {
  if (status === "ACTIVE") return "border-success/40 text-success bg-success/10";
  if (status === "CHECKING" || status === "PRECHECK" || status === "SAAS_CHECKING") {
    return "border-warning/40 text-warning bg-warning/10";
  }
  if (status === "INACTIVE" || status === "EXITED") {
    return "border-error/30 text-error bg-error/10";
  }
  return "border-base-300 text-base-content/60 bg-base-200/60";
}

function formatQuote(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return Number(value).toFixed(2);
}

function LegRow({ leg }: { leg: BuilderLeg }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 rounded-lg border border-base-300/80 bg-base-200/40 px-3 py-2.5 sm:grid-cols-3 lg:grid-cols-6">
      <div>
        <p className="text-[10px] uppercase tracking-wide text-base-content/45">Leg</p>
        <p className="text-sm font-medium tabular-nums">{leg.leg_index}</p>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wide text-base-content/45">Symbol</p>
        <p className="truncate text-sm font-medium">{leg.symbol}</p>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wide text-base-content/45">Side</p>
        <p className="text-sm">
          <span
            className={`rounded px-1.5 py-0.5 text-xs font-medium ${
              leg.action === "BUY"
                ? "bg-primary/15 text-primary"
                : "bg-warning/15 text-warning"
            }`}
          >
            {leg.action}
          </span>{" "}
          <span
            className={`rounded px-1.5 py-0.5 text-xs font-medium ${
              leg.option_type === "CE"
                ? "bg-success/15 text-success"
                : "bg-error/15 text-error"
            }`}
          >
            {leg.option_type}
          </span>
        </p>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wide text-base-content/45">Strike</p>
        <p className="text-sm font-medium tabular-nums">{leg.strike}</p>
        <p className="text-[10px] text-base-content/45">
          {leg.strike_type} · {leg.strike_distance > 0 ? `+${leg.strike_distance}` : leg.strike_distance}
        </p>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wide text-base-content/45">Expiry</p>
        <p className="text-sm tabular-nums">{formatDateOnly(leg.expiry)}</p>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wide text-base-content/45">Bid / Ask</p>
        <p className="text-sm tabular-nums">
          {formatQuote(leg.bid)} / {formatQuote(leg.ask)}
        </p>
      </div>
    </div>
  );
}

function BuilderCard({
  builder,
  onRefresh,
  onEdit,
  onDelete,
}: {
  builder: StrategyBuilder;
  onRefresh: (id: number) => Promise<void>;
  onEdit: (builder: StrategyBuilder) => void;
  onDelete: (id: number) => Promise<void>;
}) {
  const [legsOpen, setLegsOpen] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const legs = useMemo(
    () => [...(builder.builder_legs ?? [])].sort((a, b) => a.leg_index - b.leg_index),
    [builder.builder_legs]
  );

  return (
    <article className="overflow-hidden rounded-2xl border border-base-300/80 bg-base-100/90 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-base-300/70 px-4 py-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold tracking-tight">{builder.name}</h3>
            <span className="font-mono text-xs text-base-content/40">#{builder.id}</span>
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusTone(
                builder.status
              )}`}
            >
              {builder.status}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-base-content/55">
            <span>{builder.exchange}</span>
            <span className="tabular-nums">Entry {builder.entry_ws}%</span>
            <span className="tabular-nums">Exit {builder.exit_ws}%</span>
            <span className="tabular-nums">
              Calc{" "}
              {builder.calculated_ws != null
                ? `${Number(builder.calculated_ws).toFixed(2)}%`
                : "—"}
            </span>
            <span className="tabular-nums">
              Margin {Number(builder.margin_required || 0).toLocaleString("en-IN")}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={`btn btn-ghost btn-xs btn-square ${refreshing ? "animate-spin" : ""}`}
            title="Refresh"
            onClick={() => {
              setRefreshing(true);
              void onRefresh(builder.id).finally(() => setRefreshing(false));
            }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-xs btn-square"
            title="Edit"
            onClick={() => onEdit(builder)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-xs btn-square text-error"
            title="Delete"
            disabled={deleting}
            onClick={() => {
              if (!confirm(`Delete builder "${builder.name}"?`)) return;
              setDeleting(true);
              void onDelete(builder.id).finally(() => setDeleting(false));
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="px-4 py-3">
        <button
          type="button"
          className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-base-content/50"
          onClick={() => setLegsOpen((v) => !v)}
        >
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${legsOpen ? "rotate-180" : ""}`}
          />
          Legs ({legs.length})
        </button>
        {legsOpen ? (
          legs.length ? (
            <div className="space-y-1.5">
              {legs.map((leg, i) => (
                <LegRow key={leg.id ?? `leg-${builder.id}-${i}`} leg={leg} />
              ))}
            </div>
          ) : (
            <p className="rounded-lg bg-base-200/50 py-4 text-center text-xs italic text-base-content/45">
              No legs configured
            </p>
          )
        ) : null}
      </div>
    </article>
  );
}

export default function TraderBuilderView() {
  const alert = useAlert();
  const [tab, setTab] = useState<BuilderTab>("create");
  const [builders, setBuilders] = useState<StrategyBuilder[]>([]);
  const [loading, setLoading] = useState(false);
  const [marketView, setMarketView] = useState<MarketViewOption>("BULLISH");
  const [templates, setTemplates] = useState<StrategyTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [underlying, setUnderlying] = useState<UnderlyingOption | null>(null);
  const [strikeStep, setStrikeStep] = useState(50);
  const [atmStrike, setAtmStrike] = useState<number | null>(null);
  const [lots, setLots] = useState(1);
  const [marginRequired, setMarginRequired] = useState(100000);
  const [entryWs, setEntryWs] = useState(-10);
  const [exitWs, setExitWs] = useState(10);
  const [busy, setBusy] = useState<"check" | "activate" | null>(null);
  const [createdBuilder, setCreatedBuilder] = useState<StrategyBuilder | null>(null);
  const [editing, setEditing] = useState<StrategyBuilder | null>(null);
  const [editBusy, setEditBusy] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    entry_ws: 0,
    exit_ws: 0,
    margin_required: 0,
    status: "PRECHECK",
  });

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId) ?? null,
    [templates, selectedTemplateId]
  );

  const loadList = useCallback(async () => {
    if (tab === "create") return;
    setLoading(true);
    try {
      const data = await listTraderBuilders({ tab, pageSize: 50 });
      setBuilders(data.results ?? []);
    } catch (e) {
      alert.error(e instanceof Error ? e.message : "Failed to load builders");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    let cancelled = false;
    async function loadTemplates() {
      if (marketView === "CUSTOM") {
        setTemplates([]);
        setSelectedTemplateId(null);
        return;
      }
      try {
        const rows = await listTraderTemplates(marketView);
        if (cancelled) return;
        setTemplates(rows);
        setSelectedTemplateId(rows[0]?.id ?? null);
        if (rows[0]?.minimum_capital) setMarginRequired(rows[0].minimum_capital);
      } catch (e) {
        if (!cancelled) {
          alert.error(e instanceof Error ? e.message : "Failed to load templates");
        }
      }
    }
    void loadTemplates();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketView]);

  const loadUnderlyingOptions = async (inputValue: string) => {
    if (!inputValue) return [];
    try {
      const response = await authFetch(
        `market/instruments/search/?instrument_type=EQ&q=${encodeURIComponent(inputValue)}`
      );
      if (!response.ok) return [];
      const data = await response.json();
      return (Array.isArray(data) ? data : []).map(
        (item: {
          tradingsymbol: string;
          name: string;
          exchange: string;
          instrument_token: number;
          lot_size: number;
        }) => ({
          label: `${item.tradingsymbol} - ${item.name} - ${item.exchange}`,
          value: item.tradingsymbol,
          token: String(item.instrument_token),
          lot_size: item.lot_size || 1,
        })
      );
    } catch {
      return [];
    }
  };

  const handleUnderlyingChange = async (option: UnderlyingOption | null) => {
    setUnderlying(option);
    setCreatedBuilder(null);
    setAtmStrike(null);
    if (!option) return;

    const symbol = option.value.split(" ")[0] || option.value;
    let step = strikeStep;
    try {
      const stepRes = await authFetch(`market/get/${encodeURIComponent(symbol)}`);
      if (stepRes.ok) {
        const data = await stepRes.json();
        const next = Number(data.strike_step);
        if (Number.isFinite(next) && next > 0) {
          step = next;
          setStrikeStep(next);
        }
      }
    } catch {
      // keep step
    }

    try {
      const quoteRes = await authFetch(
        "market/quotes/",
        {},
        { instruments: option.token }
      );
      if (!quoteRes.ok) return;
      const payload = await quoteRes.json();
      const quote = payload?.data?.[option.token];
      const spot = Number(quote?.last_price ?? quote?.ltp);
      if (Number.isFinite(spot) && spot > 0) {
        setAtmStrike(calculateAtmStrike(spot, step));
      }
    } catch {
      // ignore
    }
  };

  const buildPayload = () => {
    const symbol = underlying?.value?.split(" ")[0] || underlying?.value || "";
    const templateName = selectedTemplate?.name?.trim() || "Custom";
    const name = symbol ? `${templateName} - ${symbol}` : templateName;
    const payload: Record<string, unknown> = {
      name,
      exchange: "NFO",
      status: "PRECHECK",
      entry_ws: entryWs,
      exit_ws: exitWs,
      exit_pnl: 100,
      entry_condition: "LESS",
      margin_required: marginRequired,
      strategy_template_id: selectedTemplateId,
      supergroup_ids: [],
    };
    if (selectedTemplate?.leg_preset_config && underlying) {
      if (atmStrike == null || atmStrike <= 0) {
        throw new Error("ATM strike unavailable — reselect underlying");
      }
      payload.leg_preset = {
        symbol,
        token: underlying.token,
        strike_step: strikeStep,
        lot_size: underlying.lot_size || 1,
        lots,
        atm_strike: atmStrike,
        strike_distance: 0,
      };
    }
    return payload;
  };

  const ensureBuilder = async (): Promise<StrategyBuilder> => {
    if (createdBuilder) return createdBuilder;
    if (marketView !== "CUSTOM" && !selectedTemplateId) {
      throw new Error("Select a template first");
    }
    if (!underlying) throw new Error("Select an underlying first");
    const created = await createTraderBuilder(buildPayload() as never);
    setCreatedBuilder(created);
    return created;
  };

  const handleCheckFirst = async () => {
    setBusy("check");
    try {
      const builder = await ensureBuilder();
      const updated = await checkTraderBuilder(builder.id);
      setCreatedBuilder(updated);
      alert.success("Checking — spread updated");
    } catch (e) {
      alert.error(e instanceof Error ? e.message : "Check failed");
    } finally {
      setBusy(null);
    }
  };

  const handleActivate = async () => {
    setBusy("activate");
    try {
      const builder = await ensureBuilder();
      const updated = await activateTraderBuilder(builder.id);
      setCreatedBuilder(updated);
      alert.success("Builder activated");
      setTab("active");
    } catch (e) {
      alert.error(e instanceof Error ? e.message : "Activate failed");
    } finally {
      setBusy(null);
    }
  };

  const openEdit = (builder: StrategyBuilder) => {
    setEditing(builder);
    setEditForm({
      name: builder.name,
      entry_ws: Number(builder.entry_ws),
      exit_ws: Number(builder.exit_ws),
      margin_required: Number(builder.margin_required),
      status: builder.status,
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    setEditBusy(true);
    try {
      const updated = await updateTraderBuilder(editing.id, {
        name: editForm.name,
        entry_ws: editForm.entry_ws,
        exit_ws: editForm.exit_ws,
        margin_required: editForm.margin_required,
        status: editForm.status,
      });
      setBuilders((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      if (createdBuilder?.id === updated.id) setCreatedBuilder(updated);
      setEditing(null);
      alert.success("Builder updated");
    } catch (e) {
      alert.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setEditBusy(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTraderBuilder(id);
      setBuilders((prev) => prev.filter((b) => b.id !== id));
      if (createdBuilder?.id === id) setCreatedBuilder(null);
      alert.success("Builder deleted");
    } catch (e) {
      alert.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const handleRefresh = async (id: number) => {
    const updated = await refreshTraderBuilder(id);
    setBuilders((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  };

  const previewLegs = useMemo(() => {
    const legs = [...(createdBuilder?.builder_legs ?? [])];
    legs.sort((a, b) => a.leg_index - b.leg_index);
    return legs;
  }, [createdBuilder]);

  return (
    <div className="mx-auto flex h-full max-w-7xl flex-col gap-5 p-4 lg:p-6">
      <header className="relative z-10 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Builder</h1>
          <p className="mt-0.5 text-sm text-base-content/50">
            Create, check, and run strategies on your desk
          </p>
        </div>
        <div className="relative z-10 inline-flex rounded-xl border border-base-300 bg-base-100 p-1">
          {(
            [
              ["create", "Create"],
              ["active", "Active"],
              ["others", "Others"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`cursor-pointer rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
                tab === id
                  ? "bg-base-300 text-base-content"
                  : "text-base-content/55 hover:bg-base-200/70 hover:text-base-content"
              }`}
              onClick={() => {
                setTab(id);
                if (id === "create") setCreatedBuilder(null);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {tab === "create" ? (
        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
          <section className="space-y-4 rounded-2xl border border-base-300/80 bg-base-100/90 p-4 shadow-sm">
            <div className="flex flex-wrap gap-1.5">
              {VIEW_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`cursor-pointer rounded-full px-3 py-1 text-xs font-semibold tracking-wide transition-colors ${
                    marketView === opt.id
                      ? "bg-primary text-primary-content"
                      : "bg-base-200 text-base-content/65 hover:bg-base-300"
                  }`}
                  onClick={() => {
                    setMarketView(opt.id);
                    setCreatedBuilder(null);
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {marketView !== "CUSTOM" ? (
              <div className="flex w-full flex-col gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-base-content/45">
                  Template
                </span>
                <select
                  className="select select-bordered select-sm w-full"
                  value={selectedTemplateId ?? ""}
                  onChange={(e) => {
                    const id = e.target.value ? Number(e.target.value) : null;
                    setSelectedTemplateId(id);
                    const tmpl = templates.find((t) => t.id === id);
                    if (tmpl?.minimum_capital) setMarginRequired(tmpl.minimum_capital);
                    setCreatedBuilder(null);
                  }}
                >
                  <option value="">Select template…</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="flex w-full flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-base-content/45">
                Underlying
              </span>
              <AsyncSelect
                cacheOptions
                defaultOptions={false}
                loadOptions={loadUnderlyingOptions}
                value={underlying}
                onChange={(opt) => {
                  void handleUnderlyingChange(opt as UnderlyingOption | null);
                }}
                placeholder="Search underlying…"
                classNamePrefix="react-select"
                className="w-full"
                menuPortalTarget={
                  typeof document !== "undefined" ? document.body : null
                }
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: 36,
                    backgroundColor: "var(--fallback-b1,oklch(var(--b1)))",
                    borderColor: "var(--fallback-bc,oklch(var(--bc)/0.2))",
                  }),
                  menuPortal: (base) => ({ ...base, zIndex: 60 }),
                }}
              />
              {atmStrike != null ? (
                <span className="text-xs tabular-nums text-base-content/45">
                  ATM {atmStrike} · step {strikeStep}
                </span>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ["Lots", lots, (v: number) => setLots(Math.max(1, v)), 1],
                  ["Margin", marginRequired, setMarginRequired, 0],
                  ["Entry WS %", entryWs, setEntryWs, undefined],
                  ["Exit WS %", exitWs, setExitWs, undefined],
                ] as const
              ).map(([label, value, setter, min]) => (
                <div key={label} className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-base-content/45">
                    {label}
                  </span>
                  <input
                    type="number"
                    min={min}
                    className="input input-bordered input-sm w-full"
                    value={value}
                    onChange={(e) =>
                      (setter as (n: number) => void)(Number(e.target.value) || 0)
                    }
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                className="btn btn-outline btn-sm gap-1.5"
                disabled={busy != null}
                onClick={() => void handleCheckFirst()}
              >
                {busy === "check" ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <Zap className="h-3.5 w-3.5" />
                )}
                Check first
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm gap-1.5"
                disabled={busy != null}
                onClick={() => void handleActivate()}
              >
                {busy === "activate" ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Activate
              </button>
              {createdBuilder ? (
                <>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() =>
                      void refreshTraderBuilder(createdBuilder.id).then(setCreatedBuilder)
                    }
                  >
                    Refresh
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => openEdit(createdBuilder)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm text-error"
                    onClick={() => {
                      if (!confirm(`Delete builder "${createdBuilder.name}"?`)) return;
                      void handleDelete(createdBuilder.id);
                    }}
                  >
                    Delete
                  </button>
                </>
              ) : null}
            </div>

            {createdBuilder ? (
              <p className="text-xs tabular-nums text-base-content/50">
                #{createdBuilder.id} · {createdBuilder.status}
                {createdBuilder.calculated_ws != null
                  ? ` · spread ${Number(createdBuilder.calculated_ws).toFixed(2)}`
                  : ""}
              </p>
            ) : null}
          </section>

          <section className="min-h-0 overflow-y-auto rounded-2xl border border-base-300/80 bg-base-100/90 p-4 shadow-sm">
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-base-content/45">
              Legs ({previewLegs.length})
            </h2>
            {previewLegs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-base-300 py-12 text-center text-sm text-base-content/45">
                Legs appear after Check first / Activate
              </div>
            ) : (
              <div className="space-y-1.5">
                {previewLegs.map((leg, i) => (
                  <LegRow key={leg.id ?? `preview-${i}`} leg={leg} />
                ))}
              </div>
            )}
          </section>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-md text-primary" />
        </div>
      ) : builders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-base-300 bg-base-100/60 px-6 py-14 text-center text-sm text-base-content/50">
          No builders in this tab.
        </div>
      ) : (
        <div className="space-y-3">
          {builders.map((builder) => (
            <BuilderCard
              key={builder.id}
              builder={builder}
              onRefresh={handleRefresh}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {editing ? (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-md space-y-4">
            <h3 className="text-lg font-semibold">Edit builder #{editing.id}</h3>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-base-content/60">Name</span>
              <input
                className="input input-bordered input-sm w-full"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-base-content/60">Entry WS %</span>
                <input
                  type="number"
                  className="input input-bordered input-sm w-full"
                  value={editForm.entry_ws}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, entry_ws: Number(e.target.value) }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-base-content/60">Exit WS %</span>
                <input
                  type="number"
                  className="input input-bordered input-sm w-full"
                  value={editForm.exit_ws}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, exit_ws: Number(e.target.value) }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-base-content/60">Margin</span>
                <input
                  type="number"
                  className="input input-bordered input-sm w-full"
                  value={editForm.margin_required}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      margin_required: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-base-content/60">Status</span>
                <select
                  className="select select-bordered select-sm w-full"
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, status: e.target.value }))
                  }
                >
                  {[
                    "PRECHECK",
                    "CHECKING",
                    "ACTIVE",
                    "EXIT_CHECKING",
                    "EXIT_STARTED",
                    "EXITED",
                    "INACTIVE",
                  ].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={editBusy}
                onClick={() => void saveEdit()}
              >
                {editBusy ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : null}
                Save
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button type="button" onClick={() => setEditing(null)}>
              close
            </button>
          </form>
        </dialog>
      ) : null}
    </div>
  );
}
