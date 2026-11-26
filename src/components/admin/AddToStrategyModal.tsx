"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { authFetch } from "@/utils/api";
import { formatLakhsIN, formatMoneyIN } from "@/utils/formatNumber";
import useAlert from "@/hooks/useAlert";

type RunningStrategy = {
  id: number;
  name: string;
  margin_required: number;
  underlying_names?: string[];
  last_version?: number | null;
};

export type AddToStrategyTarget = {
  profileId: number;
  clientId: string;
  userEmail: string;
  marginEquity: number | null;
  readyForTrade: boolean;
};

type AddToStrategyModalProps = {
  target: AddToStrategyTarget;
  onClose: () => void;
  onSuccess: (profileId: number) => void;
};

type CreateCyclesResult = {
  tradecycles_created?: number;
  skipped_blocked?: { profile_id?: number; symbol?: string }[];
  skipped_underlying_conflict?: { profile_id?: number; symbol?: string }[];
  message?: string;
  detail?: string;
  status?: string;
};

function formatSkip(
  rows: { profile_id?: number; symbol?: string }[],
  emptyLabel: string
): string {
  return rows
    .map((row) => `HID ${row.profile_id}: ${row.symbol || emptyLabel}`)
    .join("; ");
}

export default function AddToStrategyModal({
  target,
  onClose,
  onSuccess,
}: AddToStrategyModalProps) {
  const alert = useAlert();
  const alertRef = useRef(alert);
  alertRef.current = alert;
  const [strategies, setStrategies] = useState<RunningStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          completed: "false",
          page: "1",
          page_size: "1000",
          order_by: "-created_at",
        });
        const res = await authFetch(`myadmin/strategies/?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load strategies");
        const data = await res.json();
        if (cancelled) return;
        setStrategies(Array.isArray(data.results) ? data.results : []);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          alertRef.current.error("Failed to load running strategies");
          setStrategies([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return strategies;
    return strategies.filter((s) => {
      const underlyings = (s.underlying_names || []).join(" ").toLowerCase();
      return s.name.toLowerCase().includes(q) || underlyings.includes(q) || String(s.id) === q;
    });
  }, [strategies, search]);

  const selected = useMemo(
    () => strategies.find((s) => s.id === selectedId) ?? null,
    [strategies, selectedId]
  );

  const marginShortfall =
    selected != null &&
    target.marginEquity != null &&
    Number(selected.margin_required) > 0 &&
    target.marginEquity <= Number(selected.margin_required);

  const handleSubmit = async () => {
    if (!selectedId) {
      alert.error("Select a strategy");
      return;
    }
    setSubmitting(true);
    try {
      const res = await authFetch(
        `myadmin/create-trade-cycles/${selectedId}/${target.profileId}/`
      );
      const data = (await res.json().catch(() => ({}))) as CreateCyclesResult;
      if (!res.ok) {
        alert.error(data.message || data.detail || "Failed to add profile to strategy");
        return;
      }

      const skippedBlocked = Array.isArray(data.skipped_blocked) ? data.skipped_blocked : [];
      const skippedConflict = Array.isArray(data.skipped_underlying_conflict)
        ? data.skipped_underlying_conflict
        : [];
      const created = Number(data.tradecycles_created || 0);
      const notes: string[] = [];
      if (skippedBlocked.length > 0) {
        notes.push(`Blocked symbols — ${formatSkip(skippedBlocked, "blocked")}`);
      }
      if (skippedConflict.length > 0) {
        notes.push(
          `Already active on underlying — ${formatSkip(skippedConflict, "underlying")}`
        );
      }

      if (created === 0) {
        const detail = notes.length > 0 ? notes.join(". ") : "Already on this strategy or skipped.";
        alert.error(`No trade cycle created. ${detail}`, { duration: 6000 });
        return;
      }

      if (notes.length > 0) {
        alert.success(`Created ${created}. ${notes.join(". ")}`, { duration: 6000 });
      } else {
        alert.success(`Added ${target.clientId} to ${selected?.name || "strategy"}`);
      }
      onSuccess(target.profileId);
      onClose();
    } catch (err) {
      console.error(err);
      alert.error("Failed to add profile to strategy");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal modal-open z-[1100]" role="dialog" aria-modal="true">
      <div className="modal-box w-11/12 max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Add to strategy</h3>
            <p className="mt-1 text-sm text-base-content/65">
              {target.clientId}
              <span className="text-base-content/45"> · {target.userEmail}</span>
            </p>
            <p className="mt-0.5 text-xs text-base-content/55">
              Stored margin{" "}
              {target.marginEquity == null
                ? "—"
                : formatMoneyIN(target.marginEquity, { decimals: 0, minDecimals: 0 })}
              {!target.readyForTrade ? (
                <span className="badge badge-warning badge-xs ml-2">not ready for trade</span>
              ) : null}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-square"
            aria-label="Close"
            onClick={onClose}
            disabled={submitting}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="input input-bordered input-sm mb-3 flex w-full items-center gap-2">
          <Search className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
          <input
            type="search"
            className="min-w-0 grow"
            placeholder="Search running strategies"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search running strategies"
          />
        </label>

        <div className="max-h-[45vh] overflow-y-auto rounded-lg border border-base-300">
          {loading ? (
            <div className="space-y-2 p-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-base-300/40" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-center text-sm text-base-content/55">
              {strategies.length === 0
                ? "No running strategies found."
                : "No strategies match the search."}
            </p>
          ) : (
            <ul className="divide-y divide-base-300">
              {filtered.map((strategy) => {
                const active = selectedId === strategy.id;
                const underlyings = (strategy.underlying_names || []).join(", ");
                return (
                  <li key={strategy.id}>
                    <button
                      type="button"
                      className={`flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors ${
                        active ? "bg-primary/10" : "hover:bg-base-200/70"
                      }`}
                      onClick={() => setSelectedId(strategy.id)}
                    >
                      <input
                        type="radio"
                        className="radio radio-sm mt-1"
                        checked={active}
                        onChange={() => setSelectedId(strategy.id)}
                        aria-label={`Select ${strategy.name}`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{strategy.name}</span>
                        <span className="mt-0.5 block text-xs text-base-content/55">
                          #{strategy.id}
                          {strategy.last_version != null ? ` · v${strategy.last_version}` : ""}
                          {" · "}
                          margin {formatLakhsIN(strategy.margin_required, 1)}
                          {underlyings ? ` · ${underlyings}` : ""}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {marginShortfall ? (
          <p className="mt-3 text-xs text-warning">
            Stored margin is at or below this strategy&apos;s required margin. Cycle may stay locked
            until margin is available.
          </p>
        ) : null}

        <div className="modal-action">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm gap-1.5"
            onClick={() => void handleSubmit()}
            disabled={submitting || loading || selectedId == null}
          >
            {submitting ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <Plus className="h-4 w-4" aria-hidden />
            )}
            Add to strategy
          </button>
        </div>
      </div>
      <button type="button" className="modal-backdrop" aria-label="Close" onClick={onClose} />
    </div>
  );
}
