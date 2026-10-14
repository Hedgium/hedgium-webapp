"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Eye, RefreshCw } from "lucide-react";
import useAlert from "@/hooks/useAlert";
import {
  blockCashPark,
  fetchCashParkCash,
  fetchCashParkRow,
  fetchCashParks,
  sellCashPark,
} from "@/services/engine1";
import type { CashParkRow } from "@/types/engine1";
import { formatMoneyIN } from "@/utils/formatNumber";

const CASH_FETCH_CONCURRENCY = 4;
const BLOCK_POLL_INTERVAL_MS = 2000;
const BLOCK_POLL_MAX_ATTEMPTS = 60;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

const ProfileLiveModal = dynamic(
  () => import("@/components/admin/ProfileLiveModal"),
  { ssr: false }
);

function mergeRow(prev: CashParkRow[], row: CashParkRow): CashParkRow[] {
  const idx = prev.findIndex((r) => r.profile_id === row.profile_id);
  if (idx < 0) return [...prev, row];
  const next = [...prev];
  next[idx] = { ...next[idx], ...row };
  return next;
}

async function mapPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>
): Promise<void> {
  if (items.length === 0) return;
  let next = 0;
  const runners = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (next < items.length) {
        const idx = next;
        next += 1;
        await worker(items[idx]);
      }
    }
  );
  await Promise.all(runners);
}

export default function CashParkPanel() {
  const alert = useAlert();
  const alertRef = useRef(alert);
  alertRef.current = alert;

  const [rows, setRows] = useState<CashParkRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [cashLoading, setCashLoading] = useState<Record<number, boolean>>({});
  const [refreshingAllCash, setRefreshingAllCash] = useState(false);
  const [busy, setBusy] = useState<Record<number, "block" | "sell" | null>>({});
  const [liveModalProfileId, setLiveModalProfileId] = useState<number | null>(null);
  const cashLoadIdRef = useRef(0);
  const mountedRef = useRef(true);

  const fetchCashForRows = useCallback(async (list: CashParkRow[]) => {
    if (list.length === 0) return;
    const cashLoadId = ++cashLoadIdRef.current;
    setRefreshingAllCash(true);
    setCashLoading(Object.fromEntries(list.map((row) => [row.profile_id, true])));

    await mapPool(list, CASH_FETCH_CONCURRENCY, async (row) => {
      if (!mountedRef.current || cashLoadId !== cashLoadIdRef.current) return;
      try {
        const cashRow = await fetchCashParkCash(row.profile_id);
        if (!mountedRef.current || cashLoadId !== cashLoadIdRef.current) return;
        setRows((prev) => mergeRow(prev, cashRow));
      } catch (e) {
        if (mountedRef.current && cashLoadId === cashLoadIdRef.current) {
          alertRef.current.error(
            e instanceof Error
              ? `${row.username}: ${e.message}`
              : `${row.username}: Failed to fetch cash`
          );
        }
      } finally {
        if (mountedRef.current && cashLoadId === cashLoadIdRef.current) {
          setCashLoading((prev) => ({ ...prev, [row.profile_id]: false }));
        }
      }
    });

    if (mountedRef.current && cashLoadId === cashLoadIdRef.current) {
      setRefreshingAllCash(false);
    }
  }, []);

  const refreshOneCash = useCallback(async (row: CashParkRow) => {
    setCashLoading((prev) => ({ ...prev, [row.profile_id]: true }));
    try {
      const cashRow = await fetchCashParkCash(row.profile_id);
      if (!mountedRef.current) return;
      setRows((prev) => mergeRow(prev, cashRow));
    } catch (e) {
      if (mountedRef.current) {
        alertRef.current.error(
          e instanceof Error
            ? `${row.username}: ${e.message}`
            : `${row.username}: Failed to fetch cash`
        );
      }
    } finally {
      if (mountedRef.current) {
        setCashLoading((prev) => ({ ...prev, [row.profile_id]: false }));
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    (async () => {
      setListLoading(true);
      try {
        const list = await fetchCashParks();
        if (cancelled) return;
        setRows(list);
        setListLoading(false);
        // Paint the table first, then start broker cash calls.
        window.setTimeout(() => {
          if (!cancelled) void fetchCashForRows(list);
        }, 0);
      } catch (e) {
        if (!cancelled) {
          alertRef.current.error(
            e instanceof Error ? e.message : "Failed to load cash park list"
          );
          setListLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      mountedRef.current = false;
      cashLoadIdRef.current += 1;
    };
  }, [fetchCashForRows]);

  const pollUntilDone = async (profileId: number, queued: CashParkRow) => {
    let last = queued;
    for (let attempt = 0; attempt < BLOCK_POLL_MAX_ATTEMPTS; attempt += 1) {
      await sleep(BLOCK_POLL_INTERVAL_MS);
      try {
        last = await fetchCashParkRow(profileId);
      } catch {
        continue;
      }
      setRows((prev) => mergeRow(prev, last));
      if (!last.operation_running) break;
    }
    return last;
  };

  const handleBlock = async (profileId: number) => {
    setBusy((prev) => ({ ...prev, [profileId]: "block" }));
    try {
      const queued = await blockCashPark(profileId);
      setRows((prev) => mergeRow(prev, queued));
      alert.success("Block order queued");

      const last = await pollUntilDone(profileId, queued);
      if (last.operation_running) {
        alert.error("Block is still running. Refresh to check the latest status.");
      } else {
        alert.success(`Blocked. Outstanding quantity: ${last.outstanding}`);
      }
    } catch (e) {
      alert.error(e instanceof Error ? e.message : "Failed to block cash");
    } finally {
      setBusy((prev) => ({ ...prev, [profileId]: null }));
    }
  };

  const handleSell = async (profileId: number) => {
    setBusy((prev) => ({ ...prev, [profileId]: "sell" }));
    try {
      const queued = await sellCashPark(profileId);
      setRows((prev) => mergeRow(prev, queued));
      alert.success("Sell order queued");

      const last = await pollUntilDone(profileId, queued);
      if (last.operation_running) {
        alert.error("Sell is still running. Refresh to check the latest status.");
      } else {
        alert.success(`Sold. Outstanding quantity: ${last.outstanding}`);
      }
    } catch (e) {
      alert.error(e instanceof Error ? e.message : "Failed to sell cash park");
    } finally {
      setBusy((prev) => ({ ...prev, [profileId]: null }));
    }
  };

  return (
    <section className="rounded-lg border border-base-300 bg-base-100 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Cash park</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-outline btn-sm gap-1"
            disabled={refreshingAllCash || listLoading || rows.length === 0}
            onClick={() => void fetchCashForRows(rows)}
          >
            {refreshingAllCash ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <RefreshCw size={14} />
            )}
            Refresh cash
          </button>
          <button type="button" className="btn btn-primary btn-sm" disabled>
            Block all
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="table table-sm">
          <thead>
            <tr className="bg-base-200">
              <th>Client</th>
              <th>Broker</th>
              <th className="text-right">Available cash</th>
              <th className="text-right">Buy qty</th>
              <th className="text-right">Sell qty</th>
              <th className="text-right">Outstanding</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {listLoading ? (
              <tr>
                <td colSpan={8} className="text-center text-base-content/60 py-8">
                  <span className="loading loading-spinner loading-sm mr-2" />
                  Loading profiles...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center text-base-content/60 py-8">
                  No verified profiles
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const rowBusy = busy[row.profile_id];
                const fetchingCash = cashLoading[row.profile_id];
                return (
                  <tr key={row.profile_id}>
                    <td>
                      <div className="font-medium">{row.username}</div>
                      {row.email ? (
                        <div className="text-xs text-base-content/60">{row.email}</div>
                      ) : null}
                    </td>
                    <td>{row.broker_name || "—"}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {fetchingCash ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          <span className="tabular-nums">
                            {row.available_cash != null
                              ? `₹${formatMoneyIN(row.available_cash)}`
                              : "—"}
                          </span>
                        )}
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs btn-square"
                          title="Refresh cash"
                          disabled={!!fetchingCash}
                          onClick={() => void refreshOneCash(row)}
                        >
                          <RefreshCw className="size-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="text-right tabular-nums">{row.buy_quantity}</td>
                    <td className="text-right tabular-nums">{row.sell_quantity}</td>
                    <td className="text-right tabular-nums font-medium">
                      {row.outstanding}
                    </td>
                    <td>
                      <span className="badge badge-ghost badge-sm">{row.status}</span>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs btn-square"
                          title="View live positions & orders"
                          onClick={() => setLiveModalProfileId(row.profile_id)}
                        >
                          <Eye className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-xs"
                          disabled={!!rowBusy || row.operation_running}
                          onClick={() => handleBlock(row.profile_id)}
                        >
                          {rowBusy === "block" ? (
                            <span className="loading loading-spinner loading-xs" />
                          ) : (
                            "Block"
                          )}
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-xs"
                          disabled={
                            !!rowBusy ||
                            row.operation_running ||
                            row.outstanding <= 0
                          }
                          onClick={() => handleSell(row.profile_id)}
                        >
                          {rowBusy === "sell" ? (
                            <span className="loading loading-spinner loading-xs" />
                          ) : (
                            "Sell"
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {liveModalProfileId !== null ? (
        <ProfileLiveModal
          profileId={liveModalProfileId}
          onClose={() => setLiveModalProfileId(null)}
        />
      ) : null}
    </section>
  );
}
