"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Copy, Plus, Radio, RefreshCw } from "lucide-react";
import useAlert from "@/hooks/useAlert";
import { formatMoneyIN } from "@/utils/formatNumber";
import {
  attachTraderProfiles,
  createTraderInvite,
  listClientProfilesForAttach,
  listTraderInvites,
  listTraderProfiles,
  listTraderSubscriptions,
  refreshTraderProfileMargin,
} from "@/services/trader";
import { useTraderStore } from "@/store/traderStore";
import type { TraderInvite, TraderProfile, TraderSubscription } from "@/types/trader";

const ProfileLiveTradingPanel = dynamic(
  () => import("@/components/admin/profiles/ProfileLiveTradingPanel"),
  { ssr: false, loading: () => null }
);

export default function TraderProfilesView() {
  const alert = useAlert();
  const { defaultProfileId, setDefaultProfileId } = useTraderStore();
  const [profiles, setProfiles] = useState<TraderProfile[]>([]);
  const [subscriptions, setSubscriptions] = useState<TraderSubscription[]>([]);
  const [invites, setInvites] = useState<TraderInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveProfileId, setLiveProfileId] = useState<number | null>(null);
  const [attachSubId, setAttachSubId] = useState<number | null>(null);
  const [attachOptions, setAttachOptions] = useState<TraderProfile[]>([]);
  const [selectedAttachIds, setSelectedAttachIds] = useState<number[]>([]);
  const [attachBusy, setAttachBusy] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [p, s, i] = await Promise.all([
        listTraderProfiles(),
        listTraderSubscriptions(),
        listTraderInvites(),
      ]);
      setProfiles(p);
      setSubscriptions(s);
      setInvites(i);
      const currentDefault = useTraderStore.getState().defaultProfileId;
      if (p.length && currentDefault == null) {
        setDefaultProfileId(p[0].id);
      }
    } catch (e) {
      alert.error(e instanceof Error ? e.message : "Failed to load profiles");
    } finally {
      setLoading(false);
    }
    // useAlert() is not referentially stable; omit from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setDefaultProfileId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleCreateInvite = async () => {
    try {
      const invite = await createTraderInvite({ max_uses: 0 });
      setInvites((prev) => [invite, ...prev]);
      const url =
        typeof window !== "undefined"
          ? `${window.location.origin}${invite.join_path}`
          : invite.join_path;
      await navigator.clipboard.writeText(url);
      alert.success(`Invite created and copied: ${invite.code}`);
    } catch (e) {
      alert.error(e instanceof Error ? e.message : "Failed to create invite");
    }
  };

  const openAttach = async (sub: TraderSubscription) => {
    setAttachSubId(sub.id);
    setSelectedAttachIds(sub.profiles.map((p) => p.id));
    try {
      const options = await listClientProfilesForAttach(sub.client_id);
      setAttachOptions(options);
    } catch (e) {
      alert.error(e instanceof Error ? e.message : "Failed to load client profiles");
    }
  };

  const saveAttach = async () => {
    if (attachSubId == null) return;
    setAttachBusy(true);
    try {
      await attachTraderProfiles(attachSubId, selectedAttachIds);
      setAttachSubId(null);
      await reload();
      alert.success("Profiles updated");
    } catch (e) {
      alert.error(e instanceof Error ? e.message : "Failed to attach profiles");
    } finally {
      setAttachBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 lg:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Profiles</h1>
          <p className="mt-0.5 text-sm text-base-content/50">
            Managed clients on your desk
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => void reload()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm gap-1.5"
            onClick={() => void handleCreateInvite()}
          >
            <Plus className="h-4 w-4" />
            Create invite
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-md text-primary" />
        </div>
      ) : (
        <>
          <section className="rounded-2xl border border-base-300 bg-base-100 p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-base-content/60">
              Managed profiles
            </h2>
            {profiles.length === 0 ? (
              <p className="text-sm text-base-content/50">
                No profiles yet. Invite a client, then attach their profiles.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr className="text-xs uppercase text-base-content/50">
                      <th>Client</th>
                      <th>Broker</th>
                      <th>Margin</th>
                      <th>Ready</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <div className="font-medium">
                            {p.first_name || p.username}
                          </div>
                          <div className="text-xs text-base-content/50">
                            #{p.id} · {p.username}
                          </div>
                        </td>
                        <td>{p.broker_name || "—"}</td>
                        <td className="tabular-nums">
                          {p.margin_equity != null
                            ? formatMoneyIN(Number(p.margin_equity))
                            : "—"}
                        </td>
                        <td>
                          {p.ready_for_trade && !p.strategies_paused ? (
                            <span className="badge badge-success badge-sm">Ready</span>
                          ) : (
                            <span className="badge badge-ghost badge-sm">Paused</span>
                          )}
                        </td>
                        <td className="text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              className={`btn btn-ghost btn-xs ${
                                defaultProfileId === p.id ? "text-primary" : ""
                              }`}
                              onClick={() => setDefaultProfileId(p.id)}
                            >
                              Default
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs"
                              onClick={() =>
                                void refreshTraderProfileMargin(p.id).then((updated) => {
                                  setProfiles((prev) =>
                                    prev.map((row) =>
                                      row.id === updated.id ? { ...row, ...updated } : row
                                    )
                                  );
                                })
                              }
                            >
                              Margin
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary btn-xs gap-1"
                              onClick={() => setLiveProfileId(p.id)}
                            >
                              <Radio className="h-3 w-3" />
                              Live
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-base-300 bg-base-100 p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-base-content/60">
              Subscriptions
            </h2>
            {subscriptions.length === 0 ? (
              <p className="text-sm text-base-content/50">No clients have joined yet.</p>
            ) : (
              <ul className="space-y-2">
                {subscriptions.map((sub) => (
                  <li
                    key={sub.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-base-300 px-3 py-2"
                  >
                    <div>
                      <div className="font-medium">
                        {sub.client_first_name || sub.client_username}
                      </div>
                      <div className="text-xs text-base-content/50">
                        {sub.status} · {sub.profiles.length} profile(s)
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline btn-xs"
                      onClick={() => void openAttach(sub)}
                    >
                      Attach profiles
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-base-300 bg-base-100 p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-base-content/60">
              Invites
            </h2>
            {invites.length === 0 ? (
              <p className="text-sm text-base-content/50">No invites yet.</p>
            ) : (
              <ul className="space-y-2">
                {invites.map((invite) => (
                  <li
                    key={invite.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-base-300 px-3 py-2 text-sm"
                  >
                    <div>
                      <span className="font-mono font-semibold">{invite.code}</span>
                      <span className="ml-2 text-xs text-base-content/50">
                        used {invite.use_count}
                        {invite.max_uses ? ` / ${invite.max_uses}` : ""}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs gap-1"
                      onClick={() => {
                        const url =
                          typeof window !== "undefined"
                            ? `${window.location.origin}${invite.join_path}`
                            : invite.join_path;
                        void navigator.clipboard.writeText(url);
                        alert.success("Invite link copied");
                      }}
                    >
                      <Copy className="h-3 w-3" />
                      Copy link
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {attachSubId != null && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="mb-3 text-lg font-semibold">Attach profiles</h3>
            <div className="space-y-2">
              {attachOptions.map((p) => {
                const checked = selectedAttachIds.includes(p.id);
                return (
                  <label key={p.id} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={checked}
                      onChange={(e) => {
                        setSelectedAttachIds((prev) =>
                          e.target.checked
                            ? [...prev, p.id]
                            : prev.filter((id) => id !== p.id)
                        );
                      }}
                    />
                    <span>
                      #{p.id} {p.broker_name} · {p.first_name || p.username}
                    </span>
                  </label>
                );
              })}
              {attachOptions.length === 0 ? (
                <p className="text-sm text-base-content/50">No active profiles for this client.</p>
              ) : null}
            </div>
            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setAttachSubId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={attachBusy}
                onClick={() => void saveAttach()}
              >
                Save
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button type="button" onClick={() => setAttachSubId(null)}>
              close
            </button>
          </form>
        </dialog>
      )}

      {liveProfileId != null && (
        <dialog className="modal modal-open">
          <div className="modal-box h-[92vh] max-w-6xl p-0">
            <div className="flex items-center justify-between border-b border-base-300 px-4 py-3">
              <h3 className="font-semibold">Live · Profile #{liveProfileId}</h3>
              <button
                type="button"
                className="btn btn-sm btn-circle btn-ghost"
                onClick={() => setLiveProfileId(null)}
              >
                ✕
              </button>
            </div>
            <div className="h-[calc(92vh-3.5rem)] overflow-y-auto p-3">
              <ProfileLiveTradingPanel
                profileId={String(liveProfileId)}
                variant="embedded"
                apiScope="trader"
              />
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button type="button" onClick={() => setLiveProfileId(null)}>
              close
            </button>
          </form>
        </dialog>
      )}
    </div>
  );
}
