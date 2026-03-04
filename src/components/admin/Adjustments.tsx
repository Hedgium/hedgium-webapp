"use client";

import { useState } from "react";
import StrategyLegs from "./StrategyLegs";
import { authFetch } from "@/utils/api";
import { formatDateTimeMinutes } from "@/utils/formatDate";
import useAlert from "@/hooks/useAlert";
import { Trash2 } from "lucide-react";

function Adjustment({ adj, onDelete }) {
  const [open, setOpen] = useState(false);
  const [adjustment, setAdjustment] = useState(adj);
  const [deleting, setDeleting] = useState(false);
  const [togglingCompleted, setTogglingCompleted] = useState(false);

  const alert = useAlert();

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
      setAdjustment({ ...adjustment, approved: true });
      alert.success("Adjustment approved successfully.");
      const res = await authFetch(`myadmin/approve-adjustment/${adjId}/`, {
        method: "POST"
      });
      const data = await res.json();
      // console.log("Approved adjustment:", data);
    } catch (error) {
      console.error("Error approving adjustment:", error);
    }
  }

  async function deleteAdjustment(adjId: number) {
    if (!confirm(`Are you sure you want to delete adjustment v${adjustment.version}? This will also delete all associated legs.`)) {
      return;
    }

    setDeleting(true);
    try {
      const res = await authFetch(`strategies/adjustments/${adjId}/`, {
        method: "DELETE"
      });
      const data = await res.json();

      if (res.ok && data.success) {
        alert.success(`Adjustment v${adjustment.version} deleted successfully`);
        // Call parent callback to refresh strategy data
        if (onDelete) {
          onDelete();
        }
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
    <div className="border border-base-300 rounded-xl shadow mb-2 bg-base-100">

      {/* COLLAPSE HEADER */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-4">
          <span className="font-bold">v{adjustment.version}</span>
          <span className="text-gray-700">{adjustment.title || "-"}</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm opacity-70">{formatDateTimeMinutes(adjustment.created_at)}</span>

          {/* Completed toggle */}
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

          <button
            onClick={(e) => {
              e.stopPropagation(); // prevent dropdown toggle
              deleteAdjustment(adjustment.id);
            }}
            disabled={deleting || adjustment.approved}
            className="btn btn-sm btn-error btn-ghost"
            title={adjustment.approved ? "Cannot delete an approved adjustment" : "Delete adjustment and all its legs"}
          >
            {deleting
              ? <span className="loading loading-spinner loading-xs"></span>
              : <Trash2 size={14} />
            }
          </button>

          {/* Arrow */}
          <span className="transition-transform"
            style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
          >
            ▶
          </span>
        </div>
      </div>

      {/* COLLAPSE CONTENT */}
      {open && (
        <div className="p-4 border-t border-base-300 rounded-xl bg-base-100">
          {/* Notes */}
          {/* {adj.notes && (
            <p className="mb-3 text-sm text-gray-700">
              <strong>Notes:</strong> {adj.notes}
            </p>
          )} */}

          {/* Strategy Legs Table */}
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
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

export default function Adjustments({ adjustments, onRefresh }) {
  return (
    <div className="mt-2">
      {adjustments.map((adj) => (
        <Adjustment key={adj.id} adj={adj} onDelete={onRefresh} />
      ))}
    </div>
  );
}
