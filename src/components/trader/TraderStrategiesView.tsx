"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Radio, RefreshCw } from "lucide-react";
import useAlert from "@/hooks/useAlert";
import { formatMoneyIN } from "@/utils/formatNumber";
import {
  getTraderLiveMargin,
  getTraderStrategy,
  getTraderStrategyAdjustments,
  getTraderStrategyPositions,
  getTraderStrategySnapshots,
  getTraderStrategyTradeCycles,
  listTraderProfiles,
  listTraderStrategies,
  refreshTraderProfileMargin,
} from "@/services/trader";
import { useTraderStore } from "@/store/traderStore";
import type { TraderProfile, TraderStrategyRow } from "@/types/trader";

const ProfileLiveTradingPanel = dynamic(
  () => import("@/components/admin/profiles/ProfileLiveTradingPanel"),
  { ssr: false, loading: () => null }
);

type DetailTab = "positions" | "cycles" | "snapshots" | "adjustments";

export default function TraderStrategiesView() {
  const alert = useAlert();
  const { defaultProfileId, setDefaultProfileId } = useTraderStore();
  const [rows, setRows] = useState<TraderStrategyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<TraderProfile[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("positions");
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailPayload, setDetailPayload] = useState<unknown>(null);
  const [strategyMeta, setStrategyMeta] = useState<Record<string, unknown> | null>(null);
  const [liveOpen, setLiveOpen] = useState(false);
  const [liveMargin, setLiveMargin] = useState<Record<string, unknown> | null>(null);
  const [marginBusy, setMarginBusy] = useState(false);

  const activeProfile = useMemo(() => {
    if (!profiles.length) return null;
    return (
      profiles.find((p) => p.id === defaultProfileId) ??
      profiles[0] ??
      null
    );
  }, [profiles, defaultProfileId]);

  const loadStrategies = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listTraderStrategies({
        completed: false,
        pageSize: 100,
        orderBy: "-created_at",
      });
      setRows(data.results ?? []);
    } catch (e) {
      alert.error(e instanceof Error ? e.message : "Failed to load strategies");
    } finally {
      setLoading(false);
    }
    // useAlert() is not referentially stable; omit from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProfiles = useCallback(async () => {
    try {
      const list = await listTraderProfiles();
      setProfiles(list);
      const currentDefault = useTraderStore.getState().defaultProfileId;
      if (list.length && currentDefault == null) {
        setDefaultProfileId(list[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  }, [setDefaultProfileId]);

  useEffect(() => {
    void loadStrategies();
    void loadProfiles();
  }, [loadStrategies, loadProfiles]);

  useEffect(() => {
    if (!activeProfile) {
      setLiveMargin(null);
      return;
    }
    let cancelled = false;
    void getTraderLiveMargin(activeProfile.id)
      .then((data) => {
        if (!cancelled) setLiveMargin(data as Record<string, unknown>);
      })
      .catch(() => {
        if (!cancelled) setLiveMargin(null);
      });
    return () => {
      cancelled = true;
    };
  }, [activeProfile]);

  const openDetail = async (id: number) => {
    setSelectedId(id);
    setDetailTab("positions");
    setDetailLoading(true);
    try {
      const [meta, positions] = await Promise.all([
        getTraderStrategy(id),
        getTraderStrategyPositions(id),
      ]);
      setStrategyMeta(meta as Record<string, unknown>);
      setDetailPayload(positions);
    } catch (e) {
      alert.error(e instanceof Error ? e.message : "Failed to load strategy");
      setSelectedId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const switchTab = async (tab: DetailTab) => {
    if (!selectedId) return;
    setDetailTab(tab);
    setDetailLoading(true);
    try {
      if (tab === "positions") {
        setDetailPayload(await getTraderStrategyPositions(selectedId));
      } else if (tab === "cycles") {
        setDetailPayload(await getTraderStrategyTradeCycles(selectedId));
      } else if (tab === "snapshots") {
        setDetailPayload(await getTraderStrategySnapshots(selectedId));
      } else {
        setDetailPayload(await getTraderStrategyAdjustments(selectedId));
      }
    } catch (e) {
      alert.error(e instanceof Error ? e.message : "Failed to load tab");
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshMargin = async () => {
    if (!activeProfile) return;
    setMarginBusy(true);
    try {
      const updated = await refreshTraderProfileMargin(activeProfile.id);
      setProfiles((prev) =>
        prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
      );
      const live = await getTraderLiveMargin(activeProfile.id);
      setLiveMargin(live as Record<string, unknown>);
    } catch (e) {
      alert.error(e instanceof Error ? e.message : "Margin refresh failed");
    } finally {
      setMarginBusy(false);
    }
  };

  const utilised =
    liveMargin && typeof liveMargin.utilised_total === "number"
      ? liveMargin.utilised_total
      : null;
  const available =
    liveMargin && typeof liveMargin.available_total === "number"
      ? liveMargin.available_total
      : activeProfile?.margin_equity ?? null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mx-auto w-full max-w-7xl flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Strategies</h1>
            <p className="mt-0.5 text-sm text-base-content/50">Running book on your desk</p>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-square"
            onClick={() => void loadStrategies()}
            aria-label="Refresh strategies"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <span className="loading loading-spinner loading-md text-primary" />
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-base-300 bg-base-100 p-10 text-center text-base-content/60">
            No running strategies yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-base-300 bg-base-100">
            <table className="table table-sm">
              <thead>
                <tr className="text-xs uppercase text-base-content/50">
                  <th>Strategy</th>
                  <th>PnL</th>
                  <th>WPnL</th>
                  <th>Spread</th>
                  <th>Adj</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="cursor-pointer hover:bg-base-200/60"
                    onClick={() => void openDetail(row.id)}
                  >
                    <td>
                      <div className="font-medium">{row.name}</div>
                      <div className="text-xs text-base-content/50">#{row.id}</div>
                    </td>
                    <td className="tabular-nums">
                      {row.pnl_total != null ? formatMoneyIN(row.pnl_total) : "—"}
                    </td>
                    <td className="tabular-nums">
                      {row.wpnl_total != null ? formatMoneyIN(row.wpnl_total) : "—"}
                    </td>
                    <td className="tabular-nums">
                      {row.atm_spread != null ? Number(row.atm_spread).toFixed(2) : "—"}
                    </td>
                    <td className="tabular-nums">
                      {row.last_version != null ? `v${row.last_version}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-base-300 bg-base-100 px-4 py-3">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-base-content/60">Profile</span>
            <select
              className="select select-bordered select-sm"
              value={activeProfile?.id ?? ""}
              onChange={(e) =>
                setDefaultProfileId(e.target.value ? Number(e.target.value) : null)
              }
            >
              {profiles.length === 0 ? (
                <option value="">No managed profiles</option>
              ) : (
                profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name || p.username} · {p.broker_name || "broker"} #{p.id}
                  </option>
                ))
              )}
            </select>
          </label>
          <div className="text-sm tabular-nums text-base-content/80">
            Avl {available != null ? formatMoneyIN(Number(available)) : "—"}
            {utilised != null ? ` · Used ${formatMoneyIN(Number(utilised))}` : ""}
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={!activeProfile || marginBusy}
            onClick={() => void refreshMargin()}
          >
            {marginBusy ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Margin
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm gap-1.5"
            disabled={!activeProfile}
            onClick={() => setLiveOpen(true)}
          >
            <Radio className="h-3.5 w-3.5" />
            Live
          </button>
        </div>
      </div>

      {selectedId != null && (
        <dialog className="modal modal-open">
          <div className="modal-box flex h-[90vh] max-w-5xl flex-col p-0">
            <div className="flex items-start justify-between gap-3 border-b border-base-300 px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold">
                  {(strategyMeta?.name as string) || `Strategy #${selectedId}`}
                </h3>
                <p className="text-xs text-base-content/50">#{selectedId}</p>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-circle btn-ghost"
                onClick={() => setSelectedId(null)}
              >
                ✕
              </button>
            </div>
            <div className="tabs tabs-bordered px-5 pt-2">
              {(
                [
                  ["positions", "Positions"],
                  ["cycles", "Trade Cycles"],
                  ["snapshots", "Snapshots"],
                  ["adjustments", "Adjustments"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`tab ${detailTab === id ? "tab-active" : ""}`}
                  onClick={() => void switchTab(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {detailLoading ? (
                <div className="flex justify-center py-12">
                  <span className="loading loading-spinner loading-md" />
                </div>
              ) : (
                <pre className="overflow-x-auto rounded-xl bg-base-200 p-4 text-xs">
                  {JSON.stringify(detailPayload, null, 2)}
                </pre>
              )}
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button type="button" onClick={() => setSelectedId(null)}>
              close
            </button>
          </form>
        </dialog>
      )}

      {liveOpen && activeProfile ? (
        <dialog className="modal modal-open">
          <div className="modal-box h-[92vh] max-w-6xl p-0">
            <div className="flex items-center justify-between border-b border-base-300 px-4 py-3">
              <h3 className="font-semibold">Live · Profile #{activeProfile.id}</h3>
              <button
                type="button"
                className="btn btn-sm btn-circle btn-ghost"
                onClick={() => setLiveOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="h-[calc(92vh-3.5rem)] overflow-y-auto p-3">
              <ProfileLiveTradingPanel
                profileId={String(activeProfile.id)}
                variant="embedded"
                apiScope="trader"
              />
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button type="button" onClick={() => setLiveOpen(false)}>
              close
            </button>
          </form>
        </dialog>
      ) : null}
    </div>
  );
}
