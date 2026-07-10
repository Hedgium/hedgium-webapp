"use client";

import { useCallback, useEffect, useState } from "react";
import StrategyLegs from "./StrategyLegs";
import { authFetch } from "@/utils/api";
import { formatDateTimeMinutes } from "@/utils/formatDate";
import useAlert from "@/hooks/useAlert";
import { ChevronRight, Copy, Trash2 } from "lucide-react";

const ADJUSTMENTS_PAGE_SIZE = 3;

export interface AdjustmentLeg {
  leg_index: number;
  action: string;
  instrument: string;
  quantity: number;
  price?: number | null;
  order_type: string;
  exchange?: string;
  lot_size?: number;
  token?: string | null;
}

export interface AdjustmentData {
  id: number;
  version: number;
  title: string | null;
  notes?: string | null;
  auto_trade?: boolean;
  created_at: string;
  completed: boolean;
  approved: boolean;
  legs: AdjustmentLeg[];
}

interface PaginatedAdjustments {
  count: number;
  next: string | null;
  results: AdjustmentData[];
}

function Adjustment({
  adj,
  onDelete,
  onDuplicate,
  canDuplicate,
}: {
  adj: AdjustmentData;
  onDelete?: () => void;
  onDuplicate?: (adj: AdjustmentData) => void;
  canDuplicate?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [adjustment, setAdjustment] = useState(adj);
  const [deleting, setDeleting] = useState(false);
  const [togglingCompleted, setTogglingCompleted] = useState(false);

  const alert = useAlert();

  useEffect(() => {
    setAdjustment(adj);
  }, [adj]);

  async function toggleCompleted(adjId: number) {
    const newValue = !adjustment.completed;
    setTogglingCompleted(true);
    try {
      const res = await authFetch(`strategies/adjustments/${adjId}/`, {
        method: "PUT",
        body: JSON.stringify({ completed: newValue }),
      });
      if (res.ok) {
        setAdjustment((prev) => ({ ...prev, completed: newValue }));
        alert.success(newValue ? "Adjustment marked as completed." : "Adjustment marked as active.");
      } else {
        alert.error("Failed to update adjustment.");
      }
    } catch {
      alert.error("Error updating adjustment.");
    } finally {
      setTogglingCompleted(false);
    }
  }

  async function approveAdjustment(adjId: number) {
    try {
      const res = await authFetch(`myadmin/approve-adjustment/${adjId}/`, {
        method: "POST",
      });
      if (res.ok) {
        setAdjustment({ ...adjustment, approved: true });
        alert.success("Adjustment approved successfully.");
      } else {
        const data = await res.json().catch(() => ({}));
        alert.error(data?.message || "Failed to approve adjustment.");
      }
    } catch (error) {
      console.error("Error approving adjustment:", error);
      alert.error("Error approving adjustment.");
    }
  }

  async function deleteAdjustment(adjId: number) {
    if (
      !confirm(
        `Are you sure you want to delete adjustment v${adjustment.version}? This will also delete all associated legs.`
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const res = await authFetch(`strategies/adjustments/${adjId}/`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        alert.success(`Adjustment v${adjustment.version} deleted successfully`);
        onDelete?.();
      } else {
        alert.error("Failed to delete adjustment");
      }
    } catch (error) {
      console.error("Error deleting adjustment:", error);
      alert.error("Error deleting adjustment");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="border border-base-300 rounded-xl mb-2 bg-base-100/70">
      <div
        className="flex items-center justify-between px-4 py-2 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-4">
          <span className="font-bold">v{adjustment.version}</span>
          <span className="text-gray-700">{adjustment.title || "-"}</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm opacity-70">{formatDateTimeMinutes(adjustment.created_at)}</span>

          <label
            className="flex items-center gap-2 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
            title={adjustment.completed ? "Mark as active" : "Mark as completed"}
          >
            <span className="text-xs opacity-60">Completed</span>
            <input
              type="checkbox"
              className="toggle toggle-sm toggle-warning"
              checked={adjustment.completed}
              disabled={togglingCompleted}
              onChange={() => toggleCompleted(adjustment.id)}
            />
          </label>

          <button
            onClick={(e) => {
              e.stopPropagation();
              approveAdjustment(adjustment.id);
            }}
            className={`btn btn-sm ${adjustment.approved ? "btn-disabled" : "btn-success"}`}
          >
            {adjustment.approved ? "Approved" : "Approve"}
          </button>

          {canDuplicate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate?.(adjustment);
              }}
              disabled={adjustment.legs.length === 0}
              className="btn btn-sm btn-ghost"
              title={
                adjustment.legs.length === 0
                  ? "No legs to duplicate"
                  : "Duplicate this adjustment"
              }
            >
              <Copy size={14} />
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteAdjustment(adjustment.id);
            }}
            disabled={deleting || adjustment.approved}
            className="btn btn-sm btn-error btn-ghost"
            title={
              adjustment.approved
                ? "Cannot delete an approved adjustment"
                : "Delete adjustment and all its legs"
            }
          >
            {deleting ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              <Trash2 size={14} />
            )}
          </button>

          <ChevronRight
            className="size-5 shrink-0 text-base-content/60 transition-transform duration-200"
            style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
            aria-hidden
          />
        </div>
      </div>

      {open && (
        <div className="px-4 py-2 border-t border-base-300 rounded-xl bg-base-100">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Leg #</th>
                  <th>Action</th>
                  <th>Instrument</th>
                  <th>Qty</th>
                  <th>Order Type</th>
                  <th>Price</th>
                  <th>Edit</th>
                </tr>
              </thead>
              <tbody>
                <StrategyLegs legs={adjustment.legs} />
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Adjustments({
  strategyId,
  refreshVersion = 0,
  onRefresh,
  onDuplicate,
  canDuplicate = false,
}: {
  strategyId: number;
  refreshVersion?: number;
  onRefresh?: () => void;
  onDuplicate?: (adj: AdjustmentData) => void;
  canDuplicate?: boolean;
}) {
  const [adjustments, setAdjustments] = useState<AdjustmentData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchAdjustments = useCallback(
    async (page: number, append: boolean) => {
      const setBusy = append ? setLoadingMore : setLoading;
      setBusy(true);
      try {
        const res = await authFetch(
          `myadmin/strategies/${strategyId}/adjustments/?page=${page}&page_size=${ADJUSTMENTS_PAGE_SIZE}`
        );
        if (!res.ok) {
          throw new Error("Failed to fetch adjustments");
        }
        const data: PaginatedAdjustments = await res.json();
        setAdjustments((prev) => (append ? [...prev, ...data.results] : data.results));
        setTotalCount(data.count);
        setNextPage(data.next ? page + 1 : null);
      } catch (error) {
        console.error("Error fetching adjustments:", error);
      } finally {
        setBusy(false);
      }
    },
    [strategyId]
  );

  useEffect(() => {
    void fetchAdjustments(1, false);
  }, [fetchAdjustments, refreshVersion]);

  function handleDelete() {
    void fetchAdjustments(1, false);
    onRefresh?.();
  }

  const remaining = Math.max(totalCount - adjustments.length, 0);

  if (loading) {
    return (
      <div className="mt-2 space-y-2">
        {Array.from({ length: ADJUSTMENTS_PAGE_SIZE }).map((_, i) => (
          <div key={i} className="h-12 rounded-xl bg-base-300/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (adjustments.length === 0) {
    return <p className="mt-2 text-sm text-base-content/60">No adjustments yet.</p>;
  }

  return (
    <div className="mt-2">
      {adjustments.map((adj) => (
        <Adjustment
          key={adj.id}
          adj={adj}
          onDelete={handleDelete}
          onDuplicate={onDuplicate}
          canDuplicate={canDuplicate}
        />
      ))}
      {nextPage != null && (
        <div className="mt-2 flex justify-center">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={loadingMore}
            onClick={() => void fetchAdjustments(nextPage, true)}
          >
            {loadingMore ? "Loading..." : `Load more (${remaining} remaining)`}
          </button>
        </div>
      )}
    </div>
  );
}
